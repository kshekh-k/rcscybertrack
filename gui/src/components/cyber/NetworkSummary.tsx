import React from 'react'
import { Link } from 'react-router-dom'
import { Network as NetIcon, ArrowRight } from 'lucide-react'
import { InterfaceConfig } from '../../lib/api'
import { StatusBadge } from './StatusBadge'

interface NetworkSummaryProps {
  interfaces?: InterfaceConfig[]
  isLoading: boolean
}

export const NetworkSummary: React.FC<NetworkSummaryProps> = ({ interfaces = [], isLoading }) => {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <NetIcon className="size-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Network Interfaces</h3>
          </div>
          <Link
            to="/network"
            className="text-xs font-medium text-accent hover:text-cyan-300 transition-colors flex items-center gap-1 group"
          >
            <span>View Network</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-app-bg animate-pulse rounded-lg " />
            ))}
          </div>
        ) : interfaces.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No network interfaces configured.</p>
        ) : (
          <div className="space-y-2">
            {interfaces.map((iface) => {
              const ipStr = iface.ipv4?.address
                ? `${iface.ipv4.address}${iface.ipv4.prefix !== null && iface.ipv4.prefix !== undefined ? `/${iface.ipv4.prefix}` : ''}`
                : 'No IP'

              return (
                <div
                  key={iface.name}
                  className="bg-app-bg/50 /80 rounded-lg p-2.5 flex items-center justify-between text-xs transition-colors hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-semibold text-text-primary">{iface.name}</span>
                    {iface.ipv4?.dhcp && (
                      <span className="text-3xs bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-sans">
                        DHCP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-secondary">{ipStr}</span>
                    <StatusBadge
                      status={iface.enabled ? 'UP' : 'DOWN'}
                      variant={iface.enabled ? 'success' : 'neutral'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-text-muted flex justify-between items-center">
        <span>Active Links</span>
        <span className="font-mono font-semibold text-text-primary">
          {interfaces.filter((i) => i.enabled).length} / {interfaces.length}
        </span>
      </div>
    </div>
  )
}
