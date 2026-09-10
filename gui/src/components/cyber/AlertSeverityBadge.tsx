import React from 'react'
import { AlertSeverity } from '../../types/apiContracts'

interface AlertSeverityBadgeProps {
  severity: AlertSeverity
  className?: string
}

export const AlertSeverityBadge: React.FC<AlertSeverityBadgeProps> = ({ severity, className = '' }) => {
  const styles: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
    critical: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400 font-bold',
      border: 'border-rose-500/30',
    },
    high: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400 font-semibold',
      border: 'border-amber-500/30',
    },
    medium: {
      bg: 'bg-yellow-500/15',
      text: 'text-yellow-300 font-medium',
      border: 'border-yellow-500/30',
    },
    low: {
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-400 font-medium',
      border: 'border-cyan-500/30',
    },
    info: {
      bg: 'bg-slate-500/15',
      text: 'text-slate-400 font-medium',
      border: 'border-slate-500/30',
    },
  }

  const current = styles[severity] || styles.info

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-3xs uppercase tracking-wider font-mono rounded border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {severity}
    </span>
  )
}
