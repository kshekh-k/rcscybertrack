import React from 'react'
import { Alert, AlertVariant } from '../ui/alert'

export interface ErrorStateProps {
  title?: string
  message: string
  variant?: AlertVariant
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'API Connection Error',
  message,
  variant = 'error',
  onRetry,
  isRetrying = false,
  className,
}) => {
  return (
    <Alert
      variant={variant}
      title={title}
      message={message}
      onRetry={onRetry}
      isRetrying={isRetrying}
      className={className}
    />
  )
}
