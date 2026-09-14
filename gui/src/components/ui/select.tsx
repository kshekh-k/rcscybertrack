import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode
  error?: string
  containerClassName?: string
  icon?: React.ReactNode
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, icon, children, style, ...props }, ref) => {
    return (
      <div className={cn(label || error ? 'space-y-1.5' : '', 'min-w-0', containerClassName)}>
        {label && (
          <label className="block text-xs text-slate-700 dark:text-slate-300 tracking-wider font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center min-w-0">
          <select
            ref={ref}
            style={{ colorScheme: 'dark light', ...style }}
            className={cn(
              'appearance-none rounded bg-slate-200 dark:bg-slate-950 pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:scheme-dark scheme-light [&>option]:bg-white [&>option]:dark:bg-slate-900 [&>option]:text-slate-900 [&>option]:dark:text-slate-100 w-full',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-2.5 pointer-events-none flex items-center text-slate-500 dark:text-slate-400">
            {icon || <ChevronDown className="size-4 shrink-0" />}
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
