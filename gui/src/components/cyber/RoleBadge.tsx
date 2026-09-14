import React from 'react'
import { UserRole } from '../../types/apiContracts'
import { Badge, BadgeVariant, BadgeSize } from '../ui/badge'

export interface RoleBadgeProps {
  role: UserRole
  size?: BadgeSize
  dot?: boolean
  dotPulse?: boolean
  className?: string
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'default',
  dot = false,
  dotPulse = false,
  className = '',
}) => {
  const roleConfig: Record<UserRole, { variant: BadgeVariant; label: string }> = {
    admin: {
      variant: 'destructive',
      label: 'Admin',
    },
    operator: {
      variant: 'default',
      label: 'Security Operator',
    },
    auditor: {
      variant: 'warning',
      label: 'Auditor',
    },
    viewer: {
      variant: 'secondary',
      label: 'Viewer',
    },
  }

  const current = roleConfig[role] || roleConfig.viewer

  return (
    <Badge
      variant={current.variant}
      size={size}
      dot={dot}
      dotPulse={dotPulse}
      className={className}
    >
      {current.label}
    </Badge>
  )
}
