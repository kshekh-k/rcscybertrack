import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from management.api.server import app, firewall_engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_system_operations():
    """Fixture to mock filesystem writes and firewall application to keep tests isolated."""
    with patch("management.api.server._save_firewall_rules") as mock_save, \
         patch("management.api.server.firewall_engine.apply") as mock_apply:
        mock_apply.return_value = True
        yield mock_save, mock_apply

def get_auth_headers(username: str, role: str) -> dict:
    """Helper to obtain access token and build Authorization header."""
    # Pre-computed tokens are not needed; we can just call the real token endpoint
    # USERS_DB has admin:admin123, operator:operator123, viewer:viewer123
    password = f"{username}123"
    response = client.post(
        "/api/v1/auth/token",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    """Verify that the health check endpoint is public and active."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "rcs-cybertrack-core"}

def test_authentication_flow():
    """Verify login success and failure cases."""
    # Successful login
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

    # Failed login
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "admin", "password": "wrong-password"}
    )
    assert response.status_code == 401
    assert "Incorrect username" in response.json()["detail"]

def test_system_endpoint_rbac():
    """Verify system config accessibility matches role permissions."""
    # Unauthorized - no token
    response = client.get("/api/v1/system")
    assert response.status_code == 401

    # Authorized - Viewer
    viewer_headers = get_auth_headers("viewer", "viewer")
    response = client.get("/api/v1/system", headers=viewer_headers)
    assert response.status_code == 200
    assert "hostname" in response.json()

def test_firewall_rules_endpoints_rbac():
    """Verify viewers cannot modify rules, but operators/admins can."""
    viewer_headers = get_auth_headers("viewer", "viewer")
    operator_headers = get_auth_headers("operator", "operator")

    new_rule = {
        "id": "test-api-rule",
        "action": "allow",
        "direction": "input",
        "protocol": "tcp",
        "source": {"address": "192.168.1.50"},
        "destination": {"address": "any", "port": 443},
        "state": ["new", "established"]
    }

    # 1. GET rules (Viewer can view)
    response = client.get("/api/v1/firewall/rules", headers=viewer_headers)
    assert response.status_code == 200
    initial_count = len(response.json())

    # 2. POST rule - Viewer (Should fail - Forbidden)
    response = client.post("/api/v1/firewall/rules", json=new_rule, headers=viewer_headers)
    assert response.status_code == 403

    # 3. POST rule - Operator (Should succeed)
    response = client.post("/api/v1/firewall/rules", json=new_rule, headers=operator_headers)
    assert response.status_code == 201
    assert response.json()["id"] == "test-api-rule"

    # 4. PUT rule - Operator (Should succeed)
    updated_rule = {**new_rule, "action": "deny"}
    response = client.put("/api/v1/firewall/rules/test-api-rule", json=updated_rule, headers=operator_headers)
    assert response.status_code == 200
    assert response.json()["action"] == "deny"

    # 5. DELETE rule - Viewer (Should fail - Forbidden)
    response = client.delete("/api/v1/firewall/rules/test-api-rule", headers=viewer_headers)
    assert response.status_code == 403

    # 6. DELETE rule - Operator (Should succeed)
    response = client.delete("/api/v1/firewall/rules/test-api-rule", headers=operator_headers)
    assert response.status_code == 204

    # Clean up rules in memory just in case
    firewall_engine.rules = [r for r in firewall_engine.rules if r.id != "test-api-rule"]

def test_network_endpoints():
    """Verify reading network configurations."""
    viewer_headers = get_auth_headers("viewer", "viewer")
    
    # Interfaces
    response = client.get("/api/v1/network/interfaces", headers=viewer_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0
    assert response.json()[0]["name"] == "eth0"

    # Routes
    response = client.get("/api/v1/network/routes", headers=viewer_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_device_registry_endpoint():
    """Verify reading managed devices list."""
    viewer_headers = get_auth_headers("viewer", "viewer")
    response = client.get("/api/v1/devices", headers=viewer_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 2
    assert response.json()[0]["hostname"] == "core-switch-01"

def test_audit_logs_rbac_and_integrity():
    """Verify only admin can view audit logs and check integrity."""
    viewer_headers = get_auth_headers("viewer", "viewer")
    admin_headers = get_auth_headers("admin", "admin")

    # Viewer (Should fail)
    response = client.get("/api/v1/audit", headers=viewer_headers)
    assert response.status_code == 403

    # Admin (Should succeed)
    response = client.get("/api/v1/audit", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "integrity_verified" in data
    assert "events" in data
    assert data["integrity_verified"] is True
