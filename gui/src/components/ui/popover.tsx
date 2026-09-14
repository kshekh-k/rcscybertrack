import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  matchTriggerWidth?: boolean
  className?: string
  popoverClass?: string
}

export function Popover({
  open,
  onOpenChange,
  children,
  content,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  matchTriggerWidth = false,
  className,
  popoverClass,
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left?: number; right?: number; width?: number }>({})

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()

    const newCoords: { top?: number; bottom?: number; left?: number; right?: number; width?: number } = {}

    if (matchTriggerWidth) {
      newCoords.width = rect.width
    }

    if (side === 'top') {
      newCoords.bottom = window.innerHeight - rect.top + sideOffset
      if (align === 'start') {
        newCoords.left = rect.left
      } else if (align === 'end') {
        newCoords.right = window.innerWidth - rect.right
      } else {
        newCoords.left = rect.left + rect.width / 2
      }
    } else if (side === 'bottom') {
      newCoords.top = rect.bottom + sideOffset
      if (align === 'start') {
        newCoords.left = rect.left
      } else if (align === 'end') {
        newCoords.right = window.innerWidth - rect.right
      } else {
        newCoords.left = rect.left + rect.width / 2
      }
    } else if (side === 'right') {
      newCoords.left = rect.right + sideOffset
      if (align === 'end') {
        newCoords.bottom = window.innerHeight - rect.bottom
      } else if (align === 'start') {
        newCoords.top = rect.top
      } else {
        newCoords.top = rect.top + rect.height / 2
      }
    } else if (side === 'left') {
      newCoords.right = window.innerWidth - rect.left + sideOffset
      if (align === 'end') {
        newCoords.bottom = window.innerHeight - rect.bottom
      } else if (align === 'start') {
        newCoords.top = rect.top
      } else {
        newCoords.top = rect.top + rect.height / 2
      }
    }

    setCoords(newCoords)
  }, [side, align, sideOffset, matchTriggerWidth])

  useEffect(() => {
    if (!open) return

    updatePosition()

    const handleScrollOrResize = () => {
      updatePosition()
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return
      }
      onOpenChange(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, updatePosition, onOpenChange])

  return (
    <div ref={triggerRef} className={cn("inline-block w-full", popoverClass)}>
      {children}
      {open &&
        createPortal(
          <div
            ref={contentRef}
            style={{
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: coords.left !== undefined ? `${coords.left}px` : undefined,
              right: coords.right !== undefined ? `${coords.right}px` : undefined,
              width: coords.width !== undefined ? `${coords.width}px` : undefined,
            }}
            className={cn(
              'fixed z-50 transition-all duration-150 animate-in fade-in-0 zoom-in-95',
              side === 'top' && align === 'center' && '-translate-x-1/2',
              side === 'bottom' && align === 'center' && '-translate-x-1/2',
              side === 'right' && align === 'center' && '-translate-y-1/2',
              side === 'left' && align === 'center' && '-translate-y-1/2',
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  )
}
