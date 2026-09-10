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
  Palette,
} from 'lucide-react'
import { useSystemInfo } from '../features/dashboard/useSystemHealth'
import { SettingsSection } from '../components/cyber/SettingsSection'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { Button } from '../components/ui/button'
import { useBrand } from '../lib/brand'

export default function Settings() {
  const queryClient = useQueryClient()
  const token = localStorage.getItem('cybertrack_token')
  const { data: systemInfo } = useSystemInfo()
  const { brand, updateBrand, resetBrand } = useBrand()

  const [activeTab, setActiveTab] = useState<'general' | 'system' | 'logging' | 'security' | 'admin' | 'branding' | 'history'>('general')

  // Branding Form State
  const [brandName, setBrandName] = useState(brand.brandName)
  const [tagline, setTagline] = useState(brand.tagline)
  const [logoLight, setLogoLight] = useState(brand.logoLight)
  const [logoDark, setLogoDark] = useState(brand.logoDark)
  const [iconLight, setIconLight] = useState(brand.iconLight || '/images/icon-dark.svg')
  const [iconDark, setIconDark] = useState(brand.iconDark || '/images/icon-white.svg')

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
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 "
          >
            {stageMutation.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <GitCommit className="size-3.5 text-accent" />}
            <span>Stage Candidate</span>
          </button>

          <button
            onClick={() => commitMutation.mutate()}
            disabled={commitMutation.isPending}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 "
          >
            {commitMutation.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5 text-emerald-400" />}
            <span>Commit</span>
          </button>

          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="px-4 py-2 bg-primary hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {applyMutation.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            <span>Apply to OS</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div className="p-4 bg-emerald-950/40 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/40 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="size-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 p-1 bg-app-bg rounded-lg overflow-x-auto w-full md:w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Globe className="size-4" />
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
          <Server className="size-4" />
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
          <Terminal className="size-4" />
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
          <Shield className="size-4" />
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
          <KeyRound className="size-4" />
          <span>Administration</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Palette className="size-4" />
          <span>Branding & Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <History className="size-4" />
          <span>Version History ({history.length})</span>
        </button>
      </div>

      {/* SECTION 1: GENERAL */}
      {activeTab === 'general' && (
        <SettingsSection
          title="General Appliance Information"
          subtitle="Hostname, timezone, and global domain identity"
          icon={<Globe className="size-5" />}
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
                className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                System Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
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
          icon={<Server className="size-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-app-bg rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Firewall Engine Backend</h4>
                <p className="text-xs text-text-secondary mt-0.5">Kernel packet filtering driver</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-cyan-950/80 text-cyan-300 rounded-lg font-semibold uppercase">
                {systemInfo?.firewall_backend || 'nftables'}
              </span>
            </div>

            <div className="p-4 bg-app-bg rounded-xl flex items-center justify-between">
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
          icon={<Terminal className="size-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                System Log Level
              </label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
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
                className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
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
          icon={<Shield className="size-5" />}
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
                className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="p-4 bg-app-bg rounded-xl flex items-center justify-between">
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
          icon={<KeyRound className="size-5" />}
        >
          <div className="p-4 bg-amber-950/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Configuration Backup & Restore</h4>
                <p className="text-xs text-text-secondary">Export JSON snapshots of all active appliance rules and RBAC tables</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-semibold rounded-lg transition-colors ">
              Export Backup
            </button>
          </div>
        </SettingsSection>
      )}

      {/* SECTION: BRANDING */}
      {activeTab === 'branding' && (
        <SettingsSection
          title="White-Label & Brand Customization"
          subtitle="Set default product logos, brand name, and platform tagline for light and dark modes"
          icon={<Palette className="size-5 text-accent" />}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateBrand({ brandName, tagline, logoLight, logoDark, iconLight, iconDark })
              setStatusMsg('Branding settings updated successfully!')
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Brand / Product Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:border-accent"
                  placeholder="RCS CyberTrack"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Platform Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:border-accent"
                  placeholder="Security Platform"
                />
              </div>
            </div>

            {/* Logos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Light Mode Logo Path / URL
                </label>
                <input
                  type="text"
                  value={logoLight}
                  onChange={(e) => setLogoLight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  placeholder="/images/rcs-cyber-track-logo-dark.svg"
                />
                <p className="text-2xs text-text-muted mt-1">Logo shown on light background (Default: /images/rcs-cyber-track-logo-dark.svg)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Dark Mode Logo Path / URL
                </label>
                <input
                  type="text"
                  value={logoDark}
                  onChange={(e) => setLogoDark(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  placeholder="/images/rcs-cyber-track-logo-white.svg"
                />
                <p className="text-2xs text-text-muted mt-1">Logo shown on dark background (Default: /images/rcs-cyber-track-logo-white.svg)</p>
              </div>
            </div>

            {/* Collapsed Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Light Mode Collapsed Icon Path / URL
                </label>
                <input
                  type="text"
                  value={iconLight}
                  onChange={(e) => setIconLight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  placeholder="/images/icon-dark.svg"
                />
                <p className="text-2xs text-text-muted mt-1">Icon shown in collapsed sidebar on light background (Default: /images/icon-dark.svg)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Dark Mode Collapsed Icon Path / URL
                </label>
                <input
                  type="text"
                  value={iconDark}
                  onChange={(e) => setIconDark(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                  placeholder="/images/icon-white.svg"
                />
                <p className="text-2xs text-text-muted mt-1">Icon shown in collapsed sidebar on dark background (Default: /images/icon-white.svg)</p>
              </div>
            </div>

            {/* Live Brand Logo & Icon Preview Box */}
            <div className="p-4 bg-app-bg rounded-xl space-y-4">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Live Brand Logo & Icon Preview</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-100 rounded-lg flex flex-col items-center justify-center min-h-[100px] space-y-2">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Light Mode (Full Logo & Collapsed Icon)</span>
                  <div className="flex items-center gap-4">
                    <img src={logoLight || logoDark || '/images/rcs-cyber-track-logo-dark.svg'} alt="Light Logo Preview" className="h-8 w-auto object-contain" />
                    <span className="text-xs text-slate-400">|</span>
                    <img src={iconLight || iconDark || logoLight || logoDark || '/images/icon-dark.svg'} alt="Light Icon Preview" className="h-8 w-auto object-contain" />
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg flex flex-col items-center justify-center min-h-[100px] space-y-2">
                  <span className="text-3xs font-semibold text-slate-400 uppercase">Dark Mode (Full Logo & Collapsed Icon)</span>
                  <div className="flex items-center gap-4">
                    <img src={logoDark || logoLight || '/images/rcs-cyber-track-logo-white.svg'} alt="Dark Logo Preview" className="h-8 w-auto object-contain" />
                    <span className="text-xs text-slate-600">|</span>
                    <img src={iconDark || iconLight || logoDark || logoLight || '/images/icon-white.svg'} alt="Dark Icon Preview" className="h-8 w-auto object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" className="px-5 py-2.5">
                Save Branding Configuration
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetBrand()
                  setBrandName('RCS CyberTrack')
                  setTagline('Security Platform')
                  setLogoLight('/images/rcs-cyber-track-logo-dark.svg')
                  setLogoDark('/images/rcs-cyber-track-logo-white.svg')
                  setIconLight('/images/icon-dark.svg')
                  setIconDark('/images/icon-white.svg')
                  setStatusMsg('Branding reset to default vendor logos and icons')
                }}
                className="px-4 py-2.5 text-xs"
              >
                Reset to Default
              </Button>
            </div>
          </form>
        </SettingsSection>
      )}

      {/* SECTION 6: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-surface rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-5 text-accent" />
              <h3 className="text-base font-semibold text-text-primary">Configuration Version History</h3>
            </div>
            {activeConfig && (
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-3 py-1 rounded-full font-semibold">
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
                    <div className="flex items-center gap-4 text-2xs text-text-muted">
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
                        className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="size-3.5" />
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
