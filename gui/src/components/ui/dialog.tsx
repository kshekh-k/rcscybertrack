import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface DialogProps {
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  maxWidth?: string
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  title,
  description,
  icon,
  children,
  className,
  maxWidth = 'max-w-lg',
}) => {
  const isCurrentlyOpen = open ?? isOpen ?? false

  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCurrentlyOpen) {
        handleClose()
      }
    }
    if (isCurrentlyOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCurrentlyOpen])

  if (!isCurrentlyOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative z-50 w-full rounded bg-(--topbar-bg) text-slate-900 dark:text-slate-50 p-5 shadow-2xl transition-all animate-in zoom-in-95 duration-200 overflow-hidden',
          maxWidth,
          className
        )}
      >
        {(title || description || icon) && (
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 pr-8">
            <div className="flex items-center gap-3">
              {icon && icon}
              <div>
                {title && (
                  <h3 className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs leading-thight text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer absolute top-2 right-2"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        )}

        <div className={title || description || icon ? 'pt-4' : ''}>{children}</div>
      </div>
    </div>,
    document.body
  )
}

export const Modal = Dialog

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800',
      className
    )}
    {...props}
  />
)

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn(
      'text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2',
      className
    )}
    {...props}
  />
)

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn('text-xs text-slate-500 dark:text-slate-400 mt-0.5', className)}
    {...props}
  />
)

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('py-4', className)} {...props} />

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4',
      className
    )}
    {...props}
  />
)
