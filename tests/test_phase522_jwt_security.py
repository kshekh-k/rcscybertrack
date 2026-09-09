import os
import uuid
import datetime
import pytest
import jwt
from fastapi.testclient import TestClient

from management.api.server import app
from management.auth.auth import (
    create_access_token,
    decode_access_token,
    get_jwt_secret,
    get_jwt_issuer,
    get_jwt_audience,
    ALGORITHM
)

client = TestClient(app)

def set_env(monkeypatch, key: str, val: str = None):
    if val is None:
        monkeypatch.delenv(key, raising=False)
    else:
        monkeypatch.setenv(key, val)

# 1. Token Claims Completeness & JTI Uniqueness
def test_jwt_token_claims_completeness():
    token = create_access_token({"sub": "admin"})
    secret = get_jwt_secret()

    # Raw decode without verification to check claim structure
    raw_payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_signature": False, "verify_aud": False})

    assert "sub" in raw_payload and raw_payload["sub"] == "admin"
    assert "exp" in raw_payload
    assert "iat" in raw_payload
    assert "jti" in raw_payload and len(raw_payload["jti"]) > 10
    assert "iss" in raw_payload and raw_payload["iss"] == get_jwt_issuer()
    assert "aud" in raw_payload and raw_payload["aud"] == get_jwt_audience()
    assert "type" in raw_payload and raw_payload["type"] == "access"

def test_jti_uniqueness_per_token():
    token1 = create_access_token({"sub": "admin"})
    token2 = create_access_token({"sub": "admin"})

    payload1 = decode_access_token(token1)
    payload2 = decode_access_token(token2)

    assert payload1["jti"] != payload2["jti"]

# 2. Valid Token Authentication & RBAC Compatibility
def test_valid_token_authentication():
    token_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    assert token_res.status_code == 200
    token = token_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    system_res = client.get("/api/v1/system", headers=headers)
    assert system_res.status_code == 200
    assert system_res.json()["hostname"] is not None

def test_rbac_compatibility_with_hardened_jwt():
    # Login as operator
    op_res = client.post("/api/v1/auth/token", data={"username": "operator", "password": "operator123"})
    assert op_res.status_code == 200
    op_token = op_res.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    # Operator has network.read permission
    net_res = client.get("/api/v1/network/interfaces", headers=op_headers)
    assert net_res.status_code == 200

# 3. Token Expiration Enforcement
def test_expired_token_rejected():
    past_delta = datetime.timedelta(minutes=-10)
    expired_token = create_access_token({"sub": "admin"}, expires_delta=past_delta)

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(expired_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401

# 4. Signature Verification & Tampering Protection
def test_wrong_secret_signature_rejected():
    wrong_secret = "wrong-secret-key-123456789012345"
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "access"
    }
    bad_token = jwt.encode(payload, wrong_secret, algorithm="HS256")

    with pytest.raises(jwt.InvalidSignatureError):
        decode_access_token(bad_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {bad_token}"})
    assert res.status_code == 401

def test_tampered_payload_rejected():
    valid_token = create_access_token({"sub": "admin"})
    parts = valid_token.split(".")
    # Mutate header or payload part
    tampered_token = f"{parts[0]}.{parts[1]}tampered.{parts[2]}"

    with pytest.raises(jwt.PyJWTError):
        decode_access_token(tampered_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401

# 5. Algorithm Confusion Protection
def test_algorithm_none_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "access"
    }
    # Unsigned none token
    none_token = jwt.encode(payload, key=None, algorithm="none")

    with pytest.raises(jwt.PyJWTError):
        decode_access_token(none_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {none_token}"})
    assert res.status_code == 401

def test_algorithm_confusion_hs384_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "access"
    }
    hs384_token = jwt.encode(payload, secret, algorithm="HS384")

    with pytest.raises(jwt.InvalidAlgorithmError):
        decode_access_token(hs384_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {hs384_token}"})
    assert res.status_code == 401

# 6. Issuer Validation
def test_incorrect_issuer_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": "invalid-issuer-identity",
        "aud": get_jwt_audience(),
        "type": "access"
    }
    bad_iss_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.InvalidIssuerError):
        decode_access_token(bad_iss_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {bad_iss_token}"})
    assert res.status_code == 401

def test_missing_issuer_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "aud": get_jwt_audience(),
        "type": "access"
    }
    missing_iss_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.MissingRequiredClaimError):
        decode_access_token(missing_iss_token)

# 7. Audience Validation
def test_incorrect_audience_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": "wrong-audience-target",
        "type": "access"
    }
    bad_aud_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.InvalidAudienceError):
        decode_access_token(bad_aud_token)

def test_missing_audience_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "type": "access"
    }
    missing_aud_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.MissingRequiredClaimError):
        decode_access_token(missing_aud_token)

# 8. Subject Validation
def test_missing_subject_rejected():
    secret = get_jwt_secret()
    payload = {
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "access"
    }
    no_sub_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.MissingRequiredClaimError):
        decode_access_token(no_sub_token)

def test_nonexistent_user_subject_rejected():
    ghost_token = create_access_token({"sub": "nonexistent_ghost_user"})
    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {ghost_token}"})
    assert res.status_code == 401

# 9. Issued-At Timestamp Validation
def test_future_iat_rejected():
    secret = get_jwt_secret()
    future_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    payload = {
        "sub": "admin",
        "exp": future_time + datetime.timedelta(minutes=30),
        "iat": future_time,
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "access"
    }
    future_iat_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(future_iat_token)

# 10. Token Purpose Separation (Type Claim)
def test_incorrect_token_type_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "type": "refresh"  # Invalid token purpose for access auth
    }
    refresh_type_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(refresh_type_token)

    res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {refresh_type_token}"})
    assert res.status_code == 401

def test_missing_token_type_rejected():
    secret = get_jwt_secret()
    payload = {
        "sub": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": uuid.uuid4().hex,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience()
    }
    no_type_token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(jwt.MissingRequiredClaimError):
        decode_access_token(no_type_token)

# 11. Production Mode Issuer & Audience Requirement
def test_production_mode_issuer_and_audience_required(monkeypatch):
    set_env(monkeypatch, "CYBERTRACK_ENV", "production")
    set_env(monkeypatch, "CYBERTRACK_JWT_SECRET", "valid-prod-secret-key-32-chars-long!")
    set_env(monkeypatch, "CYBERTRACK_JWT_ISSUER", None)

    with pytest.raises(ValueError, match="CYBERTRACK_JWT_ISSUER environment variable is required"):
        get_jwt_issuer()

    set_env(monkeypatch, "CYBERTRACK_JWT_ISSUER", "rcs-cybertrack-api")
    set_env(monkeypatch, "CYBERTRACK_JWT_AUDIENCE", None)

    with pytest.raises(ValueError, match="CYBERTRACK_JWT_AUDIENCE environment variable is required"):
        get_jwt_audience()
