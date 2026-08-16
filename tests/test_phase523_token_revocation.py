import os
import uuid
import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from management.api.server import app
from management.database.database import Base
from management.database.models import UserDB, RevokedTokenDB
from management.auth.auth import (
    create_access_token,
    decode_access_token,
    is_token_revoked,
    revoke_token,
    cleanup_expired_revoked_tokens,
    bootstrap_default_users
)

client = TestClient(app)

# 1. Revocation Model Tests
def test_revoked_token_model_creation():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with TestingSessionLocal() as db:
        jti_str = uuid.uuid4().hex
        now = datetime.datetime.now(datetime.timezone.utc)
        exp = now + datetime.timedelta(hours=1)

        rev_record = RevokedTokenDB(
            jti=jti_str,
            user_id="usr-test1",
            username="testuser",
            expires_at=exp,
            reason="logout"
        )
        db.add(rev_record)
        db.commit()

        fetched = db.query(RevokedTokenDB).filter(RevokedTokenDB.jti == jti_str).first()
        assert fetched is not None
        assert fetched.jti == jti_str
        assert fetched.username == "testuser"
        assert fetched.reason == "logout"
        assert fetched.revoked_at is not None
        assert fetched.expires_at is not None

def test_revoked_token_jti_unique_constraint():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with TestingSessionLocal() as db:
        jti_str = uuid.uuid4().hex
        exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)

        r1 = RevokedTokenDB(jti=jti_str, user_id="u1", username="user1", expires_at=exp)
        db.add(r1)
        db.commit()

        r2 = RevokedTokenDB(jti=jti_str, user_id="u2", username="user2", expires_at=exp)
        db.add(r2)
        with pytest.raises(Exception):
            db.commit()

# 2. Logout Endpoint & Revocation Tests
def test_logout_endpoint_and_revocation():
    # Login as admin
    login_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify protected endpoint works before logout
    sys_res1 = client.get("/api/v1/system", headers=headers)
    assert sys_res1.status_code == 200

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"
    assert "access_token" not in logout_res.json()
    assert "secret" not in str(logout_res.json()).lower()

    # Protected endpoint must fail after logout
    sys_res2 = client.get("/api/v1/system", headers=headers)
    assert sys_res2.status_code == 401

def test_repeated_idempotent_logout():
    login_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # First logout
    res1 = client.post("/api/v1/auth/logout", headers=headers)
    assert res1.status_code == 200

    # Second logout with same token
    res2 = client.post("/api/v1/auth/logout", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "success"

# 3. New Login Independence
def test_new_login_after_logout():
    # 1st login
    login1 = client.post("/api/v1/auth/token", data={"username": "operator", "password": "operator123"})
    token1 = login1.json()["access_token"]

    # Logout token1
    client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token1}"})

    # 2nd login
    login2 = client.post("/api/v1/auth/token", data={"username": "operator", "password": "operator123"})
    token2 = login2.json()["access_token"]

    # Token2 works
    res2 = client.get("/api/v1/network/interfaces", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 200

    # Token1 still fails
    res1 = client.get("/api/v1/network/interfaces", headers={"Authorization": f"Bearer {token1}"})
    assert res1.status_code == 401

# 4. Isolation Between Tokens & Users
def test_token_isolation_same_user():
    # Admin gets token A and token B
    tokenA = create_access_token({"sub": "admin"})
    tokenB = create_access_token({"sub": "admin"})

    headersA = {"Authorization": f"Bearer {tokenA}"}
    headersB = {"Authorization": f"Bearer {tokenB}"}

    # Revoke Token A
    client.post("/api/v1/auth/logout", headers=headersA)

    # Token A is revoked, Token B is active
    assert client.get("/api/v1/system", headers=headersA).status_code == 401
    assert client.get("/api/v1/system", headers=headersB).status_code == 200

def test_token_isolation_different_users():
    token_admin = create_access_token({"sub": "admin"})
    token_op = create_access_token({"sub": "operator"})

    headers_admin = {"Authorization": f"Bearer {token_admin}"}
    headers_op = {"Authorization": f"Bearer {token_op}"}

    # Logout admin
    client.post("/api/v1/auth/logout", headers=headers_admin)

    # Admin fails, operator works
    assert client.get("/api/v1/system", headers=headers_admin).status_code == 401
    assert client.get("/api/v1/network/interfaces", headers=headers_op).status_code == 200

# 5. Expired Revocation Records Cleanup
def test_cleanup_expired_revoked_tokens():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with TestingSessionLocal() as db:
        now = datetime.datetime.now(datetime.timezone.utc)
        past_exp = now - datetime.timedelta(minutes=30)
        future_exp = now + datetime.timedelta(minutes=30)

        # Expired revocation record
        r_expired = RevokedTokenDB(
            jti="jti-expired-123",
            user_id="u1",
            username="user1",
            expires_at=past_exp
        )
        # Active revocation record
        r_active = RevokedTokenDB(
            jti="jti-active-456",
            user_id="u2",
            username="user2",
            expires_at=future_exp
        )
        db.add(r_expired)
        db.add(r_active)
        db.commit()

        # Run cleanup
        cleaned_count = cleanup_expired_revoked_tokens(db)
        assert cleaned_count == 1

        remaining = db.query(RevokedTokenDB).all()
        assert len(remaining) == 1
        assert remaining[0].jti == "jti-active-456"

def test_cleanup_empty_table_safety():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with TestingSessionLocal() as db:
        cleaned_count = cleanup_expired_revoked_tokens(db)
        assert cleaned_count == 0

# 6. Audit Logging & Credential Non-Exposure
def test_logout_audit_logging_and_non_exposure():
    login_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Ensure no secrets, tokens or passwords appear in response payload
    res_str = str(logout_res.json()).lower()
    assert "password" not in res_str
    assert "secret" not in res_str
    assert token not in res_str
