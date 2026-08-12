import React from 'react'
import { Activity, ShieldAlert } from 'lucide-react'

interface TelemetryUnavailableProps {
  title?: string
  description?: string
  endpoint?: string
}

export const TelemetryUnavailable: React.FC<TelemetryUnavailableProps> = ({
  title = 'Telemetry Stream Offline',
  description = 'Live packet metrics and connection telemetry feeds require active kernel eBPF / Netflow backend streaming service.',
  endpoint = 'GET /api/v1/analytics/traffic',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-app-bg/50 border border-dashed border-border-subtle rounded-xl my-4">
      <div className="p-3 bg-surface rounded-full border border-border-subtle text-slate-500 mb-3 relative">
        <Activity className="w-6 h-6 text-slate-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 absolute -top-0.5 -right-0.5 animate-pulse" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-md mb-4 leading-relaxed">{description}</p>
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-md font-mono text-[11px]">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
        <span>Waiting for backend API contract:</span>
        <span className="text-cyan-300 font-semibold">{endpoint}</span>
      </div>
    </div>
  )
}
