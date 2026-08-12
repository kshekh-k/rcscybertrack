import os
import logging
import subprocess
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Literal, Optional, Union
import yaml
from pydantic import BaseModel, Field, field_validator, ValidationError

logger = logging.getLogger("rcscybertrack.firewall")

# --- Pydantic Models for Firewall Configuration ---

class AddressPortModel(BaseModel):
    address: str = "any"  # Can be "any", an IP, or a CIDR range
    port: Optional[Union[int, str]] = None  # Port number or range (e.g. "80:90")

    @field_validator("address")
    @classmethod
    def validate_ip_cidr(cls, v: str) -> str:
        if v.lower() == "any":
            return "any"
        
        # Simple IP/CIDR validation
        import ipaddress
        try:
            if "/" in v:
                ipaddress.ip_network(v, strict=False)
            else:
                ipaddress.ip_address(v)
        except ValueError:
            raise ValueError(f"Invalid IP address or CIDR network: {v}")
        return v

    @field_validator("port")
    @classmethod
    def validate_port(cls, v: Optional[Union[int, str]]) -> Optional[Union[int, str]]:
        if v is None:
            return v
        if isinstance(v, int):
            if not (1 <= v <= 65535):
                raise ValueError("Port must be between 1 and 65535")
            return v
        if isinstance(v, str):
            if ":" in v:
                parts = v.split(":")
                if len(parts) != 2:
                    raise ValueError("Port range must be in 'start:end' format")
                try:
                    start, end = int(parts[0]), int(parts[1])
                    if not (1 <= start <= 65535) or not (1 <= end <= 65535) or start > end:
                        raise ValueError("Invalid port range boundaries")
                except ValueError:
                    raise ValueError("Port range bounds must be integers")
            else:
                try:
                    port_val = int(v)
                    if not (1 <= port_val <= 65535):
                        raise ValueError("Port must be between 1 and 65535")
                    return port_val
                except ValueError:
                    raise ValueError("Port must be a valid integer or port range")
        return v

class FirewallRule(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    action: Literal["allow", "deny", "reject"]
    direction: Literal["input", "output", "forward"] = "input"
    interface: Optional[str] = None
    protocol: Literal["tcp", "udp", "icmp", "any"] = "any"
    source: AddressPortModel = Field(default_factory=AddressPortModel)
    destination: AddressPortModel = Field(default_factory=AddressPortModel)
    state: List[Literal["new", "established", "related"]] = Field(default_factory=list)
    logging: bool = False

class PolicyConfig(BaseModel):
    input: Literal["accept", "drop", "reject"] = "drop"
    output: Literal["accept", "drop", "reject"] = "accept"
    forward: Literal["accept", "drop", "reject"] = "drop"

# --- Backend Abstraction Layer ---

class FirewallBackend(ABC):
    @abstractmethod
    def apply(self, policy: PolicyConfig, rules: List[FirewallRule]) -> bool:
        """Applies the policy and rules to the OS firewall."""
        pass

    @abstractmethod
    def generate_config(self, policy: PolicyConfig, rules: List[FirewallRule]) -> str:
        """Returns the configuration string generated for the backend."""
        pass

class MockBackend(FirewallBackend):
    """Mock backend that simulates rule compilation and application."""
    def __init__(self):
        self.applied_rules: List[FirewallRule] = []
        self.applied_policy: Optional[PolicyConfig] = None
        self.last_generated_config: str = ""

    def generate_config(self, policy: PolicyConfig, rules: List[FirewallRule]) -> str:
        lines = [
            "# RCS CyberTrack Mock Firewall Config",
            f"default-policies: INPUT={policy.input}, OUTPUT={policy.output}, FORWARD={policy.forward}",
            "rules:"
        ]
        for r in rules:
            lines.append(f"  - rule {r.id}: {r.action.upper()} {r.direction.upper()} "
                         f"proto={r.protocol} src={r.source.address}:{r.source.port} "
                         f"dst={r.destination.address}:{r.destination.port} state={','.join(r.state)}")
        self.last_generated_config = "\n".join(lines)
        return self.last_generated_config

    def apply(self, policy: PolicyConfig, rules: List[FirewallRule]) -> bool:
        self.applied_policy = policy
        self.applied_rules = rules
        self.generate_config(policy, rules)
        logger.info("Successfully mock-applied %d firewall rules", len(rules))
        return True

class NftablesBackend(FirewallBackend):
    """Concrete nftables backend compiling configurations into nftables syntax."""
    
    def generate_config(self, policy: PolicyConfig, rules: List[FirewallRule]) -> str:
        lines = [
            "#!/usr/sbin/nft -f",
            "table inet rcs_cybertrack {",
        ]
        
        # Build INPUT chain
        lines.append("    chain input {")
        lines.append(f"        type filter hook input priority 0; policy {self._map_action(policy.input)};")
        for rule in rules:
            if rule.direction == "input":
                lines.append(f"        {self._build_nft_rule(rule)}")
        lines.append("    }")
        
        # Build FORWARD chain
        lines.append("    chain forward {")
        lines.append(f"        type filter hook forward priority 0; policy {self._map_action(policy.forward)};")
        for rule in rules:
            if rule.direction == "forward":
                lines.append(f"        {self._build_nft_rule(rule)}")
        lines.append("    }")
        
        # Build OUTPUT chain
        lines.append("    chain output {")
        lines.append(f"        type filter hook output priority 0; policy {self._map_action(policy.output)};")
        for rule in rules:
            if rule.direction == "output":
                lines.append(f"        {self._build_nft_rule(rule)}")
        lines.append("    }")
        
        lines.append("}")
        return "\n".join(lines)

    def apply(self, policy: PolicyConfig, rules: List[FirewallRule]) -> bool:
        config_str = self.generate_config(policy, rules)
        logger.info("Applying generated nftables configuration...")
        
        # Dry-run check first using nft -c
        try:
            process = subprocess.Popen(
                ["nft", "-c", "-f", "-"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=config_str)
            if process.returncode != 0:
                logger.error("nftables validation failed: %s", stderr)
                return False
        except FileNotFoundError:
            # nft command is not installed on this system
            logger.warning("nft command not found. Simulating application.")
            return True

        # Apply configuration
        try:
            process = subprocess.Popen(
                ["nft", "-f", "-"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=config_str)
            if process.returncode != 0:
                logger.error("Failed to apply nftables ruleset: %s", stderr)
                return False
            logger.info("Successfully applied nftables ruleset.")
            return True
        except Exception as e:
            logger.error("Exception occurred while applying nftables ruleset: %s", e)
            return False

    def _map_action(self, action: str) -> str:
        if action == "allow":
            return "accept"
        if action == "deny":
            return "drop"
        return action

    def _build_nft_rule(self, rule: FirewallRule) -> str:
        parts = []
        
        # Interface matching
        if rule.interface:
            if rule.direction == "input":
                parts.append(f'iifname "{rule.interface}"')
            elif rule.direction == "output":
                parts.append(f'oifname "{rule.interface}"')
            else:
                # For forward, we match either, but let's assume incoming interface
                parts.append(f'iifname "{rule.interface}"')
        
        # Source IP match
        if rule.source.address != "any":
            parts.append(f"ip saddr {rule.source.address}")
            
        # Destination IP match
        if rule.destination.address != "any":
            parts.append(f"ip daddr {rule.destination.address}")

        # Protocol & Port matching
        if rule.protocol in ("tcp", "udp"):
            parts.append(rule.protocol)
            # Source port
            if rule.source.port is not None:
                sport = str(rule.source.port).replace(":", "-")
                parts.append(f"sport {sport}")
            # Destination port
            if rule.destination.port is not None:
                dport = str(rule.destination.port).replace(":", "-")
                parts.append(f"dport {dport}")
        elif rule.protocol == "icmp":
            parts.append("ip protocol icmp")

        # Connection state matching
        if rule.state:
            states = ", ".join(rule.state)
            parts.append(f"ct state {{ {states} }}")

        # Logging prefix
        if rule.logging:
            parts.append(f'log prefix "rcscybertrack:{rule.id}: "')

        # Action mapping
        parts.append(self._map_action(rule.action))

        return " ".join(parts)

# --- Central Firewall Engine ---

class FirewallEngine:
    def __init__(self, backend_type: Literal["nftables", "mock"] = "mock"):
        if backend_type == "nftables":
            self.backend: FirewallBackend = NftablesBackend()
        else:
            self.backend = MockBackend()
        self.policy: Optional[PolicyConfig] = None
        self.rules: List[FirewallRule] = []

    def load_policy(self, policy_path: Path):
        """Loads and validates default firewall policy from YAML."""
        if not policy_path.exists():
            raise FileNotFoundError(f"Policy file not found at {policy_path}")
        with open(policy_path, "r") as f:
            data = yaml.safe_load(f) or {}
            
        policy_data = data.get("default_policy", {})
        try:
            self.policy = PolicyConfig(**policy_data)
        except ValidationError as e:
            raise ValueError(f"Policy validation failed: {e}")

    def load_rules(self, rules_path: Path):
        """Loads and validates firewall rules from YAML."""
        if not rules_path.exists():
            raise FileNotFoundError(f"Rules file not found at {rules_path}")
        with open(rules_path, "r") as f:
            data = yaml.safe_load(f) or {}
            
        rules_list = data.get("rules", [])
        validated_rules = []
        for index, r in enumerate(rules_list):
            try:
                validated_rules.append(FirewallRule(**r))
            except ValidationError as e:
                raise ValueError(f"Rule validation failed at index {index} (ID: {r.get('id', 'unknown')}): {e}")
        self.rules = validated_rules

    def apply(self) -> bool:
        """Applies the current policy and rules using the backend."""
        if not self.policy:
            raise ValueError("No policy loaded. Please load policy first.")
        return self.backend.apply(self.policy, self.rules)

    def generate_config(self) -> str:
        """Generates configuration code for the current policy and rules."""
        if not self.policy:
            raise ValueError("No policy loaded.")
        return self.backend.generate_config(self.policy, self.rules)
