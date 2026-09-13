import React from 'react'
import { cn } from '../../lib/utils'

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'cyan'
  | 'neutral'

export type BadgeSize = 'sm' | 'default' | 'lg'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  dotPulse?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'default',
  dot = false,
  dotPulse = false,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    default: {
      bg: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    secondary: {
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      dot: 'bg-slate-400',
    },
    outline: {
      bg: 'bg-transparent text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-400',
    },
    destructive: {
      bg: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
      dot: 'bg-rose-500',
    },
    danger: {
      bg: 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      dot: 'bg-red-500',
    },
    success: {
      bg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    info: {
      bg: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
      dot: 'bg-sky-500',
    },
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
      dot: 'bg-cyan-500',
    },
    neutral: {
      bg: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
      dot: 'bg-slate-400',
    },
  }

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-3xs rounded',
    default: 'px-2 py-1 text-2xs rounded',
    lg: 'px-2.5 py-1.5 text-xs rounded',
  }

  const currentVariant = variantStyles[variant] || variantStyles.default

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 font-mono font-semibold transition-colors select-none leading-none shrink-0',
        currentVariant.bg,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'size-1.5 rounded-full shrink-0',
            currentVariant.dot,
            dotPulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </div>
  )
}
