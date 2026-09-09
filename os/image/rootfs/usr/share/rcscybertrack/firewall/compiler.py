import re
import ipaddress
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator

FORBIDDEN_PATTERNS = re.compile(r"[;$&|`\n\r\t\0'\"]|\b(exec|system|cmd|shell|eval|bash|sh|sudo|python|perl)\b", re.IGNORECASE)

def _get_ip_version(addr_str: str) -> Optional[int]:
    if not addr_str or addr_str.lower() == "any":
        return None
    try:
        if "/" in addr_str:
            return ipaddress.ip_network(addr_str, strict=False).version
        return ipaddress.ip_address(addr_str).version
    except ValueError:
        return None

class AddressPortModel(BaseModel):
    address: str = "any"
    port: Optional[Union[int, str]] = None

    @field_validator("address")
    @classmethod
    def validate_ip_cidr(cls, v: str) -> str:
        if FORBIDDEN_PATTERNS.search(v):
            raise ValueError("Input contains forbidden characters or command strings")
        if v.lower() == "any":
            return "any"
        try:
            if "/" in v:
                ipaddress.ip_network(v, strict=False)
            else:
                ipaddress.ip_address(v)
        except ValueError:
            raise ValueError(f"Invalid IP address or CIDR range: '{v}'")
        return v

    @field_validator("port")
    @classmethod
    def validate_port(cls, v: Optional[Union[int, str]]) -> Optional[Union[int, str]]:
        if v is None:
            return None
        if isinstance(v, str) and FORBIDDEN_PATTERNS.search(v):
            raise ValueError("Port string contains invalid characters")
        if isinstance(v, int):
            if not (1 <= v <= 65535):
                raise ValueError(f"Port number {v} out of bounds (1-65535)")
            return v
        if isinstance(v, str):
            if ":" in v or "-" in v:
                delimiter = ":" if ":" in v else "-"
                parts = v.split(delimiter)
                if len(parts) != 2:
                    raise ValueError("Port range format must be 'start:end' or 'start-end'")
                try:
                    p1, p2 = int(parts[0]), int(parts[1])
                    if not (1 <= p1 <= 65535) or not (1 <= p2 <= 65535) or p1 > p2:
                        raise ValueError("Invalid port range bounds")
                    return f"{p1}-{p2}"
                except ValueError:
                    raise ValueError("Port range bounds must be valid integers")
            else:
                try:
                    val = int(v)
                    if not (1 <= val <= 65535):
                        raise ValueError(f"Port number {v} out of bounds (1-65535)")
                    return val
                except ValueError:
                    raise ValueError(f"Invalid port value '{v}'")
        return v

class FirewallRuleModel(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    action: str = Field("allow", pattern="^(allow|deny|reject)$")
    direction: str = Field("input", pattern="^(input|output|forward)$")
    interface: Optional[str] = None
    protocol: str = Field("any", pattern="^(tcp|udp|icmp|icmpv6|any)$")
    source: AddressPortModel = Field(default_factory=AddressPortModel)
    destination: AddressPortModel = Field(default_factory=AddressPortModel)
    state: List[str] = Field(default_factory=list)
    logging: bool = False

    @field_validator("id", "interface", "protocol")
    @classmethod
    def check_safe_string(cls, v: Optional[str]) -> Optional[str]:
        if v and FORBIDDEN_PATTERNS.search(v):
            raise ValueError("Field contains forbidden characters")
        return v

class PolicyConfigModel(BaseModel):
    input: str = Field("drop", pattern="^(accept|drop|reject|allow|deny)$")
    output: str = Field("accept", pattern="^(accept|drop|reject|allow|deny)$")
    forward: str = Field("drop", pattern="^(accept|drop|reject|allow|deny)$")
    api_port: int = Field(8000, ge=1, le=65535)
    ssh_port: int = Field(22, ge=1, le=65535)

def _map_action(action: str) -> str:
    if action in ("allow", "accept"):
        return "accept"
    if action in ("deny", "drop"):
        return "drop"
    return "reject"


class NATConfigModel(BaseModel):
    """Validated IPv4 forwarding and NAT configuration."""

    enabled: bool = True
    forwarding_enabled: bool = True
    wan_interface: str = Field(..., min_length=1, max_length=16)
    lan_interface: str = Field(..., min_length=1, max_length=16)
    lan_subnet: str = Field(..., min_length=7, max_length=18)

    @field_validator("wan_interface", "lan_interface")
    @classmethod
    def validate_interface(cls, v: str) -> str:
        if FORBIDDEN_PATTERNS.search(v):
            raise ValueError("Interface contains forbidden characters")
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError(f"Invalid interface name: {v}")
        return v

    @field_validator("lan_subnet")
    @classmethod
    def validate_lan_subnet(cls, v: str) -> str:
        if FORBIDDEN_PATTERNS.search(v):
            raise ValueError("LAN subnet contains forbidden characters")
        try:
            network = ipaddress.ip_network(v, strict=False)
        except ValueError:
            raise ValueError(f"Invalid LAN subnet: '{v}'")
        if network.version != 4:
            raise ValueError("NAT LAN subnet must be IPv4")
        return str(network)


class NftablesCompiler:
    TABLE_NAME = "rcs_cybertrack"

    def compile(self, policy: Dict, rules: List[Dict], nat: Optional[Dict] = None) -> str:
        # Validate Pydantic models
        pol = PolicyConfigModel(**policy)
        validated_rules = [FirewallRuleModel(**r) for r in rules]

        nat_config = None
        if nat is not None:
            nat_config = NATConfigModel(**nat)
            if nat_config.wan_interface == nat_config.lan_interface:
                raise ValueError("WAN and LAN interfaces must be different")

        # Duplicate ID and IP family mismatch check
        rule_ids = set()
        for r in validated_rules:
            if r.id in rule_ids:
                raise ValueError(f"Duplicate firewall rule ID detected: '{r.id}'")
            rule_ids.add(r.id)

            src_ver = _get_ip_version(r.source.address)
            dst_ver = _get_ip_version(r.destination.address)
            if src_ver and dst_ver and src_ver != dst_ver:
                raise ValueError(f"Cannot combine IPv4 ({r.source.address}) and IPv6 ({r.destination.address}) in a single rule")

        lines = [
            f"# RCS CyberTrack Managed Firewall Ruleset",
            f"# Table Ownership: inet {self.TABLE_NAME}",
            f"table inet {self.TABLE_NAME}",
            f"flush table inet {self.TABLE_NAME}",
            f"table inet {self.TABLE_NAME} {{",
        ]

        # 1. INPUT Chain
        lines.append("    chain input {")
        lines.append(f"        type filter hook input priority 0; policy {_map_action(pol.input)};")
        lines.append('        iifname "lo" accept comment "rcscybertrack:mgmt-loopback"')
        lines.append('        ct state { established, related } accept comment "rcscybertrack:mgmt-state"')
        lines.append(f'        tcp dport {pol.api_port} accept comment "rcscybertrack:mgmt-api"')
        lines.append(f'        tcp dport {pol.ssh_port} accept comment "rcscybertrack:mgmt-ssh"')

        for r in validated_rules:
            if r.direction == "input":
                lines.append(f"        {self._build_rule_expr(r)}")
        lines.append("    }")

        # 2. FORWARD Chain
        lines.append("    chain forward {")
        lines.append(f"        type filter hook forward priority 0; policy {_map_action(pol.forward)};")

        # Stateful forwarding baseline for enabled NAT configuration.
        # Only established/related return traffic is accepted automatically.
        if nat_config and nat_config.enabled and nat_config.forwarding_enabled:
            lines.append(
                f'        iifname "{nat_config.lan_interface}" '
                f'oifname "{nat_config.wan_interface}" '
                f'ip saddr {nat_config.lan_subnet} ct state new,established,related '
                f'accept comment "rcscybertrack:nat:lan-to-wan"'
            )
            lines.append(
                f'        iifname "{nat_config.wan_interface}" '
                f'oifname "{nat_config.lan_interface}" '
                f'ct state established,related '
                f'accept comment "rcscybertrack:nat:wan-return"'
            )

        for r in validated_rules:
            if r.direction == "forward":
                lines.append(f"        {self._build_rule_expr(r)}")
        lines.append("    }")

        # 3. OUTPUT Chain
        lines.append("    chain output {")
        lines.append(f"        type filter hook output priority 0; policy {_map_action(pol.output)};")
        lines.append('        oifname "lo" accept comment "rcscybertrack:mgmt-loopback"')
        for r in validated_rules:
            if r.direction == "output":
                lines.append(f"        {self._build_rule_expr(r)}")
        lines.append("    }")

        lines.append("}")

        # IPv4 NAT is deliberately kept in a separate table.
        # The filter table above remains independently managed.
        if nat_config and nat_config.enabled:
            lines.extend([
                "",
                "# RCS CyberTrack IPv4 NAT",
                "table ip rcs_cybertrack_nat {",
                "    chain postrouting {",
                '        type nat hook postrouting priority 100; policy accept;',
                f'        oifname "{nat_config.wan_interface}" '
                f'ip saddr {nat_config.lan_subnet} '
                'masquerade comment "rcscybertrack:nat:masquerade"',
                "    }",
                "}"
            ])

        return "\n".join(lines)

    def _build_rule_expr(self, r: FirewallRuleModel) -> str:
        parts = []
        if r.interface:
            if r.direction == "input":
                parts.append(f'iifname "{r.interface}"')
            elif r.direction == "output":
                parts.append(f'oifname "{r.interface}"')
            else:
                parts.append(f'iifname "{r.interface}"')

        src_ver = _get_ip_version(r.source.address)
        dst_ver = _get_ip_version(r.destination.address)
        is_ipv6 = (src_ver == 6 or dst_ver == 6 or r.protocol == "icmpv6")

        if r.source.address != "any":
            prefix = "ip6 saddr" if is_ipv6 else "ip saddr"
            parts.append(f"{prefix} {r.source.address}")

        if r.destination.address != "any":
            prefix = "ip6 daddr" if is_ipv6 else "ip daddr"
            parts.append(f"{prefix} {r.destination.address}")

        if r.protocol in ("tcp", "udp"):
            parts.append(r.protocol)
            if r.source.port is not None:
                parts.append(f"sport {str(r.source.port).replace(':', '-')}")
            if r.destination.port is not None:
                parts.append(f"dport {str(r.destination.port).replace(':', '-')}")
        elif r.protocol == "icmpv6":
            parts.append("ip6 nexthdr icmpv6")
        elif r.protocol == "icmp":
            parts.append("ip protocol icmp")

        if r.state:
            parts.append(f"ct state {{ {', '.join(r.state)} }}")

        if r.logging:
            parts.append(f'log prefix "rcscybertrack:{r.id}: "')

        parts.append(_map_action(r.action))
        parts.append(f'comment "rcscybertrack:rule:{r.id}"')
        return " ".join(parts)

compiler = NftablesCompiler()
