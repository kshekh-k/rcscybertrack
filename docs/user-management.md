# RCS CyberTrack - Persistent User Management Guide

This document specifies the persistent User & RBAC Subsystem implemented in Phase 5.1 for **RCS CyberTrack Core**.

---

## 1. User Account Lifecycle

All user accounts are stored in a persistent SQLite database (`./data/cybertrack.db` or configured via `CYBERTRACK_DATABASE_URL`).

### User Schema Attributes
- `id`: Unique identifier formatted as `usr-<uuid8>` (e.g. `usr-a1b2c3d4`).
- `username`: Unique username (3 to 64 alphanumeric characters).
- `email`: User contact email address.
- `full_name`: User full display name.
- `password_hash`: Salted `bcrypt` hash (never plaintext, never returned in API responses).
- `role`: One of `admin`, `operator`, `auditor`, `viewer`.
- `enabled`: Boolean status flag (`True` = active, `False` = disabled/revoked).
- `failed_login_attempts`: Integer tracking consecutive password failures.
- `locked_until`: UTC timestamp indicating temporary lockout expiry.
- `last_login_at`: UTC timestamp of last successful authentication.

---

## 2. Default Bootstrap Accounts

When a fresh database is initialized, the system automatically seeds initial development accounts if 0 users exist:

| Username | Default Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Primary System Administrator |
| `operator` | `operator123` | `operator` | Security Operations Lead |
| `auditor` | `auditor123` | `auditor` | Compliance Audit Lead |
| `viewer` | `viewer123` | `viewer` | Read-Only NOC Monitor |

> [!WARNING]
> **Production Security Mandate**:
> Default development passwords must be changed immediately upon appliance installation. Customize bootstrap credentials in production using environment variables:
> - `CYBERTRACK_BOOTSTRAP_ADMIN_USERNAME`
> - `CYBERTRACK_BOOTSTRAP_ADMIN_PASSWORD`

---

## 3. Administrator Protection Policies

To prevent accidental lockout or governance disruption:
1. **Self-Disable Protection**: Users cannot disable or demote their own active administrative account.
2. **Last Administrator Protection**: The system rejects any request to disable, delete, or demote the last remaining active `admin` account in the database.
