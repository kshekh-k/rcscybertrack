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
  module:
    | 'dashboard'
    | 'firewall'
    | 'network'
    | 'devices'
    | 'audit'
    | 'users'
    | 'settings'
    | 'vpn'
    | 'sdwan'
    | 'analytics'
  read: boolean
  write: boolean
  execute: boolean
}

export interface RolePermissions {
  role: UserRole
  description: string
  permissions: Permission[]
}

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

export interface SystemSettingsPayload {
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
