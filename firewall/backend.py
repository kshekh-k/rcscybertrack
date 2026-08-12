from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
from pydantic import BaseModel, Field

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
    def validate(self, policy: Dict, rules: List[Dict]) -> Tuple[bool, str]:
        """Validate firewall rules syntax and parameters."""
        pass

    @abstractmethod
    def compile(self, policy: Dict, rules: List[Dict]) -> str:
        """Compile policy and typed rules into deterministic nftables syntax."""
        pass

    @abstractmethod
    def apply(self, policy: Dict, rules: List[Dict]) -> Tuple[bool, str]:
        """Atomically apply compiled ruleset to table inet rcs_cybertrack."""
        pass

    @abstractmethod
    def verify(self) -> Tuple[bool, str]:
        """Verify applied ruleset exists and matches expectation."""
        pass

    @abstractmethod
    def rollback(self, previous_ruleset: str) -> Tuple[bool, str]:
        """Atomically restore previous ruleset snapshot."""
        pass
