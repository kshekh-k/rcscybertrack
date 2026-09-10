import React from 'react'
import { Network, Activity, ArrowDownUp } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface InterfaceCardProps {
  name: string
  role: 'WAN' | 'LAN'
  ipAddress: string
  gateway?: string
  subnet?: string
  status: 'UP' | 'DOWN' | 'DEGRADED'
  speed: string
  rxBytes?: string
  txBytes?: string
}

export const NetworkInterfaceCard: React.FC<InterfaceCardProps> = ({
  name,
  role,
  ipAddress,
  gateway,
  subnet,
  status,
  speed,
}) => {
  const isUp = status === 'UP'

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 ">
            <Network className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{name}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded text-4xs font-bold uppercase tracking-wider border',
                  role === 'WAN'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                )}
              >
                {role}
              </span>
            </div>
            <span className="text-3xs text-slate-500 dark:text-slate-400 font-mono">Speed: {speed}</span>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
            isUp
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
          )}
        >
          <span className={cn('size-1.5 rounded-full', isUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
          {status}
        </span>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 font-mono text-xs">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span className="text-3xs text-slate-400 uppercase">IP Address</span>
          <span className="font-medium text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded ">
            {ipAddress}
          </span>
        </div>

        {gateway && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="text-3xs text-slate-400 uppercase">Gateway</span>
            <span className="text-slate-700 dark:text-slate-300">{gateway}</span>
          </div>
        )}

        {subnet && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="text-3xs text-slate-400 uppercase">Network Subnet</span>
            <span className="text-slate-700 dark:text-slate-300">{subnet}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-3xs text-slate-500 font-mono pt-1">
        <span className="flex items-center gap-1">
          <ArrowDownUp className="size-3 text-sky-500" /> Duplex: Full
        </span>
        <span className="flex items-center gap-1">
          <Activity className="size-3 text-emerald-500" /> MTU: 1500
        </span>
      </div>
    </div>
  )
}
