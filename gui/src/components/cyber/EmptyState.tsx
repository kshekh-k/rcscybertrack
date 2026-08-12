import React from 'react'
import { AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-app-bg/40 border border-dashed border-border-subtle rounded-xl my-2">
      <div className="p-3 bg-surface rounded-full border border-border-subtle text-text-muted mb-3">
        {icon || <AlertCircle className="w-6 h-6 text-slate-500" />}
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
