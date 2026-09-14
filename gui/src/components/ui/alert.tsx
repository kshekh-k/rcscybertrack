import React from 'react'
import { AlertTriangle, CheckCircle2, Info, RefreshCw, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type AlertVariant = 'error' | 'destructive' | 'warning' | 'success' | 'info' | 'default'

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant
  title?: React.ReactNode
  message?: React.ReactNode
  icon?: React.ReactNode
  onRetry?: () => void
  isRetrying?: boolean
  retryLabel?: string
  onClose?: () => void
  children?: React.ReactNode
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  message,
  icon,
  onRetry,
  isRetrying = false,
  retryLabel = 'Retry',
  onClose,
  children,
  className,
  ...props
}) => {
  const normalizedVariant =
    variant === 'destructive' ? 'error' : variant === 'default' ? 'info' : variant

  const variantStyles = {
    error: {
      container: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/20 border-0',
      iconBg: 'bg-white/20 text-white',
      title: 'text-white font-medium',
      message: 'text-rose-100',
      button: 'bg-white/20 text-white hover:bg-white/30',
      defaultIcon: AlertTriangle,
    },
    warning: {
      container: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-950/20 border-0',
      iconBg: 'bg-white/20 text-white',
      title: 'text-white font-medium',
      message: 'text-amber-100',
      button: 'bg-white/20 text-white hover:bg-white/30',
      defaultIcon: AlertTriangle,
    },
    success: {
      container: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/20 border-0',
      iconBg: 'bg-white/20 text-white',
      title: 'text-white font-medium',
      message: 'text-emerald-100',
      button: 'bg-white/20 text-white hover:bg-white/30',
      defaultIcon: CheckCircle2,
    },
    info: {
      container: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/20 border-0',
      iconBg: 'bg-white/20 text-white',
      title: 'text-white font-medium',
      message: 'text-blue-100',
      button: 'bg-white/20 text-white hover:bg-white/30',
      defaultIcon: Info,
    },
  }

  const current = variantStyles[normalizedVariant] || variantStyles.error
  const DefaultIcon = current.defaultIcon
  const content = message || children

  return (
    <div
      className={cn(
        'rounded py-3 px-4 flex items-start gap-2 transition-colors',
        current.container,
        className
      )}
      {...props}
    >

      {icon ? icon : <DefaultIcon className={cn("shrink-0", content ? "size-7" : "size-5")} strokeWidth={1.5} />}


      <div className="flex-1 min-w-0 pt-0.5">
        {title && <h4 className={cn('text-sm font-medium', current.title)}>{title}</h4>}
        {content && <p className={cn('text-xs leading-relaxed', current.message)}>{content}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying} title={retryLabel}
            className={cn(
              'px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer relative',
              current.button
            )}
          >
            <RefreshCw className={cn('size-3.5', isRetrying && 'animate-spin')} />
            <span className='sr-only'>{retryLabel}</span>
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn('p-1 rounded hover:opacity-80 transition-opacity cursor-pointer', current.button)}
            title="Dismiss"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert
