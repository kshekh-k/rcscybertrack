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

def test_config_candidate_staging_and_validation():
    admin_headers = get_auth_headers("admin")
    viewer_headers = get_auth_headers("viewer")

    # Viewer denied candidate staging (403)
    bad_res = client.post("/api/v1/config/candidate", json={
        "payload": {"general": {"hostname": "test-host"}}
    }, headers=viewer_headers)
    assert bad_res.status_code == 403

    # Invalid payload rejection (session_timeout out of bounds)
    invalid_res = client.post("/api/v1/config/candidate", json={
        "payload": {
            "general": {"hostname": "test-host"},
            "security": {"session_timeout_minutes": 1}  # Invalid < 5
        }
    }, headers=admin_headers)
    assert invalid_res.status_code == 400
    assert "Session timeout must be an integer" in invalid_res.json()["detail"]

    # Valid candidate staging
    valid_payload = {
        "general": {"hostname": "rcs-cybertrack-hq", "timezone": "UTC"},
        "logging": {"log_level": "INFO", "audit_retention_days": 180},
        "security": {"session_timeout_minutes": 45}
    }
    stage_res = client.post("/api/v1/config/candidate", json={
        "payload": valid_payload
    }, headers=admin_headers)
    assert stage_res.status_code == 200
    assert stage_res.json()["status"] == "candidate"
    assert stage_res.json()["config_payload"]["general"]["hostname"] == "rcs-cybertrack-hq"

def test_config_diff_and_commit():
    admin_headers = get_auth_headers("admin")

    # Get Diff
    diff_res = client.get("/api/v1/config/diff", headers=admin_headers)
    assert diff_res.status_code == 200
    diff_data = diff_res.json()
    assert "has_changes" in diff_data

    # Commit candidate
    commit_res = client.post("/api/v1/config/commit", json={
        "commit_message": "Production deployment candidate release v1"
    }, headers=admin_headers)
    assert commit_res.status_code == 200
    assert commit_res.json()["status"] == "committed"
    assert commit_res.json()["commit_message"] == "Production deployment candidate release v1"

def test_config_apply_and_history():
    admin_headers = get_auth_headers("admin")

    # Apply configuration to OS Adapter
    apply_res = client.post("/api/v1/config/apply", headers=admin_headers)
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "active"
    applied_id = apply_res.json()["id"]

    # Get Version History
    history_res = client.get("/api/v1/config/history", headers=admin_headers)
    assert history_res.status_code == 200
    records = history_res.json()
    assert len(records) >= 1
    assert records[0]["id"] == applied_id

def test_config_rollback():
    admin_headers = get_auth_headers("admin")

    # Stage a second candidate
    client.post("/api/v1/config/candidate", json={
        "payload": {
            "general": {"hostname": "rcs-cybertrack-secondary"},
            "logging": {"log_level": "DEBUG", "audit_retention_days": 30}
        }
    }, headers=admin_headers)

    client.post("/api/v1/config/commit", json={"commit_message": "v2 candidate"}, headers=admin_headers)
    v2_apply = client.post("/api/v1/config/apply", headers=admin_headers).json()
    assert v2_apply["status"] == "active"

    # Fetch history to get v1 ID
    history = client.get("/api/v1/config/history", headers=admin_headers).json()
    v1_record = [r for r in history if r["version_number"] == 1][0]

    # Rollback to v1
    rollback_res = client.post(f"/api/v1/config/rollback/{v1_record['id']}", headers=admin_headers)
    assert rollback_res.status_code == 200
    assert rollback_res.json()["status"] == "active"
    assert rollback_res.json()["version_number"] == 1
