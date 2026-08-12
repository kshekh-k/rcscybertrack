import re
import ipaddress
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator

FORBIDDEN_PATTERNS = re.compile(r"[;$&|`\n\r]|\b(exec|system|cmd|shell|eval)\b", re.IGNORECASE)

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
    protocol: str = Field("any", pattern="^(tcp|udp|icmp|any)$")
    source: AddressPortModel = Field(default_factory=AddressPortModel)
    destination: AddressPortModel = Field(default_factory=AddressPortModel)
    state: List[str] = Field(default_factory=list)
    logging: bool = False

    @field_validator("id", "interface")
    @classmethod
    def check_safe_string(cls, v: Optional[str]) -> Optional[str]:
        if v and FORBIDDEN_PATTERNS.search(v):
            raise ValueError("Field contains forbidden characters")
        return v

class PolicyConfigModel(BaseModel):
    input: str = Field("drop", pattern="^(accept|drop|reject|allow|deny)$")
    output: str = Field("accept", pattern="^(accept|drop|reject|allow|deny)$")
    forward: str = Field("drop", pattern="^(accept|drop|reject|allow|deny)$")

def _map_action(action: str) -> str:
    if action in ("allow", "accept"):
        return "accept"
    if action in ("deny", "drop"):
        return "drop"
    return "reject"

class NftablesCompiler:
    TABLE_NAME = "rcs_cybertrack"

    def compile(self, policy: Dict, rules: List[Dict]) -> str:
        # Validate Pydantic models
        pol = PolicyConfigModel(**policy)
        validated_rules = [FirewallRuleModel(**r) for r in rules]

        # Duplicate ID check
        rule_ids = set()
        for r in validated_rules:
            if r.id in rule_ids:
                raise ValueError(f"Duplicate firewall rule ID detected: '{r.id}'")
            rule_ids.add(r.id)

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
        lines.append('        tcp dport 8000 accept comment "rcscybertrack:mgmt-api"')
        lines.append('        tcp dport 22 accept comment "rcscybertrack:mgmt-ssh"')

        for r in validated_rules:
            if r.direction == "input":
                lines.append(f"        {self._build_rule_expr(r)}")
        lines.append("    }")

        # 2. FORWARD Chain
        lines.append("    chain forward {")
        lines.append(f"        type filter hook forward priority 0; policy {_map_action(pol.forward)};")
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

        if r.source.address != "any":
            parts.append(f"ip saddr {r.source.address}")

        if r.destination.address != "any":
            parts.append(f"ip daddr {r.destination.address}")

        if r.protocol in ("tcp", "udp"):
            parts.append(r.protocol)
            if r.source.port is not None:
                parts.append(f"sport {str(r.source.port).replace(':', '-')}")
            if r.destination.port is not None:
                parts.append(f"dport {str(r.destination.port).replace(':', '-')}")
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
