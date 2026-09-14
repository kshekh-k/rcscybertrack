import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  className?: string
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  side = 'right',
  sideOffset = 10,
  className,
  disabled = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    if (side === 'right') {
      top = rect.top + rect.height / 2
      left = rect.right + sideOffset
    } else if (side === 'left') {
      top = rect.top + rect.height / 2
      left = rect.left - sideOffset
    } else if (side === 'top') {
      top = rect.top - sideOffset
      left = rect.left + rect.width / 2
    } else if (side === 'bottom') {
      top = rect.bottom + sideOffset
      left = rect.left + rect.width / 2
    }

    setCoords({ top, left })
  }, [side, sideOffset])

  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, updatePosition])

  if (disabled || !content) return children

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => {
        updatePosition()
        setIsOpen(true)
      }}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => {
        updatePosition()
        setIsOpen(true)
      }}
      onBlur={() => setIsOpen(false)}
      className="inline-flex"
    >
      {children}
      {isOpen &&
        createPortal(
          <div
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={cn(
              'fixed z-50 pointer-events-none transition-all duration-150 animate-in fade-in-0 zoom-in-95 select-none',
              side === 'right' && '-translate-y-1/2',
              side === 'left' && '-translate-y-1/2 -translate-x-full',
              side === 'top' && '-translate-x-1/2 -translate-y-full',
              side === 'bottom' && '-translate-x-1/2',
              'px-3 py-2 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-100 text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-md',
              className
            )}
          >
            {content}
            {/* Arrow */}
            {side === 'right' && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 bg-white dark:bg-slate-900 rotate-45" />
            )}
            {side === 'left' && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 bg-white dark:bg-slate-900 rotate-45" />
            )}
            {side === 'top' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 bg-white dark:bg-slate-900 rotate-45" />
            )}
            {side === 'bottom' && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-2 bg-white dark:bg-slate-900 rotate-45" />
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
