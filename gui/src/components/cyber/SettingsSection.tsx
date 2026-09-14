import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'

interface SettingsSectionProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  className,
}) => {
  return (
    <Card className={`-mt-3 ${className}`}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 border-b border-slate-200 dark:border-slate-800">

        {icon}

        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  )
}
