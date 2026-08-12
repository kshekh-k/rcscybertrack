# RCS CyberTrack - Proposed REST API Contracts

This document specifies the formal proposed REST API contracts for Phase 4 backend integration. These contracts define the data models, request/response formats, and HTTP endpoints required for complete backend support across Users & RBAC, Threat Center Alerts, System Settings mutations, VPN connections, SD-WAN orchestration, and Traffic Telemetry.

> [!NOTE]
> All endpoints below are **PROPOSED CONTRACTS ONLY** unless already implemented in `/api/v1` (such as `/api/v1/health`, `/api/v1/system`, `/api/v1/firewall/rules`, `/api/v1/network/interfaces`, `/api/v1/network/routes`, `/api/v1/devices`, `/api/v1/audit`).

---

## 1. Users & Role-Based Access Control (RBAC)

### Endpoints

- `GET /api/v1/users` - List all system user accounts
- `POST /api/v1/users` - Create a new user account
- `GET /api/v1/users/{id}` - Retrieve details for a specific user
- `PUT /api/v1/users/{id}` - Update user account (role, status, email)
- `DELETE /api/v1/users/{id}` - Disable or delete a user account
- `GET /api/v1/roles` - Retrieve RBAC role permissions matrix

### Data Models

```typescript
export type UserRole = 'admin' | 'operator' | 'auditor' | 'viewer'
export type UserStatus = 'active' | 'disabled' | 'pending'

export interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
  created_at: string
  last_login?: string | null
  mfa_enabled: boolean
}

export interface Permission {
  module: 'dashboard' | 'firewall' | 'network' | 'devices' | 'audit' | 'users' | 'settings' | 'vpn' | 'sdwan' | 'analytics'
  read: boolean
  write: boolean
  execute: boolean
}

export interface RolePermissions {
  role: UserRole
  description: string
  permissions: Permission[]
}
```

---

## 2. Alerts & Threat Center

### Endpoints

- `GET /api/v1/alerts` - List security alerts and threat detections
- `GET /api/v1/alerts/{id}` - Retrieve specific alert payload & evidence
- `POST /api/v1/alerts/{id}/acknowledge` - Mark alert as acknowledged
- `POST /api/v1/alerts/{id}/resolve` - Mark alert as resolved with mitigation note

### Data Models

```typescript
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed'

export interface Alert {
  id: string
  timestamp: string
  severity: AlertSeverity
  title: string
  description: string
  source_ip?: string
  destination_ip?: string
  rule_id?: string
  status: AlertStatus
  assigned_to?: string
  mitigation_note?: string
  raw_payload?: Record<string, unknown>
}
```

---

## 3. System Settings Mutations

### Endpoints

- `GET /api/v1/settings` - Retrieve all appliance system settings
- `PUT /api/v1/settings/general` - Update general appliance hostname & timezone
- `PUT /api/v1/settings/logging` - Update log level, retention, and syslog forwarders
- `PUT /api/v1/settings/security` - Update session timeouts, MFA policies, CORS

### Data Models

```typescript
export interface SystemSettings {
  general: {
    hostname: string
    timezone: string
    domain: string
    banner_message?: string
  }
  logging: {
    log_level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
    audit_retention_days: number
    remote_syslog_server?: string
  }
  security: {
    session_timeout_minutes: number
    mfa_required: boolean
    max_login_attempts: number
    ip_lockout_duration_minutes: number
  }
  api: {
    enabled: boolean
    rate_limit_rpm: number
  }
}
```

---

## 4. Virtual Private Network (VPN)

### Endpoints

- `GET /api/v1/vpn/connections` - List active IPsec & WireGuard tunnels
- `GET /api/v1/vpn/peers` - List configured VPN remote peers
- `POST /api/v1/vpn/connections` - Provision new VPN tunnel
- `POST /api/v1/vpn/connections/{id}/restart` - Restart tunnel daemon

### Data Models

```typescript
export type VpnType = 'ipsec' | 'wireguard' | 'openvpn'
export type VpnStatus = 'up' | 'down' | 'connecting' | 'error'

export interface VpnConnection {
  id: string
  name: string
  type: VpnType
  local_endpoint: string
  remote_endpoint: string
  assigned_ip: string
  status: VpnStatus
  bytes_transmitted: number
  bytes_received: number
  uptime_seconds: number
}

export interface VpnPeer {
  id: string
  connection_id: string
  public_key?: string
  allowed_ips: string[]
  persistent_keepalive?: number
}
```

---

## 5. Software-Defined WAN (SD-WAN)

### Endpoints

- `GET /api/v1/sdwan/links` - List WAN interfaces & link health monitors
- `GET /api/v1/sdwan/policies` - List SD-WAN steering policies
- `POST /api/v1/sdwan/policies` - Create or update steering policy
- `GET /api/v1/sdwan/events` - Retrieve WAN failover and SLA events

### Data Models

```typescript
export type LinkStatus = 'active' | 'standby' | 'degraded' | 'down'

export interface WanLink {
  id: string
  name: string // e.g. WAN1, WAN2, WAN3
  interface: string
  provider: string
  bandwidth_down_mbps: number
  bandwidth_up_mbps: number
  status: LinkStatus
  latency_ms?: number
  jitter_ms?: number
  packet_loss_percent?: number
}

export interface SdwanPolicy {
  id: string
  name: string
  application: string
  preferred_link: string
  backup_link: string
  sla_max_latency_ms: number
  sla_max_packet_loss_percent: number
  enabled: boolean
}
```

---

## 6. Traffic Analytics

### Endpoints

- `GET /api/v1/analytics/traffic` - Retrieve time-series throughput & packet rate
- `GET /api/v1/analytics/top-sources` - Retrieve top bandwidth talkers by IP
- `GET /api/v1/analytics/top-destinations` - Retrieve top destination endpoints
- `GET /api/v1/analytics/sessions` - Retrieve active connection session table

### Data Models

```typescript
export interface TrafficMetricPoint {
  timestamp: string
  bytes_in: number
  bytes_out: number
  packets_in: number
  packets_out: number
  active_sessions: number
}

export interface TopTalker {
  ip_address: string
  hostname?: string
  bytes: number
  percentage: number
}
```
