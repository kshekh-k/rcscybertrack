import logging
from typing import Dict, Set
from fastapi import Depends, HTTPException, status
from management.database.models import UserDB

logger = logging.getLogger("rcscybertrack.rbac")

# Centralized Role Permission Mapping
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "admin": {
        "system.read", "system.write",
        "firewall.read", "firewall.write",
        "network.read", "network.write",
        "devices.read",
        "audit.read",
        "users.read", "users.write",
        "alerts.read", "alerts.write",
        "vpn.read", "vpn.write",
        "sdwan.read", "sdwan.write",
        "analytics.read"
    },
    "operator": {
        "system.read",
        "firewall.read", "firewall.write",
        "network.read", "network.write",
        "devices.read",
        "alerts.read", "alerts.write",
        "vpn.read", "vpn.write",
        "sdwan.read", "sdwan.write",
        "analytics.read"
    },
    "auditor": {
        "system.read",
        "firewall.read",
        "network.read",
        "devices.read",
        "audit.read",
        "users.read",
        "alerts.read",
        "vpn.read",
        "sdwan.read",
        "analytics.read"
    },
    "viewer": {
        "system.read",
        "firewall.read",
        "network.read",
        "devices.read",
        "alerts.read",
        "vpn.read",
        "sdwan.read",
        "analytics.read"
    }
}

def has_permission(role: str, permission: str) -> bool:
    """Check if a given role possesses a specific permission."""
    perms = ROLE_PERMISSIONS.get(role, set())
    return permission in perms

def get_current_active_user(token: str = None, db = None):
    from management.auth.auth import get_current_user
    return get_current_user(token=token, db=db)

def require_permission(permission_name: str):
    """FastAPI Dependency builder enforcing centralized permission checks."""
    from management.auth.auth import get_current_user
    def dependency(current_user: UserDB = Depends(get_current_user)) -> UserDB:
        if not current_user.enabled:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled"
            )
        if not has_permission(current_user.role, permission_name):
            logger.warning(
                "RBAC Permission Denied: User '%s' (role: '%s') attempted action requiring permission '%s'",
                current_user.username, current_user.role, permission_name
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires permission '{permission_name}'"
            )
        return current_user
    return dependency

class RoleChecker:
    """Legacy Role Checker for backward compatibility."""
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, token: str = None, db = None) -> UserDB:
        from management.auth.auth import get_current_user
        current_user = get_current_user(token=token, db=db) if token and db else None
        return current_user

# Pre-defined backward-compatible checker helper functions
def require_admin(current_user: UserDB = Depends(require_permission("users.write"))) -> UserDB:
    return current_user

def require_operator(current_user: UserDB = Depends(require_permission("firewall.write"))) -> UserDB:
    return current_user

def require_auditor(current_user: UserDB = Depends(require_permission("audit.read"))) -> UserDB:
    return current_user

def require_viewer(current_user: UserDB = Depends(require_permission("system.read"))) -> UserDB:
    return current_user
