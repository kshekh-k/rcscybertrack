# RCS CyberTrack - High-Assurance Backend Security Architecture

This document documents the backend security architecture, service layer isolation, role-based access control (RBAC), cryptographic audit verification, and failure-safe mechanisms designed for **RCS CyberTrack Core**.

---

## 1. System Architecture & Service Isolation

```
                                RCS CYBERTRACK
                                       │
                                Management API
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
       Auth & RBAC             Config Service            Audit Logger
       (JWT / Bcrypt)         (YAML Validation)        (Cryptographic Hash)
            │                          │                          │
            └────────────┬─────────────┴────────────┬─────────────┘
                         │                          │
                    Firewall                   Network
                    Service                    Service
                         │                          │
                         └────────────┬─────────────┘
                                      │
                                 OS Adapter
                                      │
                                 Linux Host
                                      │
                            nftables / IPRoute2
```

### Core Architecture Components
1. **Management API Layer (`management.api.server`)**: FastAPI gateway exposing non-blocking REST endpoints under `/api/v1/`. Enforces JWT bearer token validation and strict role dependencies on every route.
2. **Auth & RBAC Subsystem (`management.auth.auth`)**: Manages salted bcrypt password hashing, 60-minute JWT token creation, and RBAC level verification.
3. **Configuration Engine (`management.config`)**: Deterministic YAML configuration loader and Pydantic validator ensuring zero unvalidated inputs reach the underlying OS adapter.
4. **Service Abstractions (`management.services.*`)**: Isolated Python domain services for Users, Alerts, Settings, VPN, SD-WAN, and Telemetry.
5. **Cryptographic Audit Logger (`management.audit.audit`)**: Tamper-proof log chain appending SHA-256 linked log records for every administrative action.

---

## 2. Authorization & Least-Privilege RBAC Matrix

Access to RCS CyberTrack backend routes is restricted to four distinct administrative roles:

| Role | Scope | Endpoint Access |
| :--- | :--- | :--- |
| **Admin** | Full Appliance Governance | Full access including User Management (`/api/v1/users`), Settings Mutations (`/api/v1/settings`), Firewall Rule Deletion, and System Maintenance. |
| **Security Operator** | Operational Security Controls | Firewall Rule Creation/Update, Alert Acknowledgment/Resolution, VPN Connection provisioning. No access to User management. |
| **Auditor** | Security & Compliance Oversight | Read-only access to Audit Logs (`/api/v1/audit`), System Configurations, and Integrity Verification. No mutation rights. |
| **Viewer** | NOC / System Monitoring | Read-only access to Health, Interfaces, Routes, Devices, Alerts, and Telemetry. No audit log access. |

### RBAC Route Enforcement Pattern
FastAPI dependencies enforce role constraints before executing endpoint handlers:
```python
@app.get("/api/v1/users", dependencies=[Depends(require_admin)])
@app.post("/api/v1/alerts/{id}/acknowledge", dependencies=[Depends(require_operator)])
@app.get("/api/v1/audit", dependencies=[Depends(require_auditor)])
```

---

## 3. Cryptographic Tamper-Proof Audit Logging

To guarantee non-repudiation and auditability, all administrative actions write an entry to the tamper-resistant audit chain.

### SHA-256 Cryptographic Link Calculation
Each log entry contains a cryptographic signature calculated over the current event payload concatenated with the previous log entry's hash:

$$H_i = \text{SHA256}(\text{timestamp}_i \parallel \text{user}_i \parallel \text{action}_i \parallel \text{resource}_i \parallel \text{resource\_id}_i \parallel \text{result}_i \parallel \text{source\_ip}_i \parallel H_{i-1})$$

### Integrity Verification
The audit log endpoint (`GET /api/v1/audit`) recalculates the hash chain sequentially from seed `000000...00` to verify that no log entry has been deleted, inserted, or modified by an unauthorized process.

---

## 4. Failure-Safe State & Deterministic Fallback

1. **Memory & Transaction Reversion**: Any exception during policy save (`_save_firewall_rules()`) or system apply instantly reverts memory state to prevent partial or inconsistent policy application.
2. **Safe Default Fallbacks**: If the host `nftables` or kernel network interface is offline, the service layer falls back to safe read-only mock configurations rather than crashing or exposing raw stack traces.
3. **No Dataplane Modification Without Validation**: Input parameters undergo strict regex, CIDR, and IP address validation via Pydantic model validators (`ipaddress.ip_network`, `ipaddress.ip_address`) before passing to adapter scripts.
