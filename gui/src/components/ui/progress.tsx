import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  indicatorClassName?: string
  indicatorGradient?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, indicatorGradient, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, ((value ?? 0) / (max || 100)) * 100))

    const defaultGradient = 'bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400'

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-xs bg-slate-200 dark:bg-slate-800',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-xs transition-all duration-500',
            indicatorGradient || defaultGradient,
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
