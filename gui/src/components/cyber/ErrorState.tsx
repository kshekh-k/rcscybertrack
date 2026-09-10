import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'API Connection Error',
  message,
  onRetry,
}) => {
  return (
    <div className="bg-rose-950/20 rounded-xl p-5 my-2 flex items-start gap-4">
      <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 shrink-0">
        <AlertTriangle className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-rose-300">{title}</h4>
        <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="size-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}
