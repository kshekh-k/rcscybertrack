import React from 'react'
import { ShieldCheck, ShieldAlert, Ban, CheckCircle, Flame } from 'lucide-react'
import { cn } from '../../lib/utils'

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
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border select-none', current.bg)}>
      <IconComp className="w-3 h-3" />
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
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070B14]">
      <div className="flex items-center gap-2">
        <Flame className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{chain} CHAIN</span>
      </div>
      <span
        className={cn(
          'px-2 py-0.5 rounded text-[10px] font-bold font-mono border',
          isDrop
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
        )}
      >
        DEFAULT {policy}
      </span>
    </div>
  )
}

export const FirewallStatusCard: React.FC<{
  backend: string
  activeRules: number
  isRunning?: boolean
}> = ({ backend, activeRules, isRunning = true }) => {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Firewall Core</h4>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Backend: {backend}</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {isRunning ? 'RUNNING' : 'STOPPED'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center font-mono">
        <div className="p-2 bg-slate-50 dark:bg-[#070B14] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Rules</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeRules}</span>
        </div>
        <div className="p-2 bg-slate-50 dark:bg-[#070B14] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Default Input</span>
          <span className="text-xs font-bold text-red-500">DROP</span>
        </div>
        <div className="p-2 bg-slate-50 dark:bg-[#070B14] rounded-lg">
          <span className="text-[10px] text-slate-400 block uppercase">Default Output</span>
          <span className="text-xs font-bold text-emerald-500">ACCEPT</span>
        </div>
      </div>
    </div>
  )
}
