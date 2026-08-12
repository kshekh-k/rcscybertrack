import React from 'react'
import { Server, Activity, ShieldCheck, Clock, Terminal, Cpu } from 'lucide-react'
import { HealthResponse, SystemInfo } from '../../lib/api'
import { StatusBadge } from './StatusBadge'
import { CardSkeleton } from './LoadingState'

interface SystemHealthCardProps {
  health?: HealthResponse
  systemInfo?: SystemInfo
  isLoading: boolean
  error?: Error | null
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  health,
  systemInfo,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return <CardSkeleton />
  }

  const isHealthy = health?.status === 'healthy'
  const statusDisplay = isHealthy ? 'Operational' : (health?.status || 'Unknown')

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">
      {/* Decorative ambient gradient */}
      <div className="absolute -right-12 -top-12 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">CyberTrack Core</h2>
              <p className="text-xs text-text-muted">Appliance OS & Core Engine Status</p>
            </div>
          </div>
          <StatusBadge
            status={statusDisplay}
            variant={isHealthy ? 'success' : 'danger'}
          />
        </div>

        {error ? (
          <div className="text-xs text-rose-400 bg-rose-950/20 p-3 rounded-lg border border-rose-500/20">
            Failed to connect to core system metrics: {error.message}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>Hostname</span>
              </div>
              <p className="text-sm font-mono font-medium text-text-primary truncate">
                {systemInfo?.hostname || 'rcs-cybertrack'}
              </p>
            </div>

            <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Timezone</span>
              </div>
              <p className="text-sm font-mono font-medium text-text-primary truncate">
                {systemInfo?.timezone || 'UTC'}
              </p>
            </div>

            <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Log Level</span>
              </div>
              <p className="text-sm font-mono font-medium text-text-primary uppercase">
                {systemInfo?.log_level || 'INFO'}
              </p>
            </div>

            <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firewall Backend</span>
              </div>
              <p className="text-sm font-mono font-medium text-text-primary uppercase">
                {systemInfo?.firewall_backend || 'nftables'}
              </p>
            </div>

            <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Status</span>
              </div>
              <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{systemInfo?.api_enabled !== false ? 'Enabled' : 'Disabled'}</span>
              </p>
            </div>

            <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>Core Service</span>
              </div>
              <p className="text-sm font-mono font-medium text-text-primary truncate">
                {health?.service || 'rcs-cybertrack-core'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
