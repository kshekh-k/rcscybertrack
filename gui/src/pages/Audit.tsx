import { useState, useMemo, Fragment } from 'react'
import {
  ScrollText,
  Search,
  RefreshCw,
  Filter,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Database,
  Lock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { useAuditLogs } from '../features/audit/useAuditLogs'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { MetricCard } from '../components/cyber/MetricCard'
import { EmptyState } from '../components/cyber/EmptyState'
import { ErrorState } from '../components/cyber/ErrorState'
import { TableSkeleton } from '../components/cyber/LoadingState'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { AuditEvent } from '../lib/api'

export default function Audit() {
  const { data: auditData, isLoading, error, refetch } = useAuditLogs()

  const [searchQuery, setSearchQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failure'>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

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
  const uniqueActions = useMemo(() => Array.from(new Set(events.map((e) => e.action))), [events])

  // Client-side filtering
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
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
  }, [events, searchQuery, resultFilter, actionFilter])

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEvents.slice(start, start + pageSize)
  }, [filteredEvents, currentPage, pageSize])

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={ScrollText}
        title="Audit Center"
        badge={
          auditData && (
            integrityVerified ? (
              <Badge variant="success" size="sm" dot dotPulse title="Cryptographic SHA-256 hash chain verification">
                Log Integrity Verified
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" dot dotPulse title="Cryptographic SHA-256 hash chain verification">
                Hash Chain Tamper Alert
              </Badge>
            )
          )
        }
        description="Security and administrative activity with SHA-256 cryptographic chain verification"
        actions={
          <Button
            variant="default"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh audit logs"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      {/* Backend Contract Banner */}
      <CapabilityNotice
        moduleName="Cryptographic Audit Trail Engine"
        expectedEndpoint="GET /api/v1/audit/logs"
        description="Cryptographic SHA-256 hash chain verification validates system log integrity and tamper protection for administrative events."
      />

      {/* Error Callout */}
      {error && (
        <ErrorState
          title="Audit Subsystem Error"
          message={error.message || 'Unable to retrieve audit trail logs from CyberTrack Core.'}
          onRetry={handleRefresh}
        />
      )}

      {/* Summary KPI Breakdown Cards */}
      <div className="max-w-full overflow-x-auto on-hover-scroll pt-2 pb-3 -mt-2">
        <div className="flex gap-3 w-full">
          {[
            {
              title: 'Total Audit Logs',
              value: totalLogsCount,
              icon: ScrollText,
              subtitle: 'Recorded security events',
              className: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 min-w-64',
            },
            {
              title: 'Successful Actions',
              value: events.filter((e) => e.result === 'success').length,
              icon: ShieldCheck,
              subtitle: 'Authorized operations',
              className: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 min-w-64',
            },
            {
              title: 'Failed Attempts',
              value: events.filter((e) => e.result === 'failure').length,
              icon: ShieldAlert,
              subtitle: 'Rejected or failed actions',
              className: 'bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-rose-500/20 min-w-64',
            },
            {
              title: 'Hash Integrity',
              value: integrityVerified ? '100% Valid' : 'Alert',
              icon: Lock,
              subtitle: 'SHA-256 chain verification',
              className: 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/20 min-w-64',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <MetricCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={<Icon className="size-5 text-white" />}
                subtitle={item.subtitle}
                className={`w-full ${item.className}`}
              />
            )
          })}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-(--topbar-bg) rounded p-4 -mt-3 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search user, action, resource, IP address..."
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Action Filter */}
          {uniqueActions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted font-medium">Action:</span>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="py-1 text-xs font-medium max-w-45"
                containerClassName="max-w-45"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {/* Result Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Result:</span>
            <Select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </Select>
          </div>




        </div>
      </div>

      {/* Main Console Box / Table / Empty State */}
      <Card className="overflow-hidden shadow-lg border-0 block! -mt-3!">
        <CardHeader className="flex flex-wrap gap-1 flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
          <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ScrollText className="size-5 text-blue-600" />
            <span>System Audit Trail Log</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <label htmlFor="pageSizeSelectHeader" className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Show</label>
              <Select
                id="pageSizeSelectHeader"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 py-1 text-xs font-mono"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden block!">
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
                icon={<ScrollText className="size-6 text-slate-500" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
              <table className="text-left border-collapse table-auto w-max min-w-full">
                <thead>
                  <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                    <th className="px-4 py-3 whitespace-nowrap">User</th>
                    <th className="px-4 py-3 whitespace-nowrap">Action</th>
                    <th className="px-4 py-3 whitespace-nowrap">Resource</th>
                    <th className="px-4 py-3 whitespace-nowrap">Resource ID</th>
                    <th className="px-4 py-3 whitespace-nowrap">Result</th>
                    <th className="px-4 py-3 whitespace-nowrap">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {paginatedEvents.map((evt, idx) => {
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
                          className={`group transition-colors ${hasDetails ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40' : ''
                            } ${isExpanded ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                        >
                          {/* Expand Icon */}
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {hasDetails ? (
                              <ChevronRight className={`size-4 transition-transform duration-200 ${isExpanded ? 'text-amber-700 rotate-90' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                            ) : null}
                          </td>

                          {/* Timestamp */}
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3.5 text-slate-400 shrink-0" />
                              <span>{formattedTime}</span>
                            </div>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3 font-mono font-medium text-cyan-600 dark:text-cyan-400">
                            <div className="flex items-center gap-1.5">
                              <User className="size-3.5 text-cyan-500 shrink-0" />
                              <span>{evt.user || '—'}</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-50">
                            <div className="flex items-center gap-1.5">
                              <Activity className="size-3.5 text-blue-500 shrink-0" />
                              <span>{evt.action || '—'}</span>
                            </div>
                          </td>

                          {/* Resource */}
                          <td className="px-4 py-3">
                            <Badge variant="secondary" size="sm" className="font-mono text-3xs">
                              {evt.resource || '—'}
                            </Badge>
                          </td>

                          {/* Resource ID */}
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {evt.resource_id || '—'}
                          </td>

                          {/* Result */}
                          <td className="px-4 py-3">
                            <Badge
                              variant={isSuccess ? 'success' : 'danger'}
                              size="sm"
                              className="uppercase font-bold text-3xs"
                            >
                              {evt.result || 'unknown'}
                            </Badge>
                          </td>

                          {/* Source IP */}
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {evt.source_ip || '—'}
                          </td>
                        </tr>

                        {/* Expanded Details JSON block */}
                        {isExpanded && hasDetails && (
                          <tr className="bg-slate-50/80 dark:bg-slate-950/80">
                            <td colSpan={8} className="p-4 pl-12 border-t border-b border-slate-200 dark:border-slate-800">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                  <Database className="size-3.5" />
                                  <span>Event Payload Details & Hash Verification</span>
                                </div>

                                {evt.chain_hash && (
                                  <div className="text-2xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 p-2 rounded overflow-x-auto">
                                    <span className="text-slate-600 dark:text-slate-400">Chain Hash: </span>
                                    <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{evt.chain_hash}</span>
                                  </div>
                                )}

                                <pre className="text-2xs font-mono text-emerald-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-900 p-3 rounded overflow-x-auto">
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
            </div>
          )}
        </CardContent>

        {filteredEvents.length > 0 && (
          <CardFooter className="flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="pageSizeSelectFooter" className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Show</label>
                <Select
                  id="pageSizeSelectFooter"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 py-1 text-xs font-mono"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                </Select>
                <span className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">entries</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="font-mono text-xs">
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {Math.min(currentPage * pageSize, filteredEvents.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredEvents.length}
                </span>{' '}
                entries
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs cursor-pointer"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                <span>Prev</span>
              </Button>
              <div className="px-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                Page <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-400">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 text-xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
