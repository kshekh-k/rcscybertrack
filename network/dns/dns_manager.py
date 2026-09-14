import logging
import os
import signal
import subprocess
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from network.network_manager import DNSConfig

logger = logging.getLogger("rcscybertrack.dns")


class DNSManager:
    """Manage the CyberTrack DNS service using a dedicated dnsmasq instance."""

    def __init__(
        self,
        config: DNSConfig,
        interface: str,
        listen_ip: str,
        runtime_dir: str = "/run/rcscybertrack",
        config_dir: str = "/etc/rcscybertrack",
        dnsmasq_binary: str = "/usr/sbin/dnsmasq",
        port: int = 53,
    ):
        self.config = config
        self.interface = interface
        self.listen_ip = listen_ip
        self.runtime_dir = Path(runtime_dir)
        self.config_dir = Path(config_dir)
        self.dnsmasq_binary = dnsmasq_binary
        self.port = port

        self.config_file = self.config_dir / "dnsmasq-dns.conf"
        self.pid_file = self.runtime_dir / "dnsmasq-dns.pid"

    def generate_config(self) -> str:
        lines = [
            "# RCS CyberTrack DNS configuration",
            "# Generated automatically - do not edit manually",
            "",
            f"interface={self.interface}",
            f"listen-address={self.listen_ip}",
            "bind-interfaces",
            f"port={self.port}",
            "no-hosts",
            "domain-needed",
            "bogus-priv",
        ]

        if self.config.cache.enabled:
            lines.append(f"cache-size={self.config.cache.size}")
        else:
            lines.append("cache-size=0")

        for server in self.config.forwarders:
            lines.append(f"server={server}")

        for record in self.config.local_records:
            hostname = record.hostname.strip()
            ip = record.ip.strip()
            if hostname:
                lines.append(f"address=/{hostname}/{ip}")

        lines.extend([
            "",
            f"pid-file={self.pid_file}",
            "log-queries",
        ])

        return "\n".join(lines) + "\n"

    def write_config(self) -> bool:
        try:
            self.config_dir.mkdir(parents=True, exist_ok=True)
            self.runtime_dir.mkdir(parents=True, exist_ok=True)

            self.config_file.write_text(
                self.generate_config(),
                encoding="utf-8",
            )

            return True

        except OSError as exc:
            logger.error("Failed to write DNS configuration: %s", exc)
            return False

    def _run(self, args: list[str]) -> bool:
        try:
            result = subprocess.run(
                args,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )

            if result.returncode != 0:
                logger.error(
                    "DNS command failed: %s stderr=%s",
                    " ".join(args),
                    result.stderr.strip(),
                )
                return False

            return True

        except (OSError, subprocess.SubprocessError) as exc:
            logger.error("DNS command exception: %s", exc)
            return False

    def validate_config(self) -> bool:
        if not self.write_config():
            return False

        return self._run([
            self.dnsmasq_binary,
            "--test",
            f"--conf-file={self.config_file}",
        ])

    def start(self) -> bool:
        if not self.validate_config():
            logger.error("CyberTrack DNS configuration validation failed")
            return False

        if self.status():
            logger.info("CyberTrack DNS is already running")
            return True

        try:
            result = subprocess.run(
                [
                    self.dnsmasq_binary,
                    f"--conf-file={self.config_file}",
                ],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )

            if result.returncode != 0:
                logger.error(
                    "Failed to start CyberTrack DNS: %s",
                    result.stderr.strip(),
                )
                return False

            if not self.status():
                logger.error("dnsmasq exited without creating its PID")
                return False

            logger.info(
                "CyberTrack DNS started on %s:%d",
                self.listen_ip,
                self.port,
            )
            return True

        except (OSError, subprocess.SubprocessError) as exc:
            logger.error("Failed to start DNS service: %s", exc)
            return False

    def stop(self) -> bool:
        if not self.pid_file.exists():
            return True

        try:
            pid = int(self.pid_file.read_text().strip())
        except (OSError, ValueError):
            return False

        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            self.pid_file.unlink(missing_ok=True)
            return True
        except OSError as exc:
            logger.error("Failed to stop DNS service: %s", exc)
            return False

        return True

    def status(self) -> bool:
        if not self.pid_file.exists():
            return False

        try:
            pid = int(self.pid_file.read_text().strip())
            os.kill(pid, 0)
            return True
        except (ValueError, ProcessLookupError, PermissionError, OSError):
            return False
