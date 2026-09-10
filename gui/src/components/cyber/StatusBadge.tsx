import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/utils'

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  showIcon?: boolean
  showDot?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  showIcon = true,
  showDot = true,
  className = '',
}) => {
  const config = {
    success: {
      bg: 'bg-emerald-100 dark:bg-emerald-500/10',
      text: 'text-emerald-800 dark:text-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-500/25',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-500/10',
      text: 'text-amber-800 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-500/25',
      icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-500/10',
      text: 'text-red-800 dark:text-red-400',
      border: 'border-red-300 dark:border-red-500/25',
      icon: XCircle,
    },
    info: {
      bg: 'bg-cyan-100 dark:bg-cyan-500/10',
      text: 'text-cyan-800 dark:text-cyan-400',
      border: 'border-cyan-300 dark:border-cyan-500/25',
      icon: Info,
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
      icon: ShieldAlert,
    },
  }

  const current = config[variant] || config.neutral
  const IconComponent = current.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md border select-none',
        current.bg,
        current.text,
        current.border,
        className
      )}
    >
      {showIcon && showDot && <IconComponent className="size-3.5 shrink-0" />}
      <span className="capitalize">{status}</span>
    </span>
  )
}
