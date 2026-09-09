import React from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link'
  | 'emerald'
  | 'success'
  | 'purple'
  | 'amber'
  | 'warning'
  | 'rose'
  | 'cyan'
  | 'slate'
  | 'sunset'
  | 'lime'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded text-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer'

    const variants = {
      default:
        'bg-blue-500 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-cyan-500',
      primary:
        'bg-blue-500 bg-linear-to-r from-blue-500 to-cyan-500 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:to-transparent',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-700',
      outline:
        'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
      ghost:
        'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300',
      destructive:
        'bg-red-600 hover:bg-red-700 text-white shadow-xs dark:bg-red-600 dark:hover:bg-red-500',
      link:
        'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0 h-auto font-normal',
      emerald:
        'bg-emerald-500 bg-linear-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:to-transparent',
      success:
        'bg-emerald-500 bg-linear-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:to-transparent',
      purple:
        'bg-purple-500 bg-linear-to-r from-purple-500 to-indigo-500 font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:to-transparent',
      amber:
        'bg-amber-500 bg-linear-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:to-transparent',
      warning:
        'bg-amber-500 bg-linear-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:to-transparent',
      rose:
        'bg-rose-500 bg-linear-to-r from-rose-500 to-pink-500 font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:to-transparent',
      cyan:
        'bg-cyan-500 bg-linear-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:to-transparent',
      slate:
        'bg-slate-700 bg-linear-to-r from-slate-700 to-slate-900 font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:to-transparent border border-slate-600/50',
      sunset:
        'bg-orange-500 bg-linear-to-r from-orange-500 to-red-500 font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:to-transparent',
      lime:
        'bg-lime-500 bg-linear-to-r from-lime-500 to-emerald-500 font-semibold text-white shadow-lg shadow-lime-500/30 transition hover:to-transparent',
    }

    const sizes = {
      sm: 'px-2.5 py-1.5 text-[11px]',
      default: 'px-3.5 py-2 text-xs',
      lg: 'px-4 py-2.5 text-sm',
      icon: 'w-8 h-8 p-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
