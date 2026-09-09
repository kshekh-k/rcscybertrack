#!/usr/bin/env python3
"""
RCS CyberTrack Production Smoke Test Suite

Runs non-destructive validation against a running RCS CyberTrack management API instance.
Usage:
    python3 os/scripts/smoke_test.py [--url http://127.0.0.1:8000]
"""

import sys
import argparse
import urllib.request
import urllib.error
import json

def run_smoke_tests(base_url: str) -> bool:
    print(f"=== RCS CyberTrack Production Smoke Test ===")
    print(f"Target Base URL: {base_url}\n")
    
    passed = True

    # 1. Health Endpoint Check
    health_url = f"{base_url.rstrip('/')}/api/v1/health"
    try:
        req = urllib.request.Request(health_url, method="GET")
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
            headers = dict(resp.headers)

            if status == 200 and body.get("status") == "healthy":
                print("[PASS] GET /api/v1/health -> 200 OK (Healthy)")
            else:
                print(f"[FAIL] GET /api/v1/health -> Unexpected body/status: {status}, {body}")
                passed = False

            # Header verification
            sec_headers = {
                "x-content-type-options": "nosniff",
                "x-frame-options": "DENY",
                "referrer-policy": "strict-origin-when-cross-origin"
            }
            for h_name, h_val in sec_headers.items():
                actual = headers.get(h_name, headers.get(h_name.title()))
                if actual == h_val:
                    print(f"[PASS] Header '{h_name}' -> '{actual}'")
                else:
                    print(f"[FAIL] Header '{h_name}' -> Expected '{h_val}', got '{actual}'")
                    passed = False

    except Exception as e:
        print(f"[FAIL] GET /api/v1/health failed with error: {e}")
        passed = False

    # 2. CORS & Preflight Check
    try:
        cors_req = urllib.request.Request(
            health_url,
            method="OPTIONS",
            headers={
                "Origin": "https://console.rcscybertrack.in",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization"
            }
        )
        with urllib.request.urlopen(cors_req) as resp:
            if resp.status == 200:
                print("[PASS] OPTIONS /api/v1/health (CORS Preflight) -> 200 OK")
            else:
                print(f"[FAIL] OPTIONS /api/v1/health -> Status: {resp.status}")
                passed = False
    except Exception as e:
        print(f"[WARN] OPTIONS preflight check warning: {e}")

    print("\n" + ("=" * 44))
    if passed:
        print("RESULT: PRODUCTION SMOKE TEST PASSED 100%")
    else:
        print("RESULT: PRODUCTION SMOKE TEST FAILED")
    print("=" * 44)

    return passed

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RCS CyberTrack Smoke Test")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="Base URL of API")
    args = parser.parse_args()
    
    success = run_smoke_tests(args.url)
    sys.exit(0 if success else 1)
