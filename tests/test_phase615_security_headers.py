import os
import pytest
from fastapi.testclient import TestClient

# Isolate host nftables netlink requirements for unit API tests
os.environ["CYBERTRACK_FIREWALL_BACKEND"] = "mock"

from management.api.server import app

client = TestClient(app)

# 1. GET /api/v1/health returns 200 and all required security headers
def test_security_headers_present_on_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert headers.get("Permissions-Policy") == "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    assert headers.get("Cross-Origin-Opener-Policy") == "same-origin"
    assert headers.get("Cross-Origin-Resource-Policy") == "same-origin"

# 2. Header values match policy across API endpoints
def test_security_headers_on_authenticated_endpoint():
    token_res = client.post("/api/v1/auth/token", data={"username": "admin", "password": "admin123"})
    assert token_res.status_code == 200
    token = token_res.json()["access_token"]

    system_res = client.get("/api/v1/system", headers={"Authorization": f"Bearer {token}"})
    assert system_res.status_code == 200
    assert system_res.headers.get("X-Content-Type-Options") == "nosniff"
    assert system_res.headers.get("X-Frame-Options") == "DENY"
    assert system_res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert system_res.headers.get("Permissions-Policy") == "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    assert system_res.headers.get("Cross-Origin-Opener-Policy") == "same-origin"
    assert system_res.headers.get("Cross-Origin-Resource-Policy") == "same-origin"

# 3. CORS works for allowed development origin
def test_cors_allowed_origin():
    allowed_origin = "http://localhost:5173"
    response = client.get("/api/v1/health", headers={"Origin": allowed_origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == allowed_origin
    assert response.headers.get("X-Content-Type-Options") == "nosniff"

# 4. OPTIONS preflight behavior remains functional and includes security headers
def test_options_preflight_request():
    allowed_origin = "http://localhost:5173"
    response = client.options("/api/v1/health", headers={
        "Origin": allowed_origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization"
    })
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == allowed_origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

# 5. Existing API behavior and response body format unchanged
def test_existing_api_response_body_format_unchanged():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data == {"status": "healthy", "service": "rcs-cybertrack-core"}

# 6. HSTS policy is excluded in development HTTP and included in production HTTPS
def test_hsts_policy_behavior(monkeypatch):
    # In development HTTP, HSTS is excluded
    monkeypatch.setenv("CYBERTRACK_ENV", "development")
    dev_res = client.get("/api/v1/health")
    assert dev_res.status_code == 200
    assert "Strict-Transport-Security" not in dev_res.headers

    # In production HTTPS / proxy, HSTS is included
    monkeypatch.setenv("CYBERTRACK_ENV", "production")
    prod_res = client.get("/api/v1/health", headers={"X-Forwarded-Proto": "https"})
    assert prod_res.status_code == 200
    assert prod_res.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"

