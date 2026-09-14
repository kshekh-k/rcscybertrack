import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface PageHeaderProps {
  /** LucideIcon component or React node for the page header icon */
  icon?: LucideIcon | React.ReactNode
  /** Icon CSS classes, defaults to 'size-8 shrink-0 text-blue-600' */
  iconClassName?: string
  /** Main title of the page */
  title: React.ReactNode
  /** Optional title CSS classes */
  titleClassName?: string
  /** Optional status badge or indicator displayed beside the title */
  badge?: React.ReactNode
  /** Subtitle / description of the page */
  description?: React.ReactNode
  /** Optional action elements rendered on the right side (e.g. Buttons, status widgets) */
  actions?: React.ReactNode
  /** Optional children rendered in place of or alongside actions */
  children?: React.ReactNode
  /** Root container className overrides */
  className?: string
  /** Whether to render a bottom border (defaults to true) */
  border?: boolean
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  iconClassName,
  title,
  titleClassName,
  badge,
  description,
  actions,
  children,
  className,
  border = true,
}) => {
  const renderIcon = () => {
    if (!icon) return null
    if (React.isValidElement(icon)) {
      return icon
    }
    const IconComponent = icon as LucideIcon
    return (
      <IconComponent
        className={cn('size-8 shrink-0 text-blue-600', iconClassName)}
        strokeWidth={1.5}
      />
    )
  }

  const actionContent = actions || children

  return (
    <div
      className={cn(
        'flex flex-row flex-wrap sm:items-center justify-between gap-4 pb-5',
        border && 'border-b border-slate-200 dark:border-slate-800',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 max-w-full">
        {renderIcon()}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className={cn(
                'text-base font-mono font-semibold text-slate-900 dark:text-slate-100 tracking-tight',
                titleClassName
              )}
            >
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-60 sm:max-w-full">
              {description}
            </p>
          )}
        </div>
      </div>

      {actionContent && (
        <div className="flex items-center gap-3 shrink-0">{actionContent}</div>
      )}
    </div>
  )
}

export default PageHeader
