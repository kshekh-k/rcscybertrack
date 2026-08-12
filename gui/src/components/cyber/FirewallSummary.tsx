import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowRight } from 'lucide-react'
import { FirewallRule } from '../../lib/api'
import { StatusBadge } from './StatusBadge'

interface FirewallSummaryProps {
  rules?: FirewallRule[]
  isLoading: boolean
}

export const FirewallSummary: React.FC<FirewallSummaryProps> = ({ rules = [], isLoading }) => {
  const displayRules = rules.slice(0, 5)

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Firewall Policy Summary</h3>
          </div>
          <Link
            to="/firewall"
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 group"
          >
            <span>View Firewall</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 bg-app-bg animate-pulse rounded-lg border border-border-subtle" />
            ))}
          </div>
        ) : displayRules.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No firewall rules configured.</p>
        ) : (
          <div className="space-y-2">
            {displayRules.map((rule) => {
              const isAllow = rule.action === 'allow'
              return (
                <div
                  key={rule.id}
                  className="bg-app-bg/50 border border-border-subtle/80 rounded-lg p-2.5 flex items-center justify-between text-xs transition-colors hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5">
                    <StatusBadge
                      status={rule.action}
                      variant={isAllow ? 'success' : 'danger'}
                      showDot={false}
                      className="text-[10px] px-1.5 uppercase font-mono"
                    />
                    <span className="font-mono text-text-primary font-medium">{rule.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary font-mono text-[11px]">
                    <span className="capitalize">{rule.direction}</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 uppercase">
                      {rule.protocol}
                    </span>
                    <span className="text-slate-400">{rule.interface || 'any'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-text-muted flex justify-between items-center">
        <span>Total Active Policies</span>
        <span className="font-mono font-semibold text-text-primary">{rules.length}</span>
      </div>
    </div>
  )
}
