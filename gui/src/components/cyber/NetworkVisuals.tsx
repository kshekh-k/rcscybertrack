import React from 'react'
import { Network, Activity, ArrowDownUp } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
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
  duplex?: string
  mtu?: number | string
  className?: string
}

export const NetworkInterfaceCard: React.FC<InterfaceCardProps> = ({
  name,
  role,
  ipAddress,
  gateway,
  subnet,
  status,
  speed,
  duplex = 'Full',
  mtu = 1500,
  className,
}) => {
  const isUp = status === 'UP'

  return (
    <Card className={cn('p-4 space-y-2 shadow-md', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />

          <div className="flex items-start flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{name}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded text-4xs font-bold uppercase tracking-wider ',
                  role === 'WAN'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 '
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 '
                )}
              >
                {role}
              </span>
            </div>
            <span className="text-3xs text-slate-500 dark:text-slate-400 -translate-y-2 font-mono">Speed: {speed}</span>
          </div>
        </div>

        <Badge variant={isUp ? 'success' : 'danger'} size="sm" dot dotPulse={isUp}>
          {status}
        </Badge>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 font-mono text-xs">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span className="text-3xs text-slate-500 dark:text-slate-400 uppercase">IP Address</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 ">
            {ipAddress}
          </span>
        </div>

        {gateway && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="text-3xs text-slate-500 dark:text-slate-400 uppercase">Gateway</span>
            <span className="text-slate-700 dark:text-slate-300">{gateway}</span>
          </div>
        )}

        {subnet && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="text-3xs text-slate-500 dark:text-slate-400 uppercase">Network Subnet</span>
            <span className="text-slate-700 dark:text-slate-300">{subnet}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-3xs text-slate-500 font-mono pt-1">
        <span className="flex items-center gap-1">
          <ArrowDownUp className="size-3 text-sky-500" /> Duplex: {duplex}
        </span>
        <span className="flex items-center gap-1">
          <Activity className="size-3 text-emerald-500" /> MTU: {mtu}
        </span>
      </div>
    </Card>
  )
}
