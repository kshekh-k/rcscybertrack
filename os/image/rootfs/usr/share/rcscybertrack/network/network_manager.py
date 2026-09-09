import logging
import re
import ipaddress
from pathlib import Path
from typing import List, Optional
import yaml
from pydantic import BaseModel, Field, field_validator, ValidationError

logger = logging.getLogger("rcscybertrack.network")

# --- Helper Validators ---

def validate_ip(v: str) -> str:
    try:
        ipaddress.ip_address(v)
    except ValueError:
        raise ValueError(f"Invalid IP address: {v}")
    return v

def validate_cidr(v: str) -> str:
    if v.lower() == "default" or v == "0.0.0.0/0":
        return v
    try:
        ipaddress.ip_network(v, strict=False)
    except ValueError:
        raise ValueError(f"Invalid CIDR format: {v}")
    return v

def validate_mac_addr(v: str) -> str:
    if not re.match(r"^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$", v):
        raise ValueError(f"Invalid MAC address format: {v}")
    return v

# --- Pydantic Models ---

class IPv4Config(BaseModel):
    address: Optional[str] = None
    prefix: Optional[int] = Field(None, ge=0, le=32)
    dhcp: bool = False

    @field_validator("address")
    @classmethod
    def check_ip(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_ip(v)
        return v

class InterfaceConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=16)
    enabled: bool = True
    ipv4: IPv4Config

    @field_validator("name")
    @classmethod
    def check_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9\.\-_]+$", v):
            raise ValueError(f"Invalid interface name: {v}")
        return v

class RouteConfig(BaseModel):
    destination: str
    gateway: str
    interface: str
    metric: Optional[int] = Field(None, ge=0)

    @field_validator("destination")
    @classmethod
    def check_destination(cls, v: str) -> str:
        return validate_cidr(v)

    @field_validator("gateway")
    @classmethod
    def check_gateway(cls, v: str) -> str:
        return validate_ip(v)

class DHCPPool(BaseModel):
    interface: str
    range_start: str
    range_end: str
    gateway: str
    dns_servers: List[str] = Field(default_factory=list)
    lease_time: int = Field(86400, ge=60)

    @field_validator("range_start", "range_end", "gateway")
    @classmethod
    def check_ips(cls, v: str) -> str:
        return validate_ip(v)

    @field_validator("dns_servers")
    @classmethod
    def check_dns_ips(cls, v: List[str]) -> List[str]:
        for ip in v:
            validate_ip(ip)
        return v

class StaticReservation(BaseModel):
    mac: str
    ip: str
    hostname: str

    @field_validator("mac")
    @classmethod
    def check_mac(cls, v: str) -> str:
        return validate_mac_addr(v)

    @field_validator("ip")
    @classmethod
    def check_ip(cls, v: str) -> str:
        return validate_ip(v)

class DHCPConfig(BaseModel):
    pools: List[DHCPPool] = Field(default_factory=list)
    static_reservations: List[StaticReservation] = Field(default_factory=list)

class DNSRecord(BaseModel):
    hostname: str
    ip: str

    @field_validator("ip")
    @classmethod
    def check_ip(cls, v: str) -> str:
        return validate_ip(v)

class DNSCacheConfig(BaseModel):
    enabled: bool = True
    size: int = Field(4096, ge=0)

class DNSConfig(BaseModel):
    servers: List[str] = Field(default_factory=list)
    local_records: List[DNSRecord] = Field(default_factory=list)
    forwarders: List[str] = Field(default_factory=list)
    cache: DNSCacheConfig

    @field_validator("servers", "forwarders")
    @classmethod
    def check_ips(cls, v: List[str]) -> List[str]:
        for ip in v:
            validate_ip(ip)
        return v

# --- Network Adapter Interface (Abstraction Layer) ---

class NetworkAdapter:
    """Mockable network adapter interface to decouple host OS logic from test environment."""
    def apply_interfaces(self, interfaces: List[InterfaceConfig]) -> bool:
        raise NotImplementedError

    def apply_routes(self, routes: List[RouteConfig]) -> bool:
        raise NotImplementedError

    def apply_dhcp(self, dhcp: DHCPConfig) -> bool:
        raise NotImplementedError

    def apply_dns(self, dns: DNSConfig) -> bool:
        raise NotImplementedError

class MockNetworkAdapter(NetworkAdapter):
    """Simulated adapter for unit testing and safe-by-default environment."""
    def __init__(self):
        self.interfaces: List[InterfaceConfig] = []
        self.routes: List[RouteConfig] = []
        self.dhcp: Optional[DHCPConfig] = None
        self.dns: Optional[DNSConfig] = None

    def apply_interfaces(self, interfaces: List[InterfaceConfig]) -> bool:
        self.interfaces = interfaces
        logger.info("Mock applied %d network interfaces", len(interfaces))
        return True

    def apply_routes(self, routes: List[RouteConfig]) -> bool:
        self.routes = routes
        logger.info("Mock applied %d static routes", len(routes))
        return True

    def apply_dhcp(self, dhcp: DHCPConfig) -> bool:
        self.dhcp = dhcp
        logger.info("Mock applied DHCP configuration with %d pools", len(dhcp.pools))
        return True

    def apply_dns(self, dns: DNSConfig) -> bool:
        self.dns = dns
        logger.info("Mock applied DNS configuration with %d servers", len(dns.servers))
        return True


class LinuxNetworkAdapter(NetworkAdapter):
    """Real Linux networking backend for the CyberTrack appliance.

    Uses the system `ip` command for interface/address/route operations.
    DHCP/DNS are intentionally handled separately by their respective
    service managers; this adapter only applies kernel networking state.
    """

    def __init__(self, ip_binary: str = "/usr/sbin/ip"):
        self.ip_binary = ip_binary

    def _run(self, args: List[str]) -> bool:
        import subprocess

        cmd = [self.ip_binary] + args
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            if result.returncode != 0:
                logger.error(
                    "Linux networking command failed: %s stderr=%s",
                    " ".join(cmd),
                    result.stderr.strip(),
                )
                return False
            return True
        except (OSError, subprocess.SubprocessError) as exc:
            logger.error(
                "Linux networking command exception: %s",
                exc,
            )
            return False

    def apply_interfaces(self, interfaces: List[InterfaceConfig]) -> bool:
        success = True

        for interface in interfaces:
            name = interface.name

            if interface.enabled:
                if not self._run(["link", "set", "dev", name, "up"]):
                    success = False
                    continue
            else:
                if not self._run(["link", "set", "dev", name, "down"]):
                    success = False
                continue

            ipv4 = interface.ipv4

            if ipv4.dhcp:
                logger.warning(
                    "DHCP interface configuration requested for %s; "
                    "DHCP client is handled outside LinuxNetworkAdapter",
                    name,
                )
                continue

            if ipv4.address is None or ipv4.prefix is None:
                continue

            # Remove existing IPv4 addresses managed by CyberTrack.
            if not self._run(["-4", "addr", "flush", "dev", name]):
                success = False
                continue

            address = f"{ipv4.address}/{ipv4.prefix}"

            if not self._run(
                ["-4", "addr", "add", address, "dev", name]
            ):
                success = False

        return success

    def apply_routes(self, routes: List[RouteConfig]) -> bool:
        success = True

        for route in routes:
            destination = route.destination
            gateway = route.gateway
            interface = route.interface

            cmd = [
                "route",
                "replace",
                destination,
                "via",
                gateway,
                "dev",
                interface,
            ]

            if route.metric is not None:
                cmd.extend(["metric", str(route.metric)])

            if not self._run(cmd):
                success = False

        return success

    def apply_dhcp(self, dhcp: DHCPConfig) -> bool:
        # DHCP server lifecycle is intentionally not implemented in the
        # kernel adapter. It will be managed by the appliance DHCP service.
        logger.info(
            "DHCP configuration loaded: %d pool(s)",
            len(dhcp.pools),
        )
        return True

    def apply_dns(self, dns: DNSConfig) -> bool:
        # DNS service lifecycle is intentionally separate from kernel
        # interface configuration.
        logger.info(
            "DNS configuration loaded: %d server(s), %d forwarder(s)",
            len(dns.servers),
            len(dns.forwarders),
        )
        return True

# --- Network Manager ---

class NetworkManager:
    def __init__(self, adapter: Optional[NetworkAdapter] = None):
        self.adapter: NetworkAdapter = adapter or MockNetworkAdapter()
        self.interfaces: List[InterfaceConfig] = []
        self.routes: List[RouteConfig] = []
        self.dhcp: Optional[DHCPConfig] = None
        self.dns: Optional[DNSConfig] = None

    def load_interfaces(self, path: Path):
        if not path.exists():
            raise FileNotFoundError(f"Interfaces config not found: {path}")
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        
        interfaces_list = data.get("interfaces", [])
        validated = []
        for index, item in enumerate(interfaces_list):
            try:
                validated.append(InterfaceConfig(**item))
            except ValidationError as e:
                raise ValueError(f"Interface validation failed at index {index}: {e}")
        self.interfaces = validated

    def load_routes(self, path: Path):
        if not path.exists():
            raise FileNotFoundError(f"Routes config not found: {path}")
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        
        routes_list = data.get("routes", [])
        validated = []
        for index, item in enumerate(routes_list):
            try:
                validated.append(RouteConfig(**item))
            except ValidationError as e:
                raise ValueError(f"Route validation failed at index {index}: {e}")
        self.routes = validated

    def load_dhcp(self, path: Path):
        if not path.exists():
            raise FileNotFoundError(f"DHCP config not found: {path}")
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        
        dhcp_data = data.get("dhcp", {})
        try:
            self.dhcp = DHCPConfig(**dhcp_data)
        except ValidationError as e:
            raise ValueError(f"DHCP validation failed: {e}")

    def load_dns(self, path: Path):
        if not path.exists():
            raise FileNotFoundError(f"DNS config not found: {path}")
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        
        dns_data = data.get("dns", {})
        try:
            self.dns = DNSConfig(**dns_data)
        except ValidationError as e:
            raise ValueError(f"DNS validation failed: {e}")

    def apply_all(self) -> bool:
        success = True
        if self.interfaces:
            success = success and self.adapter.apply_interfaces(self.interfaces)
        if self.routes:
            success = success and self.adapter.apply_routes(self.routes)
        if self.dhcp:
            success = success and self.adapter.apply_dhcp(self.dhcp)
        if self.dns:
            success = success and self.adapter.apply_dns(self.dns)
        return success
