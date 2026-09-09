import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("rcscybertrack.forwarding")


class ForwardingBackend:
    """Backend abstraction for IPv4 forwarding state."""

    def read(self) -> bool:
        raise NotImplementedError

    def set_enabled(self, enabled: bool) -> bool:
        raise NotImplementedError


class LinuxForwardingBackend(ForwardingBackend):
    """Linux IPv4 forwarding backend.

    The backend is intentionally explicit about the privileged operation.
    Tests can replace it with MockForwardingBackend.
    """

    PROC_PATH = Path("/proc/sys/net/ipv4/ip_forward")

    def read(self) -> bool:
        try:
            value = self.PROC_PATH.read_text().strip()
            if value not in {"0", "1"}:
                raise ValueError(f"Unexpected ip_forward value: {value}")
            return value == "1"
        except (OSError, ValueError) as exc:
            logger.error("Unable to read IPv4 forwarding state: %s", exc)
            raise

    def set_enabled(self, enabled: bool) -> bool:
        value = "1" if enabled else "0"

        try:
            self.PROC_PATH.write_text(value)
            current = self.read()

            if current != enabled:
                logger.error(
                    "IPv4 forwarding verification failed: expected=%s actual=%s",
                    enabled,
                    current,
                )
                return False

            logger.info(
                "IPv4 forwarding %s",
                "enabled" if enabled else "disabled",
            )
            return True

        except OSError as exc:
            logger.error("Unable to change IPv4 forwarding state: %s", exc)
            return False


class MockForwardingBackend(ForwardingBackend):
    """Safe backend used by unit tests."""

    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self.set_calls = []

    def read(self) -> bool:
        return self.enabled

    def set_enabled(self, enabled: bool) -> bool:
        self.set_calls.append(enabled)
        self.enabled = enabled
        return True


class ForwardingManager:
    """High-level IPv4 forwarding controller."""

    def __init__(self, backend: Optional[ForwardingBackend] = None):
        self.backend = backend or LinuxForwardingBackend()

    def is_enabled(self) -> bool:
        return self.backend.read()

    def apply(self, enabled: bool) -> bool:
        if not isinstance(enabled, bool):
            raise ValueError("IPv4 forwarding state must be boolean")

        return self.backend.set_enabled(enabled)


forwarding_manager = ForwardingManager()
