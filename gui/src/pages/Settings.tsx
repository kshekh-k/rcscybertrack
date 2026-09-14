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
  Palette,
} from 'lucide-react'
import { useSystemInfo } from '../features/dashboard/useSystemHealth'
import { SettingsSection } from '../components/cyber/SettingsSection'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Alert } from '../components/ui/alert'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
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

  const tabItems = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'system', label: 'System & Engine', icon: Server },
    { id: 'logging', label: 'Logging & Syslog', icon: Terminal },
    { id: 'security', label: 'Security Policies', icon: Shield },
    { id: 'admin', label: 'Administration', icon: KeyRound },
    { id: 'branding', label: 'Branding & Logo', icon: Palette },
    { id: 'history', label: `Version History (${history.length})`, icon: History },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={Server}
        title="System Settings & Configuration Lifecycle"
        description="Safe persistent configuration engine with Candidate Staging, Dry-Run Validation, OS Commit, and Rollback"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => stageMutation.mutate()}
              isLoading={stageMutation.isPending}
              className="gap-2"
            >
              {!stageMutation.isPending && <GitCommit className="size-3.5 text-blue-500" />}
              <span>Stage Candidate</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => commitMutation.mutate()}
              isLoading={commitMutation.isPending}
              className="gap-2"
            >
              {!commitMutation.isPending && <CheckCircle2 className="size-3.5 text-emerald-500" />}
              <span>Commit</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => applyMutation.mutate()}
              isLoading={applyMutation.isPending}
              className="gap-2"
            >
              {!applyMutation.isPending && <Play className="size-3.5" />}
              <span>Apply to OS</span>
            </Button>
          </>
        }
      />

      {/* Status Notifications */}
      {statusMsg && (
        <Alert
          variant="success"
          title="Configuration Engine Status"
          message={statusMsg}
          onClose={() => setStatusMsg(null)}
        />
      )}

      {errorMsg && (
        <Alert
          variant="error"
          title="Configuration Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 pb-3 overflow-x-auto on-hover-scroll max-w-full md:w-fit">
        {tabItems.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'primary' : 'ghost'}
              size="lg"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="whitespace-nowrap gap-2 shadow-md bg-(--topbar-bg) hover:bg-blue-500 hover:text-white"
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* SECTION 1: GENERAL */}
      {activeTab === 'general' && (
        <SettingsSection
          title="General Appliance Information"
          subtitle="Hostname, timezone, and global domain identity"
          icon={<Globe className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Appliance Hostname"
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="font-mono"
            />

            <Select
              label="System Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="font-mono h-10"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </Select>
          </div>
        </SettingsSection>
      )}

      {/* SECTION 2: SYSTEM & ENGINE */}
      {activeTab === 'system' && (
        <SettingsSection
          title="Backend Subsystems & Processing Engine"
          subtitle="Kernel drivers, status, and management API configuration"
          icon={<Server className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Firewall Engine Backend</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kernel packet filtering driver</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 rounded font-semibold uppercase">
                {systemInfo?.firewall_backend || 'nftables'}
              </span>
            </div>

            <div className="p-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Management REST API Status</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">FastAPI Core Gateway</p>
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
          icon={<Terminal className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="System Log Level"
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="font-mono h-10"
            >
              <option value="DEBUG">DEBUG (Detailed Diagnostics)</option>
              <option value="INFO">INFO (Standard Production)</option>
              <option value="WARNING">WARNING (Warnings & Errors Only)</option>
              <option value="ERROR">ERROR (Errors Only)</option>
            </Select>

            <Input
              label="Cryptographic Audit Log Retention (Days)"
              type="number"
              min={1}
              max={3650}
              value={auditRetention}
              onChange={(e) => setAuditRetention(Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </SettingsSection>
      )}

      {/* SECTION 4: SECURITY */}
      {activeTab === 'security' && (
        <SettingsSection
          title="Appliance Security Policies"
          subtitle="Authentication parameters, JWT session duration, and lockout policy"
          icon={<Shield className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="JWT Session Timeout (Minutes)"
              type="number"
              min={5}
              max={1440}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="font-mono"
            />

            <div className="p-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Brute-Force Account Lockout</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">5 failed attempts → 15 min lock</p>
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
          icon={<KeyRound className="size-7 shrink-0 text-amber-600" strokeWidth={1.5} />}
        >
          <div className="p-4 rounded- bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Configuration Backup & Restore</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Export JSON snapshots of all active appliance rules and RBAC tables</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
            >
              Export Backup
            </Button>
          </div>
        </SettingsSection>
      )}

      {/* SECTION: BRANDING */}
      {activeTab === 'branding' && (
        <SettingsSection
          title="White-Label & Brand Customization"
          subtitle="Set default product logos, brand name, and platform tagline for light and dark modes"
          icon={<Palette className="size-7 shrink-0 text-indigo-600" strokeWidth={1.5} />}
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
              <Input
                label="Brand / Product Name"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="RCS CyberTrack"
              />

              <Input
                label="Platform Tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Security Platform"
              />
            </div>

            {/* Logos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Light Mode Logo Path / URL"
                  type="text"
                  value={logoLight}
                  onChange={(e) => setLogoLight(e.target.value)}
                  className="font-mono"
                  placeholder="/images/rcs-cyber-track-logo-dark.svg"
                />
                <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">Logo shown on light background (Default: /images/rcs-cyber-track-logo-dark.svg)</p>
              </div>

              <div>
                <Input
                  label="Dark Mode Logo Path / URL"
                  type="text"
                  value={logoDark}
                  onChange={(e) => setLogoDark(e.target.value)}
                  className="font-mono"
                  placeholder="/images/rcs-cyber-track-logo-white.svg"
                />
                <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">Logo shown on dark background (Default: /images/rcs-cyber-track-logo-white.svg)</p>
              </div>
            </div>

            {/* Collapsed Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Light Mode Collapsed Icon Path / URL"
                  type="text"
                  value={iconLight}
                  onChange={(e) => setIconLight(e.target.value)}
                  className="font-mono"
                  placeholder="/images/icon-dark.svg"
                />
                <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">Icon shown in collapsed sidebar on light background (Default: /images/icon-dark.svg)</p>
              </div>

              <div>
                <Input
                  label="Dark Mode Collapsed Icon Path / URL"
                  type="text"
                  value={iconDark}
                  onChange={(e) => setIconDark(e.target.value)}
                  className="font-mono"
                  placeholder="/images/icon-white.svg"
                />
                <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">Icon shown in collapsed sidebar on dark background (Default: /images/icon-white.svg)</p>
              </div>
            </div>

            {/* Live Brand Logo & Icon Preview Box */}
            <div className="p-4 rounded bg-slate-100 dark:bg-slate-800 space-y-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Live Brand Logo & Icon Preview</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-200/80 dark:bg-slate-100 rounded flex flex-col items-center justify-center min-h-25 space-y-2">
                  <span className="text-3xs font-semibold text-slate-600 uppercase">Light Mode (Full Logo & Collapsed Icon)</span>
                  <div className="flex items-center gap-4">
                    <img src={logoLight || logoDark || '/images/rcs-cyber-track-logo-dark.svg'} alt="Light Logo Preview" className="h-8 w-auto object-contain" />
                    <span className="text-xs text-slate-400">|</span>
                    <img src={iconLight || iconDark || logoLight || logoDark || '/images/icon-dark.svg'} alt="Light Icon Preview" className="h-8 w-auto object-contain" />
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded flex flex-col items-center justify-center min-h-25 space-y-2 border border-slate-800">
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
              <Button type="submit" variant="primary">
                Save Branding Configuration
              </Button>
              <Button
                type="button"
                variant="outline" className='bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100'
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
              >
                Reset to Default
              </Button>
            </div>
          </form>
        </SettingsSection>
      )}

      {/* SECTION 6: HISTORY */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 -mt-3">
            <div className="flex items-center gap-2">
              <History className="size-7 shrink-0 text-indigo-600" strokeWidth={1.5} />
              <CardTitle className="text-base font-semibold">Configuration Version History</CardTitle>
            </div>
            {activeConfig && (
              <Badge variant="cyan" dot className="font-mono font-semibold">
                Active Version: v{activeConfig.version_number}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {isHistoryLoading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading configuration version log...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">No configuration versions recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.map((ver: any) => (
                  <div key={ver.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">v{ver.version_number}</span>
                        <StatusBadge
                          status={ver.status.toUpperCase()}
                          variant={ver.status === 'active' ? 'success' : ver.status === 'committed' ? 'info' : 'neutral'}
                        />
                        <span className="text-xs font-mono text-slate-400">ID: {ver.id}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{ver.commit_message || 'No commit message specified'}</p>
                      <div className="flex items-center gap-4 text-2xs text-slate-400 dark:text-slate-500">
                        <span>Author: {ver.created_by}</span>
                        <span>Created: {new Date(ver.created_at).toLocaleString()}</span>
                        {ver.applied_at && <span>Applied: {new Date(ver.applied_at).toLocaleString()}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ver.status !== 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollbackMutation.mutate(ver.id)}
                          isLoading={rollbackMutation.isPending}
                          className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Rollback</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
