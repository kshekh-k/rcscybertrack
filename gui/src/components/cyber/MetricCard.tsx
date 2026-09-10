import React from 'react'
import { StatusBadge, StatusVariant } from './StatusBadge'
import { cn } from '../../lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  statusText?: string
  statusVariant?: StatusVariant
  subtitle?: string
  trend?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  statusText,
  statusVariant = 'neutral',
  subtitle,
  trend,
}) => {
  const isLongValue = typeof value === 'string' && value.length > 8

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-xs transition-all duration-200 flex flex-col justify-between space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{title}</span>
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 shrink-0">
          {icon}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-1.5 min-h-[36px]">
        <span
          className={cn(
            'font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono truncate',
            isLongValue ? 'text-base' : 'text-xl'
          )}
        >
          {value}
        </span>
        {statusText && <StatusBadge status={statusText} variant={statusVariant} className="text-3xs px-2 py-0.2" />}
      </div>

      {(subtitle || trend) && (
        <div className="text-3xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 font-mono">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && <span className="text-cyan-600 dark:text-cyan-400 font-semibold shrink-0">{trend}</span>}
        </div>
      )}
    </div>
  )
}
