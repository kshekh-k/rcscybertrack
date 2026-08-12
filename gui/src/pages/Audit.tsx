import { useState, Fragment } from 'react'
import {
  ScrollText,
  Search,
  RefreshCw,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronRight,
  Database,
} from 'lucide-react'
import { useAuditLogs } from '../features/audit/useAuditLogs'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { EmptyState } from '../components/cyber/EmptyState'
import { ErrorState } from '../components/cyber/ErrorState'
import { TableSkeleton } from '../components/cyber/LoadingState'
import { AuditEvent } from '../lib/api'

export default function Audit() {
  const { data: auditData, isLoading, error, refetch } = useAuditLogs()

  const [searchQuery, setSearchQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failure'>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const toggleRowExpansion = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const events: AuditEvent[] = auditData?.events || []
  const integrityVerified = auditData?.integrity_verified ?? true
  const totalLogsCount = auditData?.log_count ?? events.length

  // Extract unique actions for action filter dropdown
  const uniqueActions = Array.from(new Set(events.map((e) => e.action)))

  // Client-side filtering
  const filteredEvents = events.filter((evt) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      (evt.user && evt.user.toLowerCase().includes(query)) ||
      (evt.action && evt.action.toLowerCase().includes(query)) ||
      (evt.resource && evt.resource.toLowerCase().includes(query)) ||
      (evt.resource_id && evt.resource_id.toLowerCase().includes(query)) ||
      (evt.source_ip && evt.source_ip.toLowerCase().includes(query))

    const matchesResult = resultFilter === 'all' || evt.result === resultFilter
    const matchesAction = actionFilter === 'all' || evt.action === actionFilter

    return matchesSearch && matchesResult && matchesAction
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Audit Center</h1>
            {auditData && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  integrityVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
                title="Cryptographic SHA-256 hash chain verification"
              >
                {integrityVerified ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Log Integrity Verified</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                    <span>Hash Chain Tamper Alert</span>
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Security and administrative activity with SHA-256 cryptographic chain verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-surface hover:bg-slate-800 border border-border-subtle text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Refresh audit logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-warning ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <ErrorState
          title="Audit Subsystem Error"
          message={error.message || 'Unable to retrieve audit trail logs from CyberTrack Core.'}
          onRetry={handleRefresh}
        />
      )}

      {/* Controls Bar */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user, action, resource, IP address..."
            className="w-full bg-app-bg border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Result Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Result:</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="bg-app-bg border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>

          {/* Action Filter */}
          {uniqueActions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted font-medium">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-app-bg border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium max-w-[180px] truncate"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Audit Console Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ScrollText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">System Audit Trail</h2>
              <p className="text-xs text-text-muted">
                Showing {filteredEvents.length} of {totalLogsCount} recorded security events
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Audit Events Available"
                description={
                  searchQuery || resultFilter !== 'all' || actionFilter !== 'all'
                    ? 'No audit log entries match your search or filter parameters.'
                    : 'No system audit logs found in the appliance log store.'
                }
                icon={<ScrollText className="w-6 h-6 text-slate-500" />}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-app-bg/80 border-b border-border-subtle text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-8"></th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Resource ID</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60 text-xs">
                {filteredEvents.map((evt, idx) => {
                  const rowKey = evt.chain_hash || `evt-${idx}`
                  const isExpanded = !!expandedRows[rowKey]
                  const hasDetails = evt.details && Object.keys(evt.details).length > 0
                  const isSuccess = evt.result === 'success'

                  const formattedTime = evt.timestamp
                    ? new Date(evt.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—'

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        onClick={() => hasDetails && toggleRowExpansion(rowKey)}
                        className={`group transition-colors ${
                          hasDetails ? 'cursor-pointer hover:bg-slate-800/40' : ''
                        } ${isExpanded ? 'bg-slate-800/50' : ''}`}
                      >
                        {/* Expand Icon */}
                        <td className="py-4 px-4 text-slate-500">
                          {hasDetails ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                            )
                          ) : null}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4 font-mono text-text-muted whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{formattedTime}</span>
                          </div>
                        </td>

                        {/* User */}
                        <td className="py-4 px-4 font-mono font-medium text-text-primary">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{evt.user || '—'}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 font-semibold text-text-primary">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{evt.action || '—'}</span>
                          </div>
                        </td>

                        {/* Resource */}
                        <td className="py-4 px-4 font-mono text-text-secondary">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {evt.resource || '—'}
                          </span>
                        </td>

                        {/* Resource ID */}
                        <td className="py-4 px-4 font-mono text-text-muted">
                          {evt.resource_id || '—'}
                        </td>

                        {/* Result */}
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={evt.result || 'unknown'}
                            variant={isSuccess ? 'success' : 'danger'}
                            showDot={false}
                            className="text-[10px] uppercase font-mono px-2"
                          />
                        </td>

                        {/* Source IP */}
                        <td className="py-4 px-4 font-mono text-text-secondary">
                          {evt.source_ip || '—'}
                        </td>
                      </tr>

                      {/* Expanded Details JSON block */}
                      {isExpanded && hasDetails && (
                        <tr className="bg-app-bg/90">
                          <td colSpan={8} className="p-4 pl-12 border-t border-b border-slate-800/80">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                                <Database className="w-3.5 h-3.5" />
                                <span>Event Payload Details & Hash Verification</span>
                              </div>

                              {evt.chain_hash && (
                                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 overflow-x-auto">
                                  <span className="text-text-muted">Chain Hash: </span>
                                  <span className="text-cyan-300">{evt.chain_hash}</span>
                                </div>
                              )}

                              <pre className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                                {JSON.stringify(evt.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
