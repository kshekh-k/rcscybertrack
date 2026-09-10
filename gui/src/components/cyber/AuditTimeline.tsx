import React from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import { AuditLogResponse } from '../../lib/api'
import { StatusBadge } from './StatusBadge'

interface AuditTimelineProps {
  auditData?: AuditLogResponse
  isLoading: boolean
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ auditData, isLoading }) => {
  const events = auditData?.events || []
  const displayEvents = events.slice(0, 5)

  return (
    <div className="bg-surface rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <ScrollText className="size-4 text-warning" />
            <h3 className="text-sm font-semibold text-text-primary">Audit Log Timeline</h3>
          </div>
          <div className="flex items-center gap-3">
            {auditData && (
              <span
                className={`inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded border ${
                  auditData.integrity_verified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
                title="Cryptographic hash chain verification"
              >
                {auditData.integrity_verified ? (
                  <ShieldCheck className="size-3" />
                ) : (
                  <ShieldAlert className="size-3" />
                )}
                <span>{auditData.integrity_verified ? 'Chain Verified' : 'Integrity Alert'}</span>
              </span>
            )}
            <Link
              to="/audit"
              className="text-xs font-medium text-warning hover:text-amber-300 transition-colors flex items-center gap-1 group"
            >
              <span>View Audit Center</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-app-bg animate-pulse rounded-lg " />
            ))}
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            <ScrollText className="size-6 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>No audit events available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEvents.map((evt, idx) => {
              const formattedTime = new Date(evt.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
              const isSuccess = evt.result === 'success'

              return (
                <div
                  key={evt.chain_hash || idx}
                  className="bg-app-bg/50 /80 rounded-lg p-2.5 flex items-center justify-between text-xs transition-colors hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-2xs text-text-muted shrink-0">{formattedTime}</span>
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-semibold text-text-primary truncate">{evt.action}</span>
                      <span className="text-3xs text-text-muted font-mono bg-slate-800/60 px-1.5 py-0.2 rounded shrink-0">
                        {evt.resource}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-text-secondary">{evt.user}</span>
                    <StatusBadge
                      status={evt.result}
                      variant={isSuccess ? 'success' : 'danger'}
                      showDot={false}
                      className="text-3xs uppercase font-mono px-1.5"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-text-muted flex justify-between items-center">
        <span>Logged Events Count</span>
        <span className="font-mono font-semibold text-text-primary">{auditData?.log_count ?? events.length}</span>
      </div>
    </div>
  )
}
