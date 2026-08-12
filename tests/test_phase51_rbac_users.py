import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from management.api.server import app
from management.database.database import SessionLocal
from management.database.models import UserDB

client = TestClient(app)

def get_auth_headers(username: str, password: str = "admin123") -> dict:
    # Helper to get token
    if username == "operator":
        password = "operator123"
    elif username == "auditor":
        password = "auditor123"
    elif username == "viewer":
        password = "viewer123"

    response = client.post(
        "/api/v1/auth/token",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# 1. Admin login succeeds
def test_admin_login_succeeds():
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

# 2. Invalid password fails
def test_invalid_password_fails():
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "admin", "password": "WrongPassword123!"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

# 3. Disabled user cannot login
def test_disabled_user_cannot_login():
    admin_headers = get_auth_headers("admin")

    import uuid
    admin_headers = get_auth_headers("admin")

    uname = f"dis-{uuid.uuid4().hex[:6]}"
    # Create a user then disable
    res = client.post("/api/v1/users", json={
        "username": uname,
        "password": "Password123!",
        "email": f"{uname}@test.local",
        "full_name": "Disabled Test User",
        "role": "viewer"
    }, headers=admin_headers)
    assert res.status_code == 201
    user_id = res.json()["id"]

    # Disable user
    res_dis = client.delete(f"/api/v1/users/{user_id}", headers=admin_headers)
    assert res_dis.status_code == 200
    assert res_dis.json()["enabled"] is False

    # Attempt login
    login_res = client.post("/api/v1/auth/token", data={
        "username": uname,
        "password": "Password123!"
    })
    assert login_res.status_code == 401
    assert "Account is disabled" in login_res.json()["detail"]

# 4. Viewer cannot create user
def test_viewer_cannot_create_user():
    viewer_headers = get_auth_headers("viewer")
    res = client.post("/api/v1/users", json={
        "username": "unauth-create",
        "password": "Password123!",
        "email": "unauth@test.local",
        "full_name": "Unauthorized User",
        "role": "viewer"
    }, headers=viewer_headers)
    assert res.status_code == 403

# 5. Viewer cannot delete/disable user
def test_viewer_cannot_disable_user():
    viewer_headers = get_auth_headers("viewer")
    res = client.delete("/api/v1/users/usr-operator", headers=viewer_headers)
    assert res.status_code == 403

# 6. Auditor cannot modify users
def test_auditor_cannot_modify_users():
    auditor_headers = get_auth_headers("auditor")

    # Read allowed
    res_get = client.get("/api/v1/users", headers=auditor_headers)
    assert res_get.status_code == 200

    # Create forbidden
    res_post = client.post("/api/v1/users", json={
        "username": "auditor-create-test",
        "password": "Password123!",
        "email": "auditor-test@test.local",
        "full_name": "Auditor Test",
        "role": "viewer"
    }, headers=auditor_headers)
    assert res_post.status_code == 403

# Global variable for admin user test
SEC_USER_ID = None
SEC_UNAME = f"secops-{uuid.uuid4().hex[:6]}"

# 7. Authorized admin can create user
def test_admin_create_user():
    global SEC_USER_ID, SEC_UNAME
    admin_headers = get_auth_headers("admin")
    res = client.post("/api/v1/users", json={
        "username": SEC_UNAME,
        "password": "SecurePassword123!",
        "email": f"{SEC_UNAME}@cybertrack.local",
        "full_name": "New SecOps Analyst",
        "role": "operator"
    }, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["username"] == SEC_UNAME
    assert res.json()["role"] == "operator"
    assert "password_hash" not in res.json()
    SEC_USER_ID = res.json()["id"]

# 8. Authorized admin can update user
def test_admin_update_user():
    global SEC_USER_ID
    admin_headers = get_auth_headers("admin")

    update_res = client.put(f"/api/v1/users/{SEC_USER_ID}", json={
        "full_name": "Promoted Senior Analyst",
        "role": "auditor"
    }, headers=admin_headers)
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Promoted Senior Analyst"
    assert update_res.json()["role"] == "auditor"

# 9. Authorized admin can disable user
def test_admin_disable_user():
    global SEC_USER_ID
    admin_headers = get_auth_headers("admin")

    res = client.delete(f"/api/v1/users/{SEC_USER_ID}", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["enabled"] is False

# 10. User list does not expose password hashes
def test_user_list_no_password_hashes():
    admin_headers = get_auth_headers("admin")
    res = client.get("/api/v1/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    for u in users:
        assert "password_hash" not in u
        assert "password" not in u

# 11. Last administrator protection (disable / delete)
def test_last_admin_cannot_be_disabled():
    admin_headers = get_auth_headers("admin")

    users = client.get("/api/v1/users", headers=admin_headers).json()
    admin_user = [u for u in users if u["username"] == "admin"][0]

    res = client.delete(f"/api/v1/users/{admin_user['id']}", headers=admin_headers)
    assert res.status_code == 400
    detail_msg = res.json()["detail"].lower()
    assert "cannot disable" in detail_msg or "last remaining administrator" in detail_msg

# 12. Account lockout after 5 failed login attempts
def test_account_lockout_after_failed_attempts():
    admin_headers = get_auth_headers("admin")

    # Create temporary user for lockout test
    client.post("/api/v1/users", json={
        "username": "lockout-user",
        "password": "ValidPassword123!",
        "email": "lockout@test.local",
        "full_name": "Lockout Test User",
        "role": "viewer"
    }, headers=admin_headers)

    # Make 5 failed login attempts
    for _ in range(5):
        client.post("/api/v1/auth/token", data={
            "username": "lockout-user",
            "password": "BadPassword123!"
        })

    # 6th attempt should return lockout message
    lockout_res = client.post("/api/v1/auth/token", data={
        "username": "lockout-user",
        "password": "ValidPassword123!"
    })
    assert lockout_res.status_code == 401
    assert "temporarily locked" in lockout_res.json()["detail"].lower()

# 13. Audit events generated
def test_audit_logs_record_user_actions():
    auditor_headers = get_auth_headers("auditor")
    res = client.get("/api/v1/audit", headers=auditor_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["integrity_verified"] is True
    actions = [e["action"] for e in data["events"]]
    assert any("login" in act.lower() or "user" in act.lower() for act in actions)
