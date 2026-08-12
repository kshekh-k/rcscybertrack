# RCS CyberTrack - Safe Persistent Configuration Engine

This document specifies the Configuration Lifecycle Engine implemented in Phase 5.2 for **RCS CyberTrack Core**.

---

## 1. Safety Architecture Lifecycle

To prevent invalid or destructive configuration commands from directly mutating kernel and network hardware state, RCS CyberTrack enforces a strict 10-stage lifecycle:

```
GUI
 ↓
API Gateway (/api/v1/config/*)
 ↓
Authentication (JWT)
 ↓
Authorization (RBAC permission check 'system.write')
 ↓
Pre-Staging Schema Validation (Pydantic / Regex)
 ↓
Candidate Configuration Staging
 ↓
Transaction Commit (Message & Versioning)
 ↓
Privileged OS Adapter (Dry-Run Check)
 ↓
Apply to OS Engine
 ↓
Post-Apply Health Verification
 ↓
Cryptographic SHA-256 Audit Log
```

---

## 2. Candidate Staging vs Active State

1. **Candidate Configuration (`status = 'candidate'`)**:
   - Staged changes created via `POST /api/v1/config/candidate`.
   - Allows administrators to preview diffs (`GET /api/v1/config/diff`) before applying to live host hardware.
2. **Committed Configuration (`status = 'committed'`)**:
   - Locked candidate snapshot marked via `POST /api/v1/config/commit`.
3. **Active Configuration (`status = 'active'`)**:
   - Currently enforced live system settings applied by OS Adapter.

---

## 3. Failure-Safe Automatic Rollback

If an applied configuration fails the post-apply health verification check (`os_adapter.verify_health()`):
1. The Configuration Engine immediately catches the failure.
2. Executes `os_adapter.apply_config(previous_active_payload)`.
3. Automatically restores system state to the last known working version.
4. Appends a `CONFIG_VERIFY_FAILED` and `CONFIG_ROLLED_BACK` event to the cryptographic audit log.
