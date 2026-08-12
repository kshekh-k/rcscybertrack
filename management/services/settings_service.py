from typing import Optional
from pydantic import BaseModel, Field

class GeneralSettings(BaseModel):
    hostname: str = Field("rcs-cybertrack", min_length=1, max_length=64)
    timezone: str = Field("UTC", min_length=1)
    domain: str = Field("rcs-cybertrack.local")
    banner_message: Optional[str] = "RESTRICTED SYSTEM - AUTHORIZED PERSONNEL ONLY"

class LoggingSettings(BaseModel):
    log_level: str = Field("INFO")
    audit_retention_days: int = Field(90, ge=1, le=3650)
    remote_syslog_server: Optional[str] = None

class SecuritySettings(BaseModel):
    session_timeout_minutes: int = Field(60, ge=5, le=1440)
    mfa_required: bool = False
    max_login_attempts: int = Field(5, ge=1, le=10)
    ip_lockout_duration_minutes: int = Field(15, ge=1, le=1440)

class APISettings(BaseModel):
    enabled: bool = True
    rate_limit_rpm: int = Field(600, ge=60)

class SystemSettings(BaseModel):
    general: GeneralSettings = Field(default_factory=GeneralSettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    api: APISettings = Field(default_factory=APISettings)

class SettingsService:
    def __init__(self, initial_hostname: str = "rcs-cybertrack", initial_timezone: str = "UTC", initial_log_level: str = "INFO", firewall_backend: str = "nftables"):
        self._settings = SystemSettings(
            general=GeneralSettings(hostname=initial_hostname, timezone=initial_timezone),
            logging=LoggingSettings(log_level=initial_log_level)
        )
        self.firewall_backend = firewall_backend

    def get_settings(self) -> SystemSettings:
        return self._settings

    def update_settings(self, new_settings: SystemSettings) -> SystemSettings:
        self._settings = new_settings
        return self._settings
