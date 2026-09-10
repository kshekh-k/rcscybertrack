import os
import yaml
from pathlib import Path
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, ValidationError

class SystemConfig(BaseModel):
    hostname: str = Field(..., min_length=1, max_length=255)
    timezone: str = Field("UTC")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @field_validator("hostname")
    @classmethod
    def validate_hostname(cls, v: str) -> str:
        # Hostname RFC 1123 validation checks
        import re
        if not re.match(r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$", v):
            raise ValueError("Hostname must be RFC 1123 compliant")
        return v

class APIConfig(BaseModel):
    enabled: bool = True
    host: str = "127.0.0.1"
    port: int = Field(8000, ge=1, le=65535)

class ManagementConfig(BaseModel):
    api: APIConfig

class NATConfig(BaseModel):
    enabled: bool = True
    forwarding_enabled: bool = True
    wan_interface: str = Field(..., min_length=1, max_length=16)
    lan_interface: str = Field(..., min_length=1, max_length=16)
    lan_subnet: str = Field(..., min_length=7, max_length=18)


class FirewallConfig(BaseModel):
    enabled: bool = True
    backend: Literal["nftables", "mock"] = "nftables"
    nat: Optional[NATConfig] = None

class NetworkConfig(BaseModel):
    interfaces: dict = Field(default_factory=dict)
    routing: dict = Field(default_factory=dict)
    dhcp: dict = Field(default_factory=dict)
    dns: dict = Field(default_factory=dict)

class CaptivePortalConfig(BaseModel):
    enabled: bool = False
    interface: str = "eth1"
    subnet: str = "192.168.2.0/24"
    listen_host: str = "192.168.2.1"
    listen_port: int = 8080
    session_timeout_minutes: int = 60

class VPNConfig(BaseModel):
    enabled: bool = False

class SDWANConfig(BaseModel):
    enabled: bool = False

class AuthConfig(BaseModel):
    token_expire_minutes: int = Field(60, ge=5, le=1440)
    secret_key: Optional[str] = None

class AuditConfig(BaseModel):
    log_path: str = "os/config/audit.log"

class SecurityConfig(BaseModel):
    authentication: AuthConfig
    audit: AuditConfig

class RcsCyberTrackConfig(BaseModel):
    system: SystemConfig
    management: ManagementConfig
    firewall: FirewallConfig
    network: NetworkConfig
    captive_portal: CaptivePortalConfig
    vpn: VPNConfig
    sdwan: SDWANConfig
    security: SecurityConfig

import management.env  # Ensure .env is loaded

def load_config(config_path: Path) -> RcsCyberTrackConfig:
    """Loads and validates configuration from a YAML file, merging environment variable overrides."""
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_path, "r") as f:
        try:
            data = yaml.safe_load(f) or {}
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in config file: {e}")

    # Apply environment variable overrides if present
    if os.getenv("CYBERTRACK_LOG_LEVEL"):
        data.setdefault("system", {})["log_level"] = os.getenv("CYBERTRACK_LOG_LEVEL")

    if os.getenv("CYBERTRACK_HOST"):
        data.setdefault("management", {}).setdefault("api", {})["host"] = os.getenv("CYBERTRACK_HOST")

    if os.getenv("CYBERTRACK_PORT"):
        data.setdefault("management", {}).setdefault("api", {})["port"] = int(os.getenv("CYBERTRACK_PORT"))

    if os.getenv("CYBERTRACK_FIREWALL_BACKEND"):
        data.setdefault("firewall", {})["backend"] = os.getenv("CYBERTRACK_FIREWALL_BACKEND")

    if os.getenv("CYBERTRACK_JWT_SECRET"):
        data.setdefault("security", {}).setdefault("authentication", {})["secret_key"] = os.getenv("CYBERTRACK_JWT_SECRET")

    try:
        return RcsCyberTrackConfig(**data)
    except ValidationError as e:
        raise ValueError(f"Configuration validation failed: {e}")
