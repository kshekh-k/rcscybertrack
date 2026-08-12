import React from 'react'

interface SettingsSectionProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
}) => {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-lg space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}
