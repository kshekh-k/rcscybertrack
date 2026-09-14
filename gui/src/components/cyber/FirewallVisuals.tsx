import React from 'react'
import { ShieldCheck, ShieldAlert, Ban, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

export type RuleAction = 'allow' | 'deny' | 'reject'

export const ActionBadge: React.FC<{ action: RuleAction }> = ({ action }) => {
  const styles = {
    allow: {
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: CheckCircle,
      label: 'ALLOW',
    },
    deny: {
      bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      icon: Ban,
      label: 'DENY',
    },
    reject: {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: ShieldAlert,
      label: 'REJECT',
    },
  }

  const current = styles[action] || styles.deny
  const IconComp = current.icon

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-bold font-mono border select-none', current.bg)}>
      <IconComp className="size-3" />
      <span>{current.label}</span>
    </span>
  )
}

export interface ChainPolicyProps {
  chain: 'INPUT' | 'OUTPUT' | 'FORWARD'
  policy: 'DROP' | 'ACCEPT' | 'REJECT'
}

export const ChainPolicyBadge: React.FC<ChainPolicyProps> = ({ chain, policy }) => {
  const isDrop = policy === 'DROP' || policy === 'REJECT'
  return (
    <div className="flex items-center justify-between pb-5 sm:pb-0 sm:pr-5">


      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{chain} CHAIN</span>

      <Badge variant={isDrop ? 'danger' : 'success'} size="sm">
        DEFAULT {policy}
      </Badge>
    </div>
  )
}

export interface FirewallStatusCardProps {
  backend: string
  activeRules: number
  isRunning?: boolean
  defaultInput?: string
  defaultOutput?: string
  className?: string
}

export const FirewallStatusCard: React.FC<FirewallStatusCardProps> = ({
  backend,
  activeRules,
  isRunning = true,
  defaultInput = 'DROP',
  defaultOutput = 'ACCEPT',
  className,
}) => {
  return (
    <Card className={cn('p-4 space-y-2 shadow-md', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">Firewall Core</h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">Backend: {backend}</p>
          </div>
        </div>

        <Badge variant={isRunning ? 'success' : 'danger'} size="sm" dot dotPulse={isRunning}>
          {isRunning ? 'RUNNING' : 'STOPPED'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-left font-mono">
        <div className="">
          <span className="text-3xs text-slate-400 block uppercase">Rules</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeRules}</span>
        </div>
        <div className="">
          <span className="text-3xs text-slate-400 block uppercase">Default Input</span>
          <span className={cn('text-xs font-bold', defaultInput === 'ACCEPT' ? 'text-emerald-500' : 'text-red-500')}>
            {defaultInput}
          </span>
        </div>
        <div className="">
          <span className="text-3xs text-slate-400 block uppercase">Default Output</span>
          <span className={cn('text-xs font-bold', defaultOutput === 'ACCEPT' ? 'text-emerald-500' : 'text-red-500')}>
            {defaultOutput}
          </span>
        </div>
      </div>
    </Card>
  )
}
