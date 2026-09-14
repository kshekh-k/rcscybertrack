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
    <div className="flex flex-col items-center justify-center my-4">
      <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-full text-slate-500 mb-3 relative">
        <Activity className="size-6 text-slate-500 dark:text-slate-400" />
        <span className="size-2.5 rounded-full bg-amber-400 border border-slate-900 absolute -top-0.5 -right-0.5 animate-pulse" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4 leading-relaxed">{description}</p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md font-mono text-2xs">
        <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
        <span>Waiting for backend API contract:</span>
        <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{endpoint}</span>
      </div>
    </div>
  )
}


