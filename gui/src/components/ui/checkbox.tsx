import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onChange, label, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'inline-flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-600 dark:text-slate-500 group',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'size-5 rounded transition-all duration-150 flex items-center justify-center shadow-xs',
              'bg-slate-300 dark:bg-slate-950',
              'peer-checked:bg-linear-to-br peer-checked:from-blue-500 peer-checked:to-cyan-500',
              'group-hover:border-blue-500/60 dark:group-hover:border-blue-400/60',
              className
            )}
          >
            <Check strokeWidth={2}
              className={cn(
                'size-4 text-white transition-all duration-150',
                checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              )}
            />
          </div>
        </div>
        {label && <span>{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
