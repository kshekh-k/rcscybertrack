import pytest
from fastapi.testclient import TestClient
from management.api.server import app

client = TestClient(app)

def get_auth_headers(username: str) -> dict:
    password = f"{username}123"
    response = client.post(
        "/api/v1/auth/token",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# --- Users & RBAC Tests ---

def test_users_rbac():
    admin_headers = get_auth_headers("admin")
    operator_headers = get_auth_headers("operator")
    viewer_headers = get_auth_headers("viewer")

    # Viewer/Operator cannot list users (403 Forbidden)
    response = client.get("/api/v1/users", headers=viewer_headers)
    assert response.status_code == 403

    response = client.get("/api/v1/users", headers=operator_headers)
    assert response.status_code == 403

    # Admin can list users (200 OK)
    response = client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 4

def test_user_creation_and_update():
    import uuid
    admin_headers = get_auth_headers("admin")

    uname = f"secops-{uuid.uuid4().hex[:6]}"
    new_user_payload = {
        "username": uname,
        "password": "SecurePassword123!",
        "email": f"{uname}@company.local",
        "full_name": "Test SecOps Engineer",
        "role": "operator"
    }

    # Create user
    response = client.post("/api/v1/users", json=new_user_payload, headers=admin_headers)
    assert response.status_code == 201
    created = response.json()
    assert created["username"] == uname
    assert created["role"] == "operator"
    user_id = created["id"]

    # Update user role
    update_payload = {"role": "admin", "full_name": "Promoted Lead Engineer"}
    response = client.put(f"/api/v1/users/{user_id}", json=update_payload, headers=admin_headers)
    assert response.status_code == 200
    updated = response.json()
    assert updated["role"] == "admin"
    assert updated["full_name"] == "Promoted Lead Engineer"

    # Disable user
    response = client.delete(f"/api/v1/users/{user_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["enabled"] is False

# --- Security Alerts Tests ---

def test_alerts_endpoints():
    viewer_headers = get_auth_headers("viewer")
    operator_headers = get_auth_headers("operator")

    # Get alerts (Viewer allowed)
    response = client.get("/api/v1/alerts", headers=viewer_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# --- System Settings Tests ---

def test_settings_endpoints():
    viewer_headers = get_auth_headers("viewer")
    admin_headers = get_auth_headers("admin")

    # Read settings (Viewer allowed)
    response = client.get("/api/v1/settings", headers=viewer_headers)
    assert response.status_code == 200
    settings = response.json()
    assert "general" in settings
    assert "security" in settings

    # Update settings (Admin allowed)
    new_settings = settings.copy()
    new_settings["general"]["hostname"] = "rcs-cybertrack-hq"
    response = client.put("/api/v1/settings", json=new_settings, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["general"]["hostname"] == "rcs-cybertrack-hq"

# --- VPN & SD-WAN Tests ---

def test_vpn_and_sdwan_endpoints():
    viewer_headers = get_auth_headers("viewer")
    operator_headers = get_auth_headers("operator")

    # VPN connections list
    response = client.get("/api/v1/vpn/connections", headers=viewer_headers)
    assert response.status_code == 200

    # Provision VPN connection
    vpn_payload = {
        "name": "Branch-HQ-Tunnel",
        "type": "wireguard",
        "local_endpoint": "198.51.100.1:51820",
        "remote_endpoint": "203.0.113.5:51820",
        "assigned_ip": "10.200.0.2/32"
    }
    response = client.post("/api/v1/vpn/connections", json=vpn_payload, headers=operator_headers)
    assert response.status_code == 201
    assert response.json()["name"] == "Branch-HQ-Tunnel"

    # SD-WAN links & policies
    response = client.get("/api/v1/sdwan/links", headers=viewer_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 3

    response = client.get("/api/v1/sdwan/policies", headers=viewer_headers)
    assert response.status_code == 200

# --- Audit & Auditor Role Tests ---

def test_auditor_role_audit_access():
    auditor_headers = get_auth_headers("auditor")
    operator_headers = get_auth_headers("operator")

    # Operator denied audit logs (403)
    response = client.get("/api/v1/audit", headers=operator_headers)
    assert response.status_code == 403

    # Auditor granted audit logs (200)
    response = client.get("/api/v1/audit", headers=auditor_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["integrity_verified"] is True
