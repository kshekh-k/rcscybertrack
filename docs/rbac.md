# RCS CyberTrack - Role-Based Access Control (RBAC) Architecture

RCS CyberTrack Core uses a centralized Permission-Based Authorization framework mapping administrative roles to granular access rights.

---

## 1. Centralized Permission Matrix

| Permission | Description | Admin | Operator | Auditor | Viewer |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `system.read` | View appliance health, status, system parameters | Yes | Yes | Yes | Yes |
| `system.write` | Update system settings, hostname, timezone | Yes | No | No | No |
| `firewall.read` | Inspect active firewall policies & rules | Yes | Yes | Yes | Yes |
| `firewall.write` | Create, update, apply, delete firewall rules | Yes | Yes | No | No |
| `network.read` | View network interfaces, routes, DHCP, DNS | Yes | Yes | Yes | Yes |
| `network.write` | Configure network interfaces and routing | Yes | Yes | No | No |
| `devices.read` | Inspect connected network device inventory | Yes | Yes | Yes | Yes |
| `audit.read` | Read tamper-proof cryptographic audit logs | Yes | No | Yes | No |
| `users.read` | List user accounts & role assignments | Yes | No | Yes | No |
| `users.write` | Provision, update, disable user accounts | Yes | No | No | No |
| `alerts.read` | View security alerts and threat detections | Yes | Yes | Yes | Yes |
| `alerts.write` | Acknowledge & resolve threat alerts | Yes | Yes | No | No |
| `vpn.read` | Inspect VPN tunnel states & peers | Yes | Yes | Yes | Yes |
| `vpn.write` | Provision VPN connections | Yes | Yes | No | No |
| `sdwan.read` | Inspect SD-WAN links & SLA health | Yes | Yes | Yes | Yes |
| `sdwan.write` | Modify SD-WAN steering policies | Yes | Yes | No | No |
| `analytics.read` | View traffic telemetry & session stats | Yes | Yes | Yes | Yes |

---

## 2. Backend Enforcement & Hardened Protection Rules

All authorization checks are enforced server-side via FastAPI dependency injections using exact permission strings:
```python
@app.get("/api/v1/users", dependencies=[Depends(require_permission("users.read"))])
@app.post("/api/v1/users", dependencies=[Depends(require_permission("users.write"))])
```

### Production Hardening Controls:
1. **User Self-Protection**: Active users are strictly blocked from disabling their own account or modifying/demoting their own role level (`update_user` / `disable_user`).
2. **Last-Admin Safeguards**: System enforces that the final active administrator account cannot be disabled, deleted, or demoted to a non-admin role.
3. **Audit Log Credential Redaction**: All sensitive data fields (`password`, `secret`, `token`, `api_key`, `private_key`, `credentials`) passed in details payloads are automatically redacted to `[REDACTED]` prior to hash-chaining and disk persistence.
