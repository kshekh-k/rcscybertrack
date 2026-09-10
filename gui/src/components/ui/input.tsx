import React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  icon?: React.ReactNode
  rightElement?: React.ReactNode
  error?: string
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, label, icon, rightElement, error, type = 'text', ...props }, ref) => {
    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label className="block text-xs text-slate-700 dark:text-slate-300 tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full bg-slate-200 dark:bg-slate-950  rounded py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all duration-150',
              icon ? 'pl-10' : 'pl-4',
              rightElement ? 'pr-11' : 'pr-4',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {icon && (
            <div className="size-4 text-slate-700 dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export const FormField = Input

