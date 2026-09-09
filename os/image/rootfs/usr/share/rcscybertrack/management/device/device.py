import datetime
import ipaddress
import json
import re
import socket
import subprocess
import uuid
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class Device(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hostname: str = Field(..., min_length=1, max_length=255)
    ip_address: str
    mac_address: str
    device_type: Literal[
        "router", "switch", "firewall", "ap",
        "server", "client", "iot"
    ]
    operating_system: Optional[str] = None
    status: Literal["online", "offline", "degraded"] = "online"
    last_seen: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    tags: List[str] = Field(default_factory=list)

    @field_validator("ip_address")
    @classmethod
    def check_ip(cls, v: str) -> str:
        try:
            ipaddress.ip_address(v)
        except ValueError:
            raise ValueError(f"Invalid IP address: {v}")
        return v

    @field_validator("mac_address")
    @classmethod
    def check_mac(cls, v: str) -> str:
        if not re.match(
            r"^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$",
            v,
        ):
            raise ValueError(f"Invalid MAC address format: {v}")
        return v


class DeviceRegistry:
    def __init__(self):
        # Existing known/seeded inventory.
        # These remain for compatibility, but discovery will add
        # real kernel-neighbor devices.
        self.devices: dict[str, Device] = {
            "dev-01": Device(
                id="dev-01",
                hostname="core-switch-01",
                ip_address="192.168.1.2",
                mac_address="00:11:22:33:44:55",
                device_type="switch",
                operating_system="RCS-SwitchOS 2.1",
                status="online",
                tags=["infrastructure", "backbone", "seeded"],
            ),
            "dev-02": Device(
                id="dev-02",
                hostname="admin-workstation",
                ip_address="192.168.2.50",
                mac_address="52:54:00:12:34:56",
                device_type="client",
                operating_system="Ubuntu 24.04 LTS",
                status="online",
                tags=["management", "desktop", "seeded"],
            ),
        }

    def list_devices(self) -> List[Device]:
        return list(self.devices.values())

    def get_device(self, device_id: str) -> Optional[Device]:
        return self.devices.get(device_id)

    def register_device(self, device: Device) -> Device:
        self.devices[device.id] = device
        return device

    def update_status(
        self,
        device_id: str,
        status: Literal["online", "offline", "degraded"],
    ) -> Optional[Device]:
        if device_id in self.devices:
            self.devices[device_id].status = status
            self.devices[device_id].last_seen = (
                datetime.datetime.now(datetime.timezone.utc)
            )
            return self.devices[device_id]
        return None

    @staticmethod
    def _hostname_for(ip: str) -> str:
        """
        Best-effort reverse DNS. If unavailable, use a deterministic
        hostname based on the observed address.
        """
        try:
            socket.setdefaulttimeout(0.5)
            name, _, _ = socket.gethostbyaddr(ip)
            if name:
                return name[:255]
        except (socket.timeout, OSError, socket.herror):
            pass

        return f"host-{ip.replace(':', '-').replace('.', '-')}"

    @staticmethod
    def _device_type(entry: dict) -> str:
        """
        Best-effort device classification.

        Linux ip-neigh output does not reliably expose the IPv6 router
        flag on every system, so gateway detection is based on the
        address being the default route gateway.
        """
        ip = entry.get("dst")

        if ip in DeviceRegistry._default_gateways():
            return "router"

        return "client"

    @staticmethod
    def _default_gateways() -> set[str]:
        """
        Read default IPv4/IPv6 gateways from the kernel routing table.

        This is read-only and does not perform network probing.
        """
        gateways: set[str] = set()

        try:
            result = subprocess.run(
                ["ip", "route", "show", "default"],
                capture_output=True,
                text=True,
                timeout=2,
                check=True,
            )

            for line in result.stdout.splitlines():
                parts = line.split()

                if "via" in parts:
                    idx = parts.index("via")
                    if idx + 1 < len(parts):
                        gateways.add(parts[idx + 1])
        except (subprocess.SubprocessError, OSError):
            pass

        try:
            result = subprocess.run(
                ["ip", "-6", "route", "show", "default"],
                capture_output=True,
                text=True,
                timeout=2,
                check=True,
            )

            for line in result.stdout.splitlines():
                parts = line.split()

                if "via" in parts:
                    idx = parts.index("via")
                    if idx + 1 < len(parts):
                        gateways.add(parts[idx + 1])
        except (subprocess.SubprocessError, OSError):
            pass

        return gateways

    @staticmethod
    def _stable_id(ip: str, mac: str) -> str:
        """
        Stable physical-device ID.

        MAC address is preferred because IPv4 and IPv6 neighbor entries
        for the same physical device can have different IP addresses.
        """
        normalized_mac = mac.lower().replace("-", ":")

        raw = normalized_mac.encode("utf-8")

        return "disc-" + uuid.uuid5(
            uuid.NAMESPACE_OID,
            raw.hex(),
        ).hex[:16]

    @staticmethod
    def _probe_reachability(ip: str) -> str:
        """
        Read-only reachability check.

        Uses the local system ping utility with a single probe.
        No firewall or network configuration is changed.

        Returns:
            online   -> host answered
            degraded -> probe timed out/failed transiently
        """
        try:
            address = ipaddress.ip_address(ip)

            if address.version == 6:
                command = ["ping", "-6", "-c", "1", "-W", "1", ip]
            else:
                command = ["ping", "-c", "1", "-W", "1", ip]

            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
            )

            return "online" if result.returncode == 0 else "degraded"

        except (
            subprocess.SubprocessError,
            OSError,
            ValueError,
        ):
            return "degraded"

    def discover_devices(self) -> List[Device]:
        """
        Safe, read-only discovery using the Linux kernel neighbor table.

        This does NOT:
        - scan subnets
        - send probes
        - run nmap
        - modify firewall/network state

        Docker/virtual bridge interfaces are intentionally excluded.
        """

        try:
            result = subprocess.run(
                ["ip", "-j", "neigh", "show"],
                capture_output=True,
                text=True,
                timeout=3,
                check=True,
            )
        except (
            subprocess.SubprocessError,
            OSError,
        ):
            return []

        try:
            entries = json.loads(result.stdout or "[]")
        except json.JSONDecodeError:
            return []

        now = datetime.datetime.now(datetime.timezone.utc)
        discovered: List[Device] = []

        ignored_ifaces = {
            "docker0",
        }

        for entry in entries:
            ip = entry.get("dst")
            mac = entry.get("lladdr")
            interface = entry.get("dev")
            state = entry.get("state", [])

            if not ip or not mac or not interface:
                continue

            # Ignore Docker/virtual bridge networks.
            if (
                interface.startswith("br-")
                or interface.startswith("docker")
                or interface.startswith("veth")
                or interface in ignored_ifaces
            ):
                continue

            # Ignore incomplete/failed neighbor records.
            states = state if isinstance(state, list) else [state]
            states = {str(s).upper() for s in states}

            if states.intersection({"FAILED", "INCOMPLETE"}):
                continue

            device_id = self._stable_id(ip, mac)
            existing = self.devices.get(device_id)

            # Kernel-neighbor state tells us that the address exists
            # in the local neighbor table, but it is not by itself a
            # reliable live-health signal. Perform one read-only probe.
            status = self._probe_reachability(ip)

            # Preserve a useful distinction when the kernel has an
            # explicitly failed/incomplete state.
            if states.intersection({"FAILED", "INCOMPLETE"}):
                status = "offline"

            hostname = (
                existing.hostname
                if existing
                else self._hostname_for(ip)
            )

            detected_type = self._device_type(entry)

            # One physical device can have IPv4 and IPv6 neighbor
            # entries. Never downgrade an identified router to client.
            if existing is not None and existing.device_type == "router":
                detected_type = "router"

            device = Device(
                id=device_id,
                hostname=hostname,
                ip_address=ip,
                mac_address=mac,
                device_type=detected_type,
                operating_system=(
                    existing.operating_system if existing else None
                ),
                status=status,
                last_seen=now,
                tags=(
                    existing.tags
                    if existing is not None
                    else [
                        "discovered",
                        "kernel-neighbor",
                        interface,
                    ]
                ),
            )

            self.devices[device.id] = device

            # IPv4 and IPv6 entries with the same MAC represent one
            # physical device, so return it only once.
            existing_index = next(
                (
                    index
                    for index, item in enumerate(discovered)
                    if item.id == device.id
                ),
                None,
            )

            if existing_index is None:
                discovered.append(device)
            else:
                discovered[existing_index] = device

        return discovered
