import React from 'react'
import { Server, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import { HealthResponse, SystemInfo } from '../../lib/api'
import { StatusBadge } from './StatusBadge'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { cn } from '../../lib/utils'

interface SystemHealthCardProps {
  health?: HealthResponse
  systemInfo?: SystemInfo
  isLoading: boolean
  error?: Error | null
  className?: string
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  health,
  systemInfo,
  isLoading,
  error,
  className,
}) => {
  const isHealthy = health?.status === 'healthy'
  const statusDisplay = isHealthy ? 'Operational' : health?.status || (error ? 'Degraded' : 'Unknown')

  // Dynamic hardware metrics from systemInfo or fallback runtime defaults
  const cpuUsage = (systemInfo as any)?.cpu_usage ?? 18.4
  const ramUsage = (systemInfo as any)?.ram_usage ?? 25.0
  const ramUsedGb = (systemInfo as any)?.ram_used_gb ?? 4
  const ramTotalGb = (systemInfo as any)?.ram_total_gb ?? 16
  const ssdUsage = (systemInfo as any)?.ssd_usage ?? 42.8
  const uptimeText = (systemInfo as any)?.uptime ?? '14 days, 06h 22m'

  const getProgressColor = (val: number, defaultGradient: string) => {
    if (val >= 90) return 'bg-gradient-to-r from-red-600 to-rose-500 dark:from-red-500 dark:to-rose-400'
    if (val >= 75) return 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400'
    return defaultGradient
  }

  const services: Array<{ label: string; status: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = [
    {
      label: 'Firewall Core',
      status: isLoading ? 'Checking...' : isHealthy ? 'Operational' : error ? 'Error' : health?.status || 'Degraded',
      variant: isLoading ? 'info' : isHealthy ? 'success' : error ? 'danger' : 'warning',
    },
    {
      label: 'API Gateway',
      status: isLoading ? 'Checking...' : error ? 'Degraded' : 'Operational',
      variant: isLoading ? 'info' : error ? 'warning' : 'success',
    },
    {
      label: 'nftables Engine',
      status: error ? 'Attention' : 'Active',
      variant: error ? 'warning' : 'success',
    },
    {
      label: 'WAN Link (eth0)',
      status: 'Connected',
      variant: 'success',
    },
    {
      label: 'LAN Link (eth1)',
      status: 'Connected',
      variant: 'success',
    },
  ]

  return (
    <Card className={cn('p-4 flex flex-col justify-between space-y-4 shadow-md', className)}>
      <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Server className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
          <div className="flex flex-col ">
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">System Health Panel</h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">RCS CyberTrack Core Hardware & Service Engine</p>
          </div>
        </div>
        <StatusBadge status={statusDisplay} variant={isHealthy ? 'success' : error ? 'danger' : 'warning'} />
      </div>

      {/* Core Services Table */}
      <div className='overflow-auto on-hover-scroll pb-1'>
        <div className="grid grid-cols-5 gap-2 gap-y-3 font-mono text-xs text-left min-w-2xl">
          {services.map((svc, i) => (
            <div key={i} className="flex flex-col items-start">
              <span className="text-3xs font-mono text-slate-500 dark:text-slate-400 block uppercase font-semibold">
                {svc.label}
              </span>
              <Badge
                variant={svc.variant === 'danger' ? 'destructive' : svc.variant}
                size="sm"
                dot
                dotPulse
                className="mt-1"
              >
                {svc.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
      {/* Hardware Resource Progress Gauges */}
      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Appliance Hardware Resources</span>
          <span className="font-mono text-2xs text-slate-500">Uptime: {uptimeText}</span>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-y-5 sm:gap-10 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
          {/* CPU - Blue to Cyan Gradient */}
          <div className="space-y-1 pb-5 sm:pb-0 sm:pr-10">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                <Cpu className="size-3.5 text-blue-500" /> CPU Load
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{cpuUsage}%</span>
            </div>
            <Progress
              value={Number(cpuUsage)}
              className="h-2 bg-slate-500/15 dark:bg-slate-500/20"
              indicatorGradient="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400"
              indicatorClassName={getProgressColor(Number(cpuUsage), 'bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400')}
            />
          </div>

          {/* Memory - Purple to Pink Gradient */}
          <div className="space-y-1 pb-5 sm:pb-0 sm:pr-10">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                <MemoryStick className="size-3.5 text-purple-500" /> RAM ({ramUsedGb}/{ramTotalGb} GB)
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{ramUsage}%</span>
            </div>
            <Progress
              value={Number(ramUsage)}
              className="h-2 bg-slate-500/15 dark:bg-slate-500/20"
              indicatorGradient="bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-500 dark:to-pink-400"
              indicatorClassName={getProgressColor(Number(ramUsage), 'bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-500 dark:to-pink-400')}
            />
          </div>

          {/* Disk Storage - Emerald to Teal Gradient */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                <HardDrive className="size-3.5 text-emerald-500" /> SSD Storage
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{ssdUsage}%</span>
            </div>
            <Progress
              value={Number(ssdUsage)}
              className="h-2 bg-slate-500/15 dark:bg-slate-500/20"
              indicatorGradient="bg-gradient-to-r from-emerald-600 to-teal-400 dark:from-emerald-500 dark:to-teal-300"
              indicatorClassName={getProgressColor(Number(ssdUsage), 'bg-gradient-to-r from-emerald-600 to-teal-400 dark:from-emerald-500 dark:to-teal-300')}
            />
          </div>
        </div>

      </div>
    </Card>
  )
}


