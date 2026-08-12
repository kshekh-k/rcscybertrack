# RCS CyberTrack - Authentication & Lockout Security

This document outlines the authentication protocol, JWT token structure, password policy, and brute-force lockout safeguards enforced in **RCS CyberTrack Core**.

---

## 1. Authentication Protocol & Flow

1. **Endpoint**: `POST /api/v1/auth/token`
2. **Payload**: `application/x-www-form-urlencoded` (`username`, `password`)
3. **Response**: JSON object `{ "access_token": "<JWT_STRING>", "token_type": "bearer" }`
4. **Header Requirement**: Subsequent requests must pass `Authorization: Bearer <JWT_STRING>`.

---

## 2. Password Security & Hashing

- **Algorithm**: `bcrypt` with adaptive salt generation (`gensalt()`).
- **Policy Enforcement**:
  - Minimum length: 8 characters.
  - Plaintext passwords and hashes are **never** logged or exposed in API outputs.
  - Trivial passwords (e.g. `password`, `12345678`) are rejected during account provisioning.

---

## 3. Failed Login Counting & Account Lockout

To defend against brute-force password guessing attacks:
- Consecutive invalid password attempts increment `failed_login_attempts`.
- Upon reaching **5 failed attempts**, the account is locked for **15 minutes** (`locked_until = UTC_NOW + 15m`).
- During the lockout window, authentication requests immediately return HTTP 401: `"Account is temporarily locked due to failed login attempts"`.
- Successful authentication clears `failed_login_attempts` to 0 and resets `locked_until`.
- Audit log events (`ACCOUNT_LOCKED`, `LOGIN_FAILURE`, `LOGIN_SUCCESS`) are automatically appended to the cryptographic log chain.
