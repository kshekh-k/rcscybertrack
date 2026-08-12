export interface AddressPort {
  address: string
  port?: number | string | null
}

export interface FirewallRule {
  id: string
  action: 'allow' | 'deny' | 'reject'
  direction: 'input' | 'output' | 'forward'
  interface?: string | null
  protocol: 'tcp' | 'udp' | 'icmp' | 'any'
  source: AddressPort
  destination: AddressPort
  state: ('new' | 'established' | 'related')[]
  logging: boolean
}

export interface HealthResponse {
  status: string
  service: string
}

export interface SystemInfo {
  hostname: string
  timezone: string
  log_level: string
  firewall_backend: string
  api_enabled: boolean
}

export interface IPv4Config {
  address?: string | null
  prefix?: number | null
  dhcp: boolean
}

export interface InterfaceConfig {
  name: string
  enabled: boolean
  ipv4: IPv4Config
}

export interface RouteConfig {
  destination: string
  gateway: string
  interface: string
  metric?: number | null
}

export interface Device {
  id: string
  hostname: string
  ip_address: string
  mac_address: string
  device_type: 'router' | 'switch' | 'firewall' | 'ap' | 'server' | 'client' | 'iot'
  operating_system?: string | null
  status: 'online' | 'offline' | 'degraded'
  last_seen: string
  tags: string[]
}

export interface AuditEvent {
  timestamp: string
  user: string
  action: string
  resource: string
  resource_id: string
  result: string
  source_ip?: string
  details?: Record<string, unknown>
  chain_hash?: string
}

export interface AuditLogResponse {
  integrity_verified: boolean
  log_count: number
  events: AuditEvent[]
}

const TOKEN_KEY = 'cybertrack_token'
const USERNAME_KEY = 'cybertrack_username'

// Mock fallback rules in case the API is offline
const MOCK_RULES: FirewallRule[] = [
  {
    id: 'rule-allow-ssh',
    action: 'allow',
    direction: 'input',
    interface: 'eth0',
    protocol: 'tcp',
    source: { address: 'any', port: null },
    destination: { address: 'any', port: 22 },
    state: ['new'],
    logging: true
  },
  {
    id: 'rule-allow-http',
    action: 'allow',
    direction: 'input',
    interface: 'eth0',
    protocol: 'tcp',
    source: { address: 'any', port: null },
    destination: { address: 'any', port: 8000 },
    state: ['new'],
    logging: false
  },
  {
    id: 'rule-block-malicious',
    action: 'deny',
    direction: 'input',
    interface: 'eth0',
    protocol: 'any',
    source: { address: '198.51.100.0/24', port: null },
    destination: { address: 'any', port: null },
    state: [],
    logging: true
  }
]

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const targetUrl = (baseUrl && url.startsWith('/api')) ? `${baseUrl.replace(/\/$/, '')}${url}` : url

  const response = await fetch(targetUrl, { ...options, headers })

  if (response.status === 401) {
    // Session expired or unauthorized
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const text = await response.text()
    let errorDetail = 'API Request Failed'
    try {
      const parsed = JSON.parse(text)
      errorDetail = parsed.detail || errorDetail
    } catch {
      errorDetail = text || errorDetail
    }
    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

export const api = {
  async login(username: string, password: string): Promise<void> {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch('/api/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      throw new Error('Invalid username or password')
    }

    const data = await response.json()
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USERNAME_KEY, username)
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY)
  },

  getUsername(): string {
    return localStorage.getItem(USERNAME_KEY) || 'Administrator'
  },

  async getHealth(): Promise<HealthResponse> {
    return await apiFetch<HealthResponse>('/api/v1/health')
  },

  async getSystemInfo(): Promise<SystemInfo> {
    return await apiFetch<SystemInfo>('/api/v1/system')
  },

  async getFirewallRules(): Promise<FirewallRule[]> {
    try {
      return await apiFetch<FirewallRule[]>('/api/v1/firewall/rules')
    } catch (error) {
      console.warn('API error fetching firewall rules, falling back to mock configurations:', error)
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error
      }
      return MOCK_RULES
    }
  },

  async createFirewallRule(rule: FirewallRule): Promise<FirewallRule> {
    try {
      return await apiFetch<FirewallRule>('/api/v1/firewall/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rule)
      })
    } catch (error) {
      console.warn('API offline: Simulating creation of firewall rule locally.')
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error
      }
      return rule
    }
  },

  async updateFirewallRule(ruleId: string, rule: FirewallRule): Promise<FirewallRule> {
    try {
      return await apiFetch<FirewallRule>(`/api/v1/firewall/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rule)
      })
    } catch (error) {
      console.warn('API offline: Simulating update of firewall rule locally.')
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error
      }
      return rule
    }
  },

  async deleteFirewallRule(ruleId: string): Promise<void> {
    try {
      await apiFetch<void>(`/api/v1/firewall/rules/${ruleId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.warn('API offline: Simulating deletion of firewall rule locally.')
      if (error instanceof Error && error.message === 'Unauthorized') {
        throw error
      }
    }
  },

  async getNetworkInterfaces(): Promise<InterfaceConfig[]> {
    return await apiFetch<InterfaceConfig[]>('/api/v1/network/interfaces')
  },

  async getNetworkRoutes(): Promise<RouteConfig[]> {
    return await apiFetch<RouteConfig[]>('/api/v1/network/routes')
  },

  async getDevices(): Promise<Device[]> {
    return await apiFetch<Device[]>('/api/v1/devices')
  },

  async getAuditLogs(): Promise<AuditLogResponse> {
    return await apiFetch<AuditLogResponse>('/api/v1/audit')
  }
}

