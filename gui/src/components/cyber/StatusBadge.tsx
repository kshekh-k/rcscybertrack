import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, ShieldAlert, LucideProps } from 'lucide-react'
import { Badge, BadgeVariant } from '../ui/badge'

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  showIcon?: boolean
  showDot?: boolean
  dotPulse?: boolean
  strokeWidth?: number | string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  showIcon = true,
  showDot = false,
  dotPulse = false,
  strokeWidth = 2,
  className = '',
}) => {
  const icons: Record<StatusVariant, React.ComponentType<LucideProps>> = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: XCircle,
    info: Info,
    neutral: ShieldAlert,
  }

  const IconComponent = icons[variant] || icons.neutral

  return (
    <Badge
      variant={variant as BadgeVariant}
      dot={showDot}
      dotPulse={dotPulse}
      className={className}
    >
      {showIcon && <IconComponent strokeWidth={strokeWidth} className="size-3 shrink-0" />}
      <span className="capitalize">{status}</span>
    </Badge>
  )
}
