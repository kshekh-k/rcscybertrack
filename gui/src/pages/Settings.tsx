import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Server,
  Shield,
  Terminal,
  Globe,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  History,
  GitCommit,
  Play,
  RotateCcw,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useSystemInfo } from '../features/dashboard/useSystemHealth'
import { SettingsSection } from '../components/cyber/SettingsSection'
import { StatusBadge } from '../components/cyber/StatusBadge'

export default function Settings() {
  const queryClient = useQueryClient()
  const token = localStorage.getItem('cybertrack_token')
  const { data: systemInfo } = useSystemInfo()

  const [activeTab, setActiveTab] = useState<'general' | 'system' | 'logging' | 'security' | 'admin' | 'history'>('general')

  // Candidate Staging Form State
  const [hostname, setHostname] = useState('rcs-cybertrack')
  const [timezone, setTimezone] = useState('UTC')
  const [logLevel, setLogLevel] = useState('INFO')
  const [auditRetention, setAuditRetention] = useState(90)
  const [sessionTimeout, setSessionTimeout] = useState(60)

  // Status & Error Banners
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch Config History
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['config-history'],
    queryFn: async () => {
      const res = await fetch('/api/v1/config/history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
  })

  // Fetch Active Config Version
  const { data: activeConfig } = useQuery({
    queryKey: ['config-active'],
    queryFn: async () => {
      const res = await fetch('/api/v1/config/active', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  // Stage Candidate Mutation
  const stageMutation = useMutation({
    mutationFn: async () => {
      setStatusMsg(null)
      setErrorMsg(null)
      const payload = {
        general: { hostname, timezone, domain: 'rcs-cybertrack.local' },
        logging: { log_level: logLevel, audit_retention_days: Number(auditRetention) },
        security: { session_timeout_minutes: Number(sessionTimeout) },
      }
      const res = await fetch('/api/v1/config/candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payload }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to stage candidate configuration')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['config-history'] })
      setStatusMsg(`Candidate Configuration v${data.version_number} staged successfully!`)
    },
    onError: (err: Error) => {
      setErrorMsg(err.message)
    },
  })

  // Commit Candidate Mutation
  const commitMutation = useMutation({
    mutationFn: async () => {
      setStatusMsg(null)
      setErrorMsg(null)
      const res = await fetch('/api/v1/config/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ commit_message: 'Staged configuration changes committed' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to commit candidate configuration')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['config-history'] })
      setStatusMsg(`Configuration v${data.version_number} COMMITTED!`)
    },
    onError: (err: Error) => {
      setErrorMsg(err.message)
    },
  })

  // Apply Configuration Mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      setStatusMsg(null)
      setErrorMsg(null)
      const res = await fetch('/api/v1/config/apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to apply configuration to OS Adapter')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['config-history'] })
      queryClient.invalidateQueries({ queryKey: ['config-active'] })
      setStatusMsg(`Configuration v${data.version_number} APPLIED & VERIFIED on OS Adapter!`)
    },
    onError: (err: Error) => {
      setErrorMsg(err.message)
    },
  })

  // Rollback Mutation
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      setStatusMsg(null)
      setErrorMsg(null)
      const res = await fetch(`/api/v1/config/rollback/${versionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to rollback configuration version')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['config-history'] })
      queryClient.invalidateQueries({ queryKey: ['config-active'] })
      setStatusMsg(`System successfully ROLLED BACK to Version v${data.version_number}!`)
    },
    onError: (err: Error) => {
      setErrorMsg(err.message)
    },
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">System Settings & Configuration Lifecycle</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Safe persistent configuration engine with Candidate Staging, Dry-Run Validation, OS Commit, and Rollback
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => stageMutation.mutate()}
            disabled={stageMutation.isPending}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 border border-border-subtle"
          >
            {stageMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5 text-accent" />}
            <span>Stage Candidate</span>
          </button>

          <button
            onClick={() => commitMutation.mutate()}
            disabled={commitMutation.isPending}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 border border-border-subtle"
          >
            {commitMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Commit</span>
          </button>

          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="px-4 py-2 bg-primary hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {applyMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Apply to OS</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 p-1 bg-app-bg border border-border-subtle rounded-lg overflow-x-auto w-full md:w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System & Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('logging')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'logging'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Logging & Syslog</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'admin'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Administration</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Version History ({history.length})</span>
        </button>
      </div>

      {/* SECTION 1: GENERAL */}
      {activeTab === 'general' && (
        <SettingsSection
          title="General Appliance Information"
          subtitle="Hostname, timezone, and global domain identity"
          icon={<Globe className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Appliance Hostname
              </label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="w-full px-4 py-2.5 bg-app-bg border border-border-subtle rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                System Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 bg-app-bg border border-border-subtle rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </SettingsSection>
      )}

      {/* SECTION 2: SYSTEM & ENGINE */}
      {activeTab === 'system' && (
        <SettingsSection
          title="Backend Subsystems & Processing Engine"
          subtitle="Kernel drivers, status, and management API configuration"
          icon={<Server className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-app-bg border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Firewall Engine Backend</h4>
                <p className="text-xs text-text-secondary mt-0.5">Kernel packet filtering driver</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-lg font-semibold uppercase">
                {systemInfo?.firewall_backend || 'nftables'}
              </span>
            </div>

            <div className="p-4 bg-app-bg border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Management REST API Status</h4>
                <p className="text-xs text-text-secondary mt-0.5">FastAPI Core Gateway</p>
              </div>
              <StatusBadge status="ONLINE (Port 8000)" variant="success" />
            </div>
          </div>
        </SettingsSection>
      )}

      {/* SECTION 3: LOGGING */}
      {activeTab === 'logging' && (
        <SettingsSection
          title="System Audit & Telemetry Logging"
          subtitle="Syslog verbosity, audit retention, and event storage policy"
          icon={<Terminal className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                System Log Level
              </label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-app-bg border border-border-subtle rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="DEBUG">DEBUG (Detailed Diagnostics)</option>
                <option value="INFO">INFO (Standard Production)</option>
                <option value="WARNING">WARNING (Warnings & Errors Only)</option>
                <option value="ERROR">ERROR (Errors Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Cryptographic Audit Log Retention (Days)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={auditRetention}
                onChange={(e) => setAuditRetention(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-app-bg border border-border-subtle rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </SettingsSection>
      )}

      {/* SECTION 4: SECURITY */}
      {activeTab === 'security' && (
        <SettingsSection
          title="Appliance Security Policies"
          subtitle="Authentication parameters, JWT session duration, and lockout policy"
          icon={<Shield className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                JWT Session Timeout (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-app-bg border border-border-subtle rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="p-4 bg-app-bg border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Brute-Force Account Lockout</h4>
                <p className="text-xs text-text-secondary mt-0.5">5 failed attempts → 15 min lock</p>
              </div>
              <StatusBadge status="ENABLED" variant="success" />
            </div>
          </div>
        </SettingsSection>
      )}

      {/* SECTION 5: ADMIN */}
      {activeTab === 'admin' && (
        <SettingsSection
          title="Appliance Administration & Backup"
          subtitle="Snapshot export, full configuration backup, and maintenance"
          icon={<KeyRound className="w-5 h-5" />}
        >
          <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Configuration Backup & Restore</h4>
                <p className="text-xs text-text-secondary">Export JSON snapshots of all active appliance rules and RBAC tables</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-semibold rounded-lg transition-colors border border-border-subtle">
              Export Backup
            </button>
          </div>
        </SettingsSection>
      )}

      {/* SECTION 6: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-accent" />
              <h3 className="text-base font-semibold text-text-primary">Configuration Version History</h3>
            </div>
            {activeConfig && (
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-3 py-1 rounded-full font-semibold">
                Active Version: v{activeConfig.version_number}
              </span>
            )}
          </div>

          {isHistoryLoading ? (
            <div className="p-8 text-center text-text-secondary text-xs">Loading configuration version log...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-xs">No configuration versions recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {history.map((ver: any) => (
                <div key={ver.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-text-primary">v{ver.version_number}</span>
                      <StatusBadge
                        status={ver.status.toUpperCase()}
                        variant={ver.status === 'active' ? 'success' : ver.status === 'committed' ? 'info' : 'neutral'}
                      />
                      <span className="text-xs font-mono text-slate-400">ID: {ver.id}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{ver.commit_message || 'No commit message specified'}</p>
                    <div className="flex items-center gap-4 text-[11px] text-text-muted">
                      <span>Author: {ver.created_by}</span>
                      <span>Created: {new Date(ver.created_at).toLocaleString()}</span>
                      {ver.applied_at && <span>Applied: {new Date(ver.applied_at).toLocaleString()}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ver.status !== 'active' && (
                      <button
                        onClick={() => rollbackMutation.mutate(ver.id)}
                        disabled={rollbackMutation.isPending}
                        className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/60 text-amber-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
