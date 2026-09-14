from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
from pydantic import BaseModel


class BackendStatus(BaseModel):
    available: bool
    version: Optional[str] = "unknown"
    backend: str = "nftables"
    table_owned: bool = False
    table_name: str = "rcs_cybertrack"
    reason: Optional[str] = None
    rule_count: int = 0


class FirewallBackend(ABC):

    @abstractmethod
    def discover(self) -> BackendStatus:
        """Read-only discovery detecting nftables availability, version, and table ownership."""
        pass

    @abstractmethod
    def validate(self, policy: Dict, rules: List[Dict], nat: Optional[Dict] = None) -> Tuple[bool, str]:
        """Validate firewall rules and optional NAT configuration."""
        pass

    @abstractmethod
    def compile(self, policy: Dict, rules: List[Dict], nat: Optional[Dict] = None) -> str:
        """Compile firewall policy, rules and optional NAT into nftables syntax."""
        pass

    @abstractmethod
    def apply(self, policy: Dict, rules: List[Dict], nat: Optional[Dict] = None) -> Tuple[bool, str]:
        """Atomically apply compiled firewall and optional NAT ruleset."""
        pass

    @abstractmethod
    def verify(self) -> Tuple[bool, str]:
        """Verify applied ruleset exists and matches expectation."""
        pass

    @abstractmethod
    def rollback(self, previous_ruleset: str) -> Tuple[bool, str]:
        """Atomically restore previous ruleset snapshot."""
        pass
