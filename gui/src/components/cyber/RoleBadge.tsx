import React from 'react'
import { UserRole } from '../../types/apiContracts'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const styles: Record<UserRole, { bg: string; text: string; border: string; label: string }> = {
    admin: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      label: 'Admin',
    },
    operator: {
      bg: 'bg-primary/10',
      text: 'text-primary-hover',
      border: 'border-primary/20',
      label: 'Security Operator',
    },
    auditor: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      label: 'Auditor',
    },
    viewer: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/20',
      label: 'Viewer',
    },
  }

  const current = styles[role] || styles.viewer

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {current.label}
    </span>
  )
}
