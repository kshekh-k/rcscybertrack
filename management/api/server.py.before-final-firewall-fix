import os
from pathlib import Path
from typing import Dict, List, Optional
import yaml
import management.env  # Ensure .env is loaded
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import modules using relative/absolute project structures
from management.config import load_config, RcsCyberTrackConfig
from management.database.database import engine, Base, SessionLocal, get_db
from management.database.models import UserDB
from management.auth.rbac import (
    require_permission,
    require_admin,
    require_operator,
    require_auditor,
    require_viewer
)
from management.auth.auth import (
    create_access_token,
    decode_access_token,
    get_current_user,
    verify_password,
    authenticate_user,
    bootstrap_default_users,
    revoke_token,
    oauth2_scheme
)

# Initialize database schemas and bootstrap default administrative users
Base.metadata.create_all(bind=engine)
with SessionLocal() as db_session:
    bootstrap_default_users(db_session)

import importlib
firewall_engine_module = importlib.import_module("firewall.engine.firewall-engine")
FirewallEngine = firewall_engine_module.FirewallEngine
FirewallRule = firewall_engine_module.FirewallRule
PolicyConfig = firewall_engine_module.PolicyConfig

from network.network_manager import NetworkManager, LinuxNetworkAdapter, InterfaceConfig, RouteConfig
from management.device.device import Device, DeviceRegistry
from management.audit.audit import AuditLogger
from management.adapter.os_adapter import os_adapter
# Determine base path of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# --- Configuration Loading ---
CONFIG_PATH = BASE_DIR / "os" / "config" / "rcscybertrack.yaml"
config: RcsCyberTrackConfig = load_config(CONFIG_PATH)

# Service Layer Initializations
audit_log_path = BASE_DIR / config.security.audit.log_path
audit_logger = AuditLogger(audit_log_path)
import management.audit.audit
management.audit.audit.audit_logger = audit_logger

def _get_username(user) -> str:
    if isinstance(user, dict):
        return user.get("username", "system")
    return getattr(user, "username", "system")

# Initialize Firewall
# Initialize Firewall
firewall_policy_path = BASE_DIR / "firewall" / "policy" / "default-policy.yaml"
firewall_rules_path = BASE_DIR / "firewall" / "rules" / "rules.yaml"
firewall_engine = FirewallEngine(backend_type=config.firewall.backend)

try:
    firewall_engine.load_policy(firewall_policy_path)
    firewall_engine.load_rules(firewall_rules_path)

    # Build the boot-time OS configuration payload.
    # FirewallEngine remains the management/API object,
    # while OSAdapter performs the privileged firewall/NAT/forwarding apply.
    startup_policy = {
        "input": firewall_engine.policy.input,
        "output": firewall_engine.policy.output,
        "forward": firewall_engine.policy.forward,
    }

    startup_rules = [
        rule.model_dump() for rule in firewall_engine.rules
    ]

    startup_nat = (
        config.firewall.nat.model_dump()
        if config.firewall.nat is not None
        else None
    )

    startup_payload = {
        "firewall": {
            "policy": startup_policy,
            "rules": startup_rules,
            "nat": startup_nat,
        }
    }

    # Apply firewall + NAT first, then IPv4 forwarding.
    os_ok, os_msg = os_adapter.apply_config(startup_payload)
    if not os_ok:
        raise RuntimeError(f"Boot firewall/NAT apply failed: {os_msg}")

    # Verify the resulting firewall state.
    health_ok, health_msg = os_adapter.verify_health()
    if not health_ok:
        raise RuntimeError(f"Boot firewall/NAT health check failed: {health_msg}")

    print(f"CyberTrack firewall/NAT startup: {health_msg}")

except Exception as e:
    print(f"Error initializing firewall/NAT: {e}")


def _apply_firewall_config() -> tuple[bool, str]:
    """Apply the complete active firewall configuration, including NAT."""
    if firewall_engine.policy is None:
        return False, "Firewall policy is not loaded"

    payload = {
        "firewall": {
            "policy": {
                "input": firewall_engine.policy.input,
                "output": firewall_engine.policy.output,
                "forward": firewall_engine.policy.forward,
            },
            "rules": [
                rule.model_dump()
                for rule in firewall_engine.rules
            ],
            "nat": (
                config.firewall.nat.model_dump()
                if config.firewall.nat is not None
                else None
            ),
        }
    }

    return os_adapter.apply_config(payload)



# Initialize Network Manager
network_manager = NetworkManager(adapter=LinuxNetworkAdapter())
try:
    network_manager.load_interfaces(BASE_DIR / "network" / "interfaces" / "interfaces.yaml")
    network_manager.load_routes(BASE_DIR / "network" / "routing" / "routes.yaml")
    network_manager.load_dhcp(BASE_DIR / "network" / "dhcp" / "dhcp.yaml")
    network_manager.load_dns(BASE_DIR / "network" / "dns" / "dns.yaml")
    network_manager.apply_all()
except Exception as e:
    print(f"Error loading network manager: {e}")



# Initialize Device Registry
device_registry = DeviceRegistry()

# --- FastAPI App Initializer ---
app = FastAPI(
    title="RCS CyberTrack Core Management API",
    description="High-Assurance Backend Management Platform for Security Appliances",
    version="0.6.0"
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        )
        response.headers.setdefault(
            "Cross-Origin-Opener-Policy",
            "same-origin",
        )
        response.headers.setdefault(
            "Cross-Origin-Resource-Policy",
            "same-origin",
        )

        is_production = os.getenv("CYBERTRACK_ENV", "development").strip().lower() == "production"
        is_https = (
            request.url.scheme == "https" or
            request.headers.get("x-forwarded-proto", "").lower() == "https" or
            os.getenv("CYBERTRACK_HSTS_ENABLED", "false").strip().lower() in ("true", "1", "yes")
        )
        if is_production and is_https:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

        return response


cors_origins_raw = os.getenv("CYBERTRACK_CORS_ORIGINS")

if not cors_origins_raw:
    if os.getenv("CYBERTRACK_ENV", "development").strip().lower() == "production":
        raise RuntimeError(
            "Production CORS configuration error: "
            "CYBERTRACK_CORS_ORIGINS environment variable is required."
        )
    cors_origins_raw = "http://localhost:5173,http://127.0.0.1:5173"

cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

if not cors_origins:
    raise RuntimeError(
        "CORS configuration error: at least one allowed origin is required."
    )

if "*" in cors_origins:
    if os.getenv("CYBERTRACK_ENV", "development").strip().lower() == "production":
        raise RuntimeError(
            "Production CORS configuration error: wildcard origin '*' is not allowed."
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
    ],
)

app.add_middleware(
    SecurityHeadersMiddleware,
)

# --- Authentication Token Route ---

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/api/v1/auth/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/auth/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if not user or not user.enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return revoke_token(db, token, reason="logout")

# --- System & Health Endpoints ---

@app.get("/api/v1/health")
def get_health():
    # Public endpoint
    return {"status": "healthy", "service": "rcs-cybertrack-core"}

@app.get("/api/v1/system", dependencies=[Depends(require_permission("system.read"))])
def get_system():
    return {
        "hostname": config.system.hostname,
        "timezone": config.system.timezone,
        "log_level": config.system.log_level,
        "firewall_backend": config.firewall.backend,
        "api_enabled": config.management.api.enabled
    }

# --- Firewall Endpoints ---

@app.get("/api/v1/firewall/rules", response_model=List[FirewallRule], dependencies=[Depends(require_permission("firewall.read"))])
def get_firewall_rules():
    return firewall_engine.rules

@app.post("/api/v1/firewall/rules", response_model=FirewallRule, status_code=status.HTTP_201_CREATED)
def create_firewall_rule(rule: FirewallRule, current_user: UserDB = Depends(require_permission("firewall.write"))):
    # Check if ID already exists
    for r in firewall_engine.rules:
        if r.id == rule.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Firewall rule with ID '{rule.id}' already exists"
            )
            
    # Append, save to YAML file, reload, audit
    firewall_engine.rules.append(rule)
    try:
        _save_firewall_rules()
        apply_ok, apply_msg = _apply_firewall_config()
        if not apply_ok:
            raise RuntimeError(apply_msg)
    except Exception as e:
        # Revert memory representation in case of failure
        firewall_engine.rules.pop()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply and save rule: {e}"
        )

    audit_logger.log(
        user=_get_username(current_user),
        action="firewall.rule.create",
        resource="firewall",
        resource_id=rule.id,
        result="success",
        details=rule.model_dump()
    )
    return rule

@app.put("/api/v1/firewall/rules/{rule_id}", response_model=FirewallRule)
def update_firewall_rule(rule_id: str, updated_rule: FirewallRule, current_user: UserDB = Depends(require_permission("firewall.write"))):
    if rule_id != updated_rule.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rule ID in path does not match ID in body"
        )
        
    found_idx = -1
    for idx, r in enumerate(firewall_engine.rules):
        if r.id == rule_id:
            found_idx = idx
            break
            
    if found_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Firewall rule with ID '{rule_id}' not found"
        )

    original_rule = firewall_engine.rules[found_idx]
    firewall_engine.rules[found_idx] = updated_rule
    try:
        _save_firewall_rules()
        apply_ok, apply_msg = _apply_firewall_config()
        if not apply_ok:
            raise RuntimeError(apply_msg)
    except Exception as e:
        firewall_engine.rules[found_idx] = original_rule
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply and save rule: {e}"
        )

    audit_logger.log(
        user=_get_username(current_user),
        action="firewall.rule.update",
        resource="firewall",
        resource_id=rule_id,
        result="success",
        details={"before": original_rule.model_dump(), "after": updated_rule.model_dump()}
    )
    return updated_rule

@app.delete("/api/v1/firewall/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_firewall_rule(rule_id: str, current_user: UserDB = Depends(require_permission("firewall.write"))):
    found_idx = -1
    for idx, r in enumerate(firewall_engine.rules):
        if r.id == rule_id:
            found_idx = idx
            break
            
    if found_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Firewall rule with ID '{rule_id}' not found"
        )

    removed_rule = firewall_engine.rules.pop(found_idx)
    try:
        _save_firewall_rules()
        apply_ok, apply_msg = _apply_firewall_config()
        if not apply_ok:
            raise RuntimeError(apply_msg)
    except Exception as e:
        firewall_engine.rules.insert(found_idx, removed_rule)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply and save ruleset: {e}"
        )

    audit_logger.log(
        user=_get_username(current_user),
        action="firewall.rule.delete",
        resource="firewall",
        resource_id=rule_id,
        result="success",
        details=removed_rule.model_dump()
    )
    return None

# --- Phase 5.3 Firewall Backend Status & Validation Endpoints ---

from firewall.nftables_backend import nftables_backend, BackendStatus

@app.get("/api/v1/firewall/status", response_model=BackendStatus, dependencies=[Depends(require_permission("firewall.read"))])
def get_firewall_backend_status():
    status_info = nftables_backend.discover()
    audit_logger.log(
        user="system",
        action="FIREWALL_DISCOVERY",
        resource="firewall",
        resource_id="status",
        result="success",
        details=status_info.model_dump()
    )
    return status_info

@app.get("/api/v1/firewall/diff", dependencies=[Depends(require_permission("firewall.read"))])
def get_firewall_diff():
    policy_dict = firewall_engine.policy.model_dump() if firewall_engine.policy else {"input": "drop", "output": "accept", "forward": "drop"}
    rules_dict = [r.model_dump() for r in firewall_engine.rules]
    nat_dict = (
        config.firewall.nat.model_dump()
        if config.firewall.nat is not None
        else None
    )
    compiled = nftables_backend.compile(policy_dict, rules_dict, nat=nat_dict)
    current_status = nftables_backend.discover()

    return {
        "table": "inet rcs_cybertrack",
        "active_table_exists": current_status.table_owned,
        "desired_rule_count": len(rules_dict),
        "compiled_ruleset": compiled
    }

@app.post("/api/v1/firewall/validate")
def validate_firewall_ruleset(current_user: UserDB = Depends(require_permission("firewall.write"))):
    policy_dict = firewall_engine.policy.model_dump() if firewall_engine.policy else {"input": "drop", "output": "accept", "forward": "drop"}
    rules_dict = [r.model_dump() for r in firewall_engine.rules]
    nat_dict = (
        config.firewall.nat.model_dump()
        if config.firewall.nat is not None
        else None
    )
    v_ok, v_msg = nftables_backend.validate(policy_dict, rules_dict, nat=nat_dict)

    audit_logger.log(
        user=current_user.username,
        action="FIREWALL_VALIDATION",
        resource="firewall",
        resource_id="global",
        result="success" if v_ok else "failure",
        details={"valid": v_ok, "message": v_msg}
    )
    if not v_ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=v_msg)
    return {"valid": True, "message": v_msg}

@app.post("/api/v1/firewall/apply")
def apply_firewall_ruleset(current_user: UserDB = Depends(require_permission("firewall.write"))):
    policy_dict = firewall_engine.policy.model_dump() if firewall_engine.policy else {"input": "drop", "output": "accept", "forward": "drop"}
    rules_dict = [r.model_dump() for r in firewall_engine.rules]

    audit_logger.log(
        user=current_user.username,
        action="FIREWALL_APPLY_STARTED",
        resource="firewall",
        resource_id="global",
        result="success",
        details={"rule_count": len(rules_dict)}
    )

    applied_ok, apply_msg = _apply_firewall_config()
    if not applied_ok:
        audit_logger.log(
            user=current_user.username,
            action="FIREWALL_APPLY_FAILED",
            resource="firewall",
            resource_id="global",
            result="failure",
            details={"error": apply_msg}
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=apply_msg)

    v_ok, v_msg = nftables_backend.verify()
    if not v_ok:
        audit_logger.log(
            user=current_user.username,
            action="FIREWALL_APPLY_FAILED",
            resource="firewall",
            resource_id="global",
            result="failure",
            details={"verification_error": v_msg}
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Apply succeeded but verification failed: {v_msg}")

    audit_logger.log(
        user=current_user.username,
        action="FIREWALL_APPLY_SUCCESS",
        resource="firewall",
        resource_id="global",
        result="success",
        details={"message": apply_msg, "verification": v_msg}
    )
    return {"status": "applied", "message": apply_msg, "verification": v_msg}

def _save_firewall_rules():
    raw_rules = []
    for r in firewall_engine.rules:
        # Convert Pydantic model to dict representation
        raw_rules.append(r.model_dump(exclude_defaults=True))
    with open(firewall_rules_path, "w") as f:
        yaml.safe_dump({"rules": raw_rules}, f, default_flow_style=False)

# --- Network Endpoints ---

@app.get("/api/v1/network/interfaces", response_model=List[InterfaceConfig], dependencies=[Depends(require_permission("network.read"))])
def get_network_interfaces():
    return network_manager.interfaces

@app.get("/api/v1/network/routes", response_model=List[RouteConfig], dependencies=[Depends(require_permission("network.read"))])
def get_network_routes():
    return network_manager.routes

# --- Device Endpoints ---

@app.get("/api/v1/devices", response_model=List[Device], dependencies=[Depends(require_permission("devices.read"))])
def get_devices():
    # Refresh the read-only kernel-neighbor inventory before returning devices.
    device_registry.discover_devices()
    return device_registry.list_devices()

# --- Audit Log Endpoints ---

# --- Audit Log Endpoints ---

@app.get("/api/v1/audit", dependencies=[Depends(require_auditor)])
def get_audit_logs():
    integrity_ok = audit_logger.verify_integrity()
    logs = audit_logger.read_logs()
    return {
        "integrity_verified": integrity_ok,
        "log_count": len(logs),
        "events": logs
    }

# --- Service Layer Instantiations ---
from management.services.user_service import UserService, UserModel, UserCreateRequest, UserUpdateRequest
from management.services.alert_service import AlertService, AlertModel, AlertAcknowledgeRequest, AlertResolveRequest
from management.services.settings_service import SettingsService, SystemSettings
from management.services.vpn_service import VpnService, VpnConnectionModel, VpnPeerModel, VpnCreateRequest
from management.services.sdwan_service import SdwanService, WanLinkModel, SdwanPolicyModel
from management.services.telemetry_service import TelemetryService, TrafficMetricPointModel, TopTalkerModel

user_service = UserService()
alert_service = AlertService()
settings_service = SettingsService(
    initial_hostname=config.system.hostname,
    initial_timezone=config.system.timezone,
    initial_log_level=config.system.log_level,
    firewall_backend=config.firewall.backend
)
vpn_service = VpnService()
sdwan_service = SdwanService()
telemetry_service = TelemetryService()

# --- Users & RBAC Endpoints ---

# --- Users & RBAC Endpoints ---
from management.services.user_service import UserService, UserResponse, UserCreateRequest, UserUpdateRequest

@app.get("/api/v1/users", response_model=List[UserResponse], dependencies=[Depends(require_permission("users.read"))])
def get_users(db: Session = Depends(get_db)):
    return user_service.list_users(db)

@app.post("/api/v1/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(req: UserCreateRequest, current_user: UserDB = Depends(require_permission("users.write")), db: Session = Depends(get_db)):
    try:
        return user_service.create_user(db, req, current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/api/v1/users/{user_id}", response_model=UserResponse, dependencies=[Depends(require_permission("users.read"))])
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{user_id}' not found")
    return user

@app.put("/api/v1/users/{user_id}", response_model=UserResponse)
def update_user(user_id: str, req: UserUpdateRequest, current_user: UserDB = Depends(require_permission("users.write")), db: Session = Depends(get_db)):
    try:
        return user_service.update_user(db, user_id, req, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.delete("/api/v1/users/{user_id}", response_model=UserResponse)
def disable_user(user_id: str, current_user: UserDB = Depends(require_permission("users.write")), db: Session = Depends(get_db)):
    try:
        return user_service.disable_user(db, user_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# --- Security Alert Endpoints ---

@app.get("/api/v1/alerts", response_model=List[AlertModel], dependencies=[Depends(require_permission("alerts.read"))])
def get_alerts(severity: Optional[str] = None, status: Optional[str] = None):
    return alert_service.list_alerts(severity=severity, status=status)

@app.get("/api/v1/alerts/{alert_id}", response_model=AlertModel, dependencies=[Depends(require_permission("alerts.read"))])
def get_alert_by_id(alert_id: str):
    alert = alert_service.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{alert_id}' not found")
    return alert

@app.post("/api/v1/alerts/{alert_id}/acknowledge", response_model=AlertModel)
def acknowledge_alert(alert_id: str, req: AlertAcknowledgeRequest, current_user: UserDB = Depends(require_permission("alerts.write"))):
    alert = alert_service.acknowledge_alert(alert_id, req.acknowledged_by, req.note)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{alert_id}' not found")
    audit_logger.log(
        user=_get_username(current_user),
        action="alert.acknowledge",
        resource="alert",
        resource_id=alert_id,
        result="success"
    )
    return alert

@app.post("/api/v1/alerts/{alert_id}/resolve", response_model=AlertModel)
def resolve_alert(alert_id: str, req: AlertResolveRequest, current_user: UserDB = Depends(require_permission("alerts.write"))):
    alert = alert_service.resolve_alert(alert_id, req.resolved_by, req.mitigation_note)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{alert_id}' not found")
    audit_logger.log(
        user=_get_username(current_user),
        action="alert.resolve",
        resource="alert",
        resource_id=alert_id,
        result="success",
        details={"mitigation_note": req.mitigation_note}
    )
    return alert

# --- System Settings Endpoints ---

@app.get("/api/v1/settings", response_model=SystemSettings, dependencies=[Depends(require_permission("system.read"))])
def get_settings():
    return settings_service.get_settings()

@app.put("/api/v1/settings", response_model=SystemSettings)
def update_settings(new_settings: SystemSettings, current_user: UserDB = Depends(require_permission("system.write"))):
    updated = settings_service.update_settings(new_settings)
    audit_logger.log(
        user=_get_username(current_user),
        action="settings.update",
        resource="system",
        resource_id="global",
        result="success",
        details=new_settings.model_dump()
    )
    return updated

# --- Configuration Engine Lifecycle Endpoints ---
from management.services.config_engine import (
    config_engine_service,
    ConfigVersionResponse,
    CandidateStageRequest,
    CommitRequest,
    to_config_response
)

@app.get("/api/v1/config/active", response_model=Optional[ConfigVersionResponse], dependencies=[Depends(require_permission("system.read"))])
def get_active_config(db: Session = Depends(get_db)):
    active = config_engine_service.get_active_version(db)
    return to_config_response(active) if active else None

@app.get("/api/v1/config/candidate", response_model=Optional[ConfigVersionResponse], dependencies=[Depends(require_permission("system.read"))])
def get_candidate_config(db: Session = Depends(get_db)):
    candidate = config_engine_service.get_candidate_version(db)
    return to_config_response(candidate) if candidate else None

@app.post("/api/v1/config/candidate", response_model=ConfigVersionResponse)
def stage_candidate_config(req: CandidateStageRequest, current_user: UserDB = Depends(require_permission("system.write")), db: Session = Depends(get_db)):
    try:
        return config_engine_service.stage_candidate(db, req.payload, current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/api/v1/config/diff", dependencies=[Depends(require_permission("system.read"))])
def get_config_diff(db: Session = Depends(get_db)):
    return config_engine_service.get_diff(db)

@app.post("/api/v1/config/commit", response_model=ConfigVersionResponse)
def commit_candidate_config(req: CommitRequest, current_user: UserDB = Depends(require_permission("system.write")), db: Session = Depends(get_db)):
    try:
        return config_engine_service.commit_candidate(db, req.commit_message or "Staged candidate committed", current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.post("/api/v1/config/apply", response_model=ConfigVersionResponse)
def apply_committed_config(version_id: Optional[str] = None, current_user: UserDB = Depends(require_permission("system.write")), db: Session = Depends(get_db)):
    try:
        return config_engine_service.apply_configuration(db, version_id, current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.post("/api/v1/config/rollback/{version_id}", response_model=ConfigVersionResponse)
def rollback_config_version(version_id: str, current_user: UserDB = Depends(require_permission("system.write")), db: Session = Depends(get_db)):
    try:
        return config_engine_service.rollback_to_version(db, version_id, current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/api/v1/config/history", response_model=List[ConfigVersionResponse], dependencies=[Depends(require_permission("system.read"))])
def get_config_history(db: Session = Depends(get_db)):
    return config_engine_service.list_history(db)

# --- VPN Endpoints ---

@app.get("/api/v1/vpn/connections", response_model=List[VpnConnectionModel], dependencies=[Depends(require_permission("vpn.read"))])
def get_vpn_connections():
    return vpn_service.list_connections()

@app.post("/api/v1/vpn/connections", response_model=VpnConnectionModel, status_code=status.HTTP_201_CREATED)
def create_vpn_connection(req: VpnCreateRequest, current_user: UserDB = Depends(require_permission("vpn.write"))):
    conn = vpn_service.create_connection(req)
    audit_logger.log(
        user=_get_username(current_user),
        action="vpn.connection.create",
        resource="vpn",
        resource_id=conn.id,
        result="success",
        details=req.model_dump()
    )
    return conn

@app.get("/api/v1/vpn/peers", response_model=List[VpnPeerModel], dependencies=[Depends(require_permission("vpn.read"))])
def get_vpn_peers():
    return vpn_service.list_peers()

# --- SD-WAN Endpoints ---

@app.get("/api/v1/sdwan/links", response_model=List[WanLinkModel], dependencies=[Depends(require_permission("sdwan.read"))])
def get_sdwan_links():
    return sdwan_service.list_links()

@app.get("/api/v1/sdwan/policies", response_model=List[SdwanPolicyModel], dependencies=[Depends(require_permission("sdwan.read"))])
def get_sdwan_policies():
    return sdwan_service.list_policies()

# --- Telemetry Analytics Endpoints ---

@app.get("/api/v1/analytics/traffic", response_model=List[TrafficMetricPointModel], dependencies=[Depends(require_permission("analytics.read"))])
def get_traffic_analytics():
    return telemetry_service.get_traffic_metrics()

@app.get("/api/v1/analytics/top-sources", response_model=List[TopTalkerModel], dependencies=[Depends(require_permission("analytics.read"))])
def get_top_sources():
    return telemetry_service.get_top_sources()

@app.get("/api/v1/analytics/top-destinations", response_model=List[TopTalkerModel], dependencies=[Depends(require_permission("analytics.read"))])
def get_top_destinations():
    return telemetry_service.get_top_destinations()