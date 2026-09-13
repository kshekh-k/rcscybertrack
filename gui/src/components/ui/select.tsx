import React from 'react'
import { cn } from '../../lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode
  error?: string
  containerClassName?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, children, ...props }, ref) => {
    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label className="block text-xs text-slate-700 dark:text-slate-300 tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'flex w-full rounded bg-slate-200 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-slate-100',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
