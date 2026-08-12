import { useState } from 'react'
import {
  Activity,
  ShieldCheck,
  Network as NetIcon,
  MonitorSmartphone,
  ScrollText,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useSystemHealth, useSystemInfo } from '../features/dashboard/useSystemHealth'
import { useFirewallRules } from '../features/firewall/useFirewallRules'
import { useNetworkInterfaces } from '../features/network/useNetworkData'
import { useDevices } from '../features/devices/useDevices'
import { useAuditLogs } from '../features/audit/useAuditLogs'

import { MetricCard } from '../components/cyber/MetricCard'
import { SystemHealthCard } from '../components/cyber/SystemHealthCard'
import { FirewallSummary } from '../components/cyber/FirewallSummary'
import { NetworkSummary } from '../components/cyber/NetworkSummary'
import { DeviceSummary } from '../components/cyber/DeviceSummary'
import { AuditTimeline } from '../components/cyber/AuditTimeline'
import { ErrorState } from '../components/cyber/ErrorState'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [lastRefetched, setLastRefetched] = useState<Date>(new Date())
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  // Server state hooks
  const { data: health, isLoading: isHealthLoading, error: healthError } = useSystemHealth()
  const { data: systemInfo, isLoading: isSystemLoading, error: systemError } = useSystemInfo()
  const { data: rules, isLoading: isRulesLoading, error: rulesError } = useFirewallRules()
  const { data: interfaces, isLoading: isInterfacesLoading, error: interfacesError } = useNetworkInterfaces()
  const { data: devices, isLoading: isDevicesLoading, error: devicesError } = useDevices()
  const { data: auditData, isLoading: isAuditLoading, error: auditError } = useAuditLogs()

  const handleRefresh = async () => {
    setIsManualRefreshing(true)
    await queryClient.invalidateQueries()
    setLastRefetched(new Date())
    setTimeout(() => setIsManualRefreshing(false), 500)
  }

  const isHealthy = health?.status === 'healthy'
  const activeRulesCount = rules?.length ?? 0
  const activeInterfacesCount = interfaces?.filter((i) => i.enabled).length ?? 0
  const totalInterfacesCount = interfaces?.length ?? 0
  const onlineDevicesCount = devices?.filter((d) => d.status === 'online').length ?? 0
  const totalDevicesCount = devices?.length ?? 0
  const auditLogsCount = auditData?.log_count ?? (auditData?.events?.length ?? 0)

  const hasAnyError =
    healthError || systemError || rulesError || interfacesError || devicesError || auditError

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Overview</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Real-time status of your RCS CyberTrack appliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block font-mono">
            <p className="text-[11px] text-text-muted">Last updated</p>
            <p className="text-xs text-slate-300">{lastRefetched.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isManualRefreshing}
            className="px-3 py-2 bg-surface hover:bg-slate-800 border border-border-subtle text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isManualRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Callout if API failures occur */}
      {hasAnyError && (
        <ErrorState
          title="Backend Connectivity Notice"
          message="One or more dashboard feeds could not reach RCS CyberTrack Core (http://127.0.0.1:8000). Displaying cached/available metrics."
          onRetry={handleRefresh}
        />
      )}

      {/* KPI Row (5 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: System Health */}
        <MetricCard
          title="System Health"
          value={isHealthLoading ? '...' : isHealthy ? 'Operational' : health?.status || 'Offline'}
          icon={<Activity className={`w-4 h-4 ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`} />}
          statusText={isHealthy ? 'Healthy' : 'Warning'}
          statusVariant={isHealthy ? 'success' : 'danger'}
          subtitle="Core engine status"
          trend={isHealthy ? '● Stable' : undefined}
        />

        {/* Metric 2: Firewall Policies */}
        <MetricCard
          title="Firewall Policies"
          value={isRulesLoading ? '...' : activeRulesCount}
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          statusText={`${activeRulesCount} Active`}
          statusVariant="info"
          subtitle="nftables backend active"
        />

        {/* Metric 3: Network Interfaces */}
        <MetricCard
          title="Network Interfaces"
          value={isInterfacesLoading ? '...' : `${activeInterfacesCount}/${totalInterfacesCount}`}
          icon={<NetIcon className="w-4 h-4 text-accent" />}
          statusText={`${activeInterfacesCount} UP`}
          statusVariant={activeInterfacesCount > 0 ? 'success' : 'warning'}
          subtitle="Configured interfaces"
        />

        {/* Metric 4: Online Devices */}
        <MetricCard
          title="Online Devices"
          value={isDevicesLoading ? '...' : `${onlineDevicesCount}/${totalDevicesCount}`}
          icon={<MonitorSmartphone className="w-4 h-4 text-indigo-400" />}
          statusText={`${onlineDevicesCount} Active`}
          statusVariant={onlineDevicesCount > 0 ? 'success' : 'neutral'}
          subtitle="Discovered hosts"
        />

        {/* Metric 5: Audit Events */}
        <MetricCard
          title="Audit Events"
          value={isAuditLoading ? '...' : auditLogsCount}
          icon={<ScrollText className="w-4 h-4 text-amber-400" />}
          statusText={auditData?.integrity_verified ? 'Verified' : 'Alert'}
          statusVariant={auditData?.integrity_verified ? 'success' : 'warning'}
          subtitle="Tamper-proof log chain"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Panel (Large Span 2) */}
        <div className="lg:col-span-2">
          <SystemHealthCard
            health={health}
            systemInfo={systemInfo}
            isLoading={isHealthLoading || isSystemLoading}
            error={healthError || systemError}
          />
        </div>

        {/* Firewall Policy Summary */}
        <div className="lg:col-span-1">
          <FirewallSummary rules={rules} isLoading={isRulesLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Summary */}
        <div className="lg:col-span-1">
          <NetworkSummary interfaces={interfaces} isLoading={isInterfacesLoading} />
        </div>

        {/* Device Summary */}
        <div className="lg:col-span-1">
          <DeviceSummary devices={devices} isLoading={isDevicesLoading} />
        </div>

        {/* Audit Timeline */}
        <div className="lg:col-span-1">
          <AuditTimeline auditData={auditData} isLoading={isAuditLoading} />
        </div>
      </div>

      {/* Footer System Badge */}
      <div className="bg-surface/60 border border-border-subtle rounded-xl p-4 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>RCS CyberTrack Real-Time Security Operational Console</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Backend: http://127.0.0.1:8000
        </div>
      </div>
    </div>
  )
}
