import React from 'react'
import { StatusBadge, StatusVariant } from './StatusBadge'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

export interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  statusText?: string
  statusVariant?: StatusVariant
  subtitle?: string
  trend?: string
  className?: string
  onClick?: () => void
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  statusText,
  statusVariant = 'neutral',
  subtitle,
  trend,
  className,
  onClick,
}) => {
  const isLongValue = typeof value === 'string' && value.length > 8

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-3 transition-all duration-200 flex flex-col justify-between space-y-2.5 text-white',
        onClick && 'cursor-pointer hover:opacity-95 hover:-translate-y-1 active:-translate-y-1 select-none',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-widest truncate">{title}</span>
        <div className="text-white shrink-0">
          {icon}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-1.5 ">
        <span
          className={cn(
            'font-bold text-white tracking-tight font-mono truncate',
            isLongValue ? 'text-base' : 'text-xl'
          )}
        >
          {value}
        </span>
        {statusText && (
          <StatusBadge
            status={statusText}
            variant={statusVariant}
            strokeWidth={2.5}
            className="bg-white/20 text-white border-white/30 dark:bg-white/20 dark:text-white dark:border-white/30"
          />
        )}
      </div>

      {(subtitle || trend) && (
        <div className="text-3xs text-white flex items-center justify-between border-t border-white/20 pt-2 font-mono">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && <span className="text-white font-bold shrink-0">{trend}</span>}
        </div>
      )}
    </Card>
  )
}
