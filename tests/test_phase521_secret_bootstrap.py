import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from management.api.server import app
from management.database.database import Base
from management.database.models import UserDB
from management.auth.auth import (
    get_jwt_secret,
    get_app_env,
    is_production,
    bootstrap_default_users,
    create_access_token,
    get_bootstrap_credentials,
    validate_bootstrap_password
)

client = TestClient(app)

# Helper to clear environment overrides for testing
def set_env(monkeypatch, key: str, val: str = None):
    if val is None:
        monkeypatch.delenv(key, raising=False)
    else:
        monkeypatch.setenv(key, val)

# 1. JWT secret is required in production
def test_jwt_secret_required_in_production(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "production")
    set_env(monkeypatch, "CYBERTRACK_JWT_SECRET", None)
    with pytest.raises(ValueError, match="CYBERTRACK_JWT_SECRET environment variable is required in production mode"):
        get_jwt_secret()

# 2. Missing production JWT secret fails securely
def test_missing_production_jwt_secret_fails_securely(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "production")
    set_env(monkeypatch, "CYBERTRACK_JWT_SECRET", "")
    with pytest.raises(ValueError, match="CYBERTRACK_JWT_SECRET environment variable is required"):
        get_jwt_secret()

# 3. Known/default JWT placeholder is rejected in production
def test_known_default_jwt_placeholder_rejected_in_production(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "production")
    set_env(monkeypatch, "CYBERTRACK_JWT_SECRET", "rcs-cybertrack-super-secret-key-change-in-production")
    with pytest.raises(ValueError, match="unsafe default or placeholder string"):
        get_jwt_secret()

    set_env(monkeypatch, "CYBERTRACK_JWT_SECRET", "CHANGE_ME_IN_PRODUCTION_SUPER_SECRET_KEY_123")
    with pytest.raises(ValueError, match="unsafe default or placeholder string"):
        get_jwt_secret()

# 4. Development mode can still initialize correctly for tests
def test_development_mode_initialization(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "development")
    set_env(monkeypatch, "CYBERTRACK_JWT_SECRET", None)
    secret = get_jwt_secret()
    assert secret is not None
    assert len(secret) > 0

# 5. Production bootstrap password is required when bootstrap is enabled
def test_production_bootstrap_password_required(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "production")
    set_env(monkeypatch, "CYBERTRACK_BOOTSTRAP_ENABLED", "true")
    set_env(monkeypatch, "CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD", None)
    with pytest.raises(ValueError, match="CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD environment variable is required"):
        get_bootstrap_credentials()

# 6. Weak bootstrap password is rejected
def test_weak_bootstrap_password_rejected(monkeypatch):
    with pytest.raises(ValueError, match="at least 8 characters long"):
        validate_bootstrap_password("short", "admin", is_prod=False)

# 7. Known default bootstrap password is rejected in production
def test_known_default_bootstrap_password_rejected_in_production(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "production")
    set_env(monkeypatch, "CYBERTRACK_BOOTSTRAP_ENABLED", "true")
    set_env(monkeypatch, "CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD", "admin123")
    with pytest.raises(ValueError, match="cannot use a known default or placeholder string"):
        get_bootstrap_credentials()

# 8. Bootstrap remains idempotent
def test_bootstrap_idempotence():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with TestingSessionLocal() as db:
        # First bootstrap
        bootstrap_default_users(db)
        count_1 = db.query(UserDB).count()
        assert count_1 == 4

        # Second bootstrap call does not add extra users
        bootstrap_default_users(db)
        count_2 = db.query(UserDB).count()
        assert count_2 == count_1

# 9. Existing users are not overwritten
def test_existing_users_not_overwritten():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with TestingSessionLocal() as db:
        custom_user = UserDB(
            id="usr-custom",
            username="custom_admin",
            email="custom@test.local",
            full_name="Custom Admin",
            password_hash="hash123",
            role="admin",
            enabled=True
        )
        db.add(custom_user)
        db.commit()

        # Run bootstrap on database with existing user
        bootstrap_default_users(db)
        users = db.query(UserDB).all()
        assert len(users) == 1
        assert users[0].username == "custom_admin"

# 10. Bootstrap credentials are never returned by APIs
def test_bootstrap_credentials_never_returned_by_apis():
    # Login as admin
    token_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    assert token_res.status_code == 200
    token = token_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    users_res = client.get("/api/v1/users", headers=headers)
    assert users_res.status_code == 200
    for u in users_res.json():
        assert "password" not in u
        assert "password_hash" not in u

# 11. JWT secret is never exposed through API responses
def test_jwt_secret_never_exposed_in_api_responses():
    secret = get_jwt_secret()

    # Login endpoint response check
    token_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    assert token_res.status_code == 200
    assert secret not in str(token_res.json())

    # System endpoint response check
    token = token_res.json()["access_token"]
    system_res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {token}"})
    assert system_res.status_code == 200
    assert secret not in str(system_res.json())

# 12. Existing authentication tests continue passing
def test_existing_authentication_flow_passes():
    token_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    assert token_res.status_code == 200
    assert "access_token" in token_res.json()
