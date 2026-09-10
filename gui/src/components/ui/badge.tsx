import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'cyan'
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    secondary:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    outline:
      'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    success:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    danger:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    info:
      'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    cyan:
      'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-2xs font-semibold border transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
