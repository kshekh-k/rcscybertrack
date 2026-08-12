import React from 'react'
import { Link } from 'react-router-dom'
import { MonitorSmartphone, ArrowRight } from 'lucide-react'
import { Device } from '../../lib/api'
import { StatusBadge } from './StatusBadge'

interface DeviceSummaryProps {
  devices?: Device[]
  isLoading: boolean
}

export const DeviceSummary: React.FC<DeviceSummaryProps> = ({ devices = [], isLoading }) => {
  const onlineCount = devices.filter((d) => d.status === 'online').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length
  const degradedCount = devices.filter((d) => d.status === 'degraded').length
  const displayDevices = devices.slice(0, 4)

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <MonitorSmartphone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Connected Devices Overview</h3>
          </div>
          <Link
            to="/devices"
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Quick breakdown metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div className="bg-app-bg/60 border border-border-subtle/80 rounded-lg p-2">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total</p>
            <p className="text-base font-semibold font-mono text-text-primary mt-0.5">{devices.length}</p>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2">
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Online</p>
            <p className="text-base font-semibold font-mono text-emerald-400 mt-0.5">{onlineCount}</p>
          </div>
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-2">
            <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">Offline</p>
            <p className="text-base font-semibold font-mono text-rose-400 mt-0.5">{offlineCount}</p>
          </div>
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-2">
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Degraded</p>
            <p className="text-base font-semibold font-mono text-amber-400 mt-0.5">{degradedCount}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 bg-app-bg animate-pulse rounded-lg border border-border-subtle" />
            ))}
          </div>
        ) : displayDevices.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No connected devices detected.</p>
        ) : (
          <div className="space-y-2">
            {displayDevices.map((device) => {
              const statusVariant =
                device.status === 'online'
                  ? 'success'
                  : device.status === 'degraded'
                  ? 'warning'
                  : 'danger'

              return (
                <div
                  key={device.id}
                  className="bg-app-bg/50 border border-border-subtle/80 rounded-lg p-2.5 flex items-center justify-between text-xs transition-colors hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary truncate max-w-[120px]">{device.hostname}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded capitalize font-mono">
                      {device.device_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-secondary">{device.ip_address}</span>
                    <StatusBadge status={device.status} variant={statusVariant} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
