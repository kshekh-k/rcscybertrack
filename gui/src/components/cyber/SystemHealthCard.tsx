import React from 'react'
import { Server, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import { HealthResponse, SystemInfo } from '../../lib/api'
import { StatusBadge } from './StatusBadge'

interface SystemHealthCardProps {
  health?: HealthResponse
  systemInfo?: SystemInfo
  isLoading: boolean
  error?: Error | null
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  health,
  systemInfo: _systemInfo,
  isLoading: _isLoading,
  error: _error,
}) => {
  const isHealthy = health?.status === 'healthy'
  const statusDisplay = isHealthy ? 'Operational' : health?.status || 'Unknown'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ">
            <Server className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">System Health Panel</h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">RCS CyberTrack Core Hardware & Service Engine</p>
          </div>
        </div>
        <StatusBadge status={statusDisplay} variant={isHealthy ? 'success' : 'danger'} />
      </div>

      {/* Core Services Table */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs text-center">
        {[
          { label: 'Firewall Core', status: 'Operational', ok: true },
          { label: 'API Gateway', status: 'Operational', ok: true },
          { label: 'nftables Engine', status: 'Active', ok: true },
          { label: 'WAN Link (eth0)', status: 'Connected', ok: true },
          { label: 'LAN Link (eth1)', status: 'Connected', ok: true },
        ].map((svc, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 ">
            <span className="text-3xs text-slate-400 block uppercase font-sans font-semibold">{svc.label}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {svc.status}
            </span>
          </div>
        ))}
      </div>

      {/* Hardware Resource Progress Gauges */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Appliance Hardware Resources</span>
          <span className="font-mono text-2xs text-slate-500">Uptime: 14 days, 06h 22m</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CPU */}
          <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 ">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Cpu className="size-3.5 text-blue-500" /> CPU Load
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">18.4%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '18.4%' }} />
            </div>
          </div>

          {/* Memory */}
          <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 ">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <MemoryStick className="size-3.5 text-cyan-500" /> RAM (4/16 GB)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">25.0%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>

          {/* Disk Storage */}
          <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 ">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <HardDrive className="size-3.5 text-emerald-500" /> SSD Storage
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">42.8%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42.8%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
