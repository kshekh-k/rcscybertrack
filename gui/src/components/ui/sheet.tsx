import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  side?: 'right' | 'left'
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  side = 'right',
  title,
  description,
  children,
  footer,
  className,
}) => {
  const [mounted, setMounted] = useState(isOpen)
  const [active, setActive] = useState(false)

  useEffect(() => {
    let animId1: number
    let animId2: number
    let timeoutId: ReturnType<typeof setTimeout>

    if (isOpen) {
      setMounted(true)
      // Double rAF ensures the browser paints the offscreen state before starting the slide-in transition
      animId1 = requestAnimationFrame(() => {
        animId2 = requestAnimationFrame(() => {
          setActive(true)
        })
      })
    } else {
      setActive(false)
      timeoutId = setTimeout(() => {
        setMounted(false)
      }, 300)
    }

    return () => {
      if (animId1) cancelAnimationFrame(animId1)
      if (animId2) cancelAnimationFrame(animId2)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!mounted) return null

  const sidePos = side === 'right' ? 'right-0' : 'left-0'
  const translateOff = side === 'right' ? 'translate-x-full' : '-translate-x-full'

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-slate-950/80 backdrop-blur transition-opacity duration-300 ease-in-out',
          active ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet Side Panel Container */}
      <div
        className={cn(
          'fixed z-50 inset-y-0 flex flex-col w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out transform',
          sidePos,
          active ? 'translate-x-0' : translateOff,
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              {title && <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>}
              {description && <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4  bg-slate-100 dark:bg-slate-950/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
