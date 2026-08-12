import React from 'react'

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  showDot?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  showDot = true,
  className = '',
}) => {
  const styles: Record<StatusVariant, { bg: string; text: string; border: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400 animate-pulse',
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400 animate-pulse',
    },
    danger: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-400 animate-pulse',
    },
    info: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      dot: 'bg-cyan-400 animate-pulse',
    },
    neutral: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/20',
      dot: 'bg-slate-400',
    },
  }

  const current = styles[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />}
      <span className="capitalize">{status}</span>
    </span>
  )
}
