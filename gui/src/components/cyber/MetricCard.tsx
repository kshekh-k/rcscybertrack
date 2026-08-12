import React from 'react'
import { StatusBadge, StatusVariant } from './StatusBadge'

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
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-lg transition-all duration-200 hover:border-slate-700/80">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">{icon}</div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold text-text-primary tracking-tight font-mono">{value}</span>
        {statusText && <StatusBadge status={statusText} variant={statusVariant} />}
      </div>
      {(subtitle || trend) && (
        <div className="text-xs text-text-muted mt-2.5 flex items-center justify-between border-t border-slate-800/60 pt-2">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-mono text-xs text-cyan-400 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  )
}
