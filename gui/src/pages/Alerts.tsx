import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  Terminal,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { AlertSeverityBadge } from '../components/cyber/AlertSeverityBadge'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { MetricCard } from '../components/cyber/MetricCard'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Dialog } from '../components/ui/dialog'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Alert } from '../types/apiContracts'

export default function Alerts() {
  const [alertsList] = useState<Alert[]>([]) // Real backend alert service not connected
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const counts = useMemo(() => ({
    critical: alertsList.filter((a) => a.severity?.toLowerCase() === 'critical').length,
    high: alertsList.filter((a) => a.severity?.toLowerCase() === 'high').length,
    medium: alertsList.filter((a) => a.severity?.toLowerCase() === 'medium').length,
    low: alertsList.filter((a) => a.severity?.toLowerCase() === 'low').length,
    info: alertsList.filter((a) => a.severity?.toLowerCase() === 'info').length,
  }), [alertsList])

  const filteredAlerts = useMemo(() => {
    return alertsList.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.source_ip && a.source_ip.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter

      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [alertsList, searchQuery, severityFilter, statusFilter])

  const totalPages = Math.ceil(filteredAlerts.length / pageSize) || 1

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAlerts.slice(start, start + pageSize)
  }, [filteredAlerts, currentPage, pageSize])

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={AlertTriangle}
        title="Security Threat Center & Alerts"
        description="Real-time alert aggregation, IDS/IPS event triggers, threat severity classification, and active mitigation tracking"
        actions={
          <Button
            variant="default"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      {/* Backend Contract Banner */}
      <CapabilityNotice
        moduleName="Threat Detection Engine & Alert Daemon"
        expectedEndpoint="GET /api/v1/alerts"
        description="The Threat Center console is initialized. Security detection triggers, IDS/IPS alerts, and rule match telemetry will stream into this console upon activation of the backend alert daemon service."
      />

      {/* Severity Breakdown Cards */}
      <div className='max-w-full overflow-x-auto on-hover-scroll pt-2 pb-3 -mt-2 '>
        <div className="flex gap-3 w-full">
          {[
            {
              title: 'Critical',
              value: counts.critical,
              icon: AlertTriangle,
              subtitle: 'Immediate action required',
              className: 'bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-rose-500/20 min-w-64',
            },
            {
              title: 'High',
              value: counts.high,
              icon: ShieldAlert,
              subtitle: 'Elevated risk events',
              className: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 min-w-64',
            },
            {
              title: 'Medium',
              value: counts.medium,
              icon: Activity,
              subtitle: 'Policy violations',
              className: 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-md shadow-yellow-500/20 min-w-64',
            },
            {
              title: 'Low',
              value: counts.low,
              icon: Activity,
              subtitle: 'Minor anomalies',
              className: 'bg-gradient-to-r from-sky-500 to-blue-500 shadow-md shadow-cyan-500/20 min-w-64',
            },
            {
              title: 'Info',
              value: counts.info,
              icon: Terminal,
              subtitle: 'Informational logs',
              className: 'bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-md shadow-slate-700/20 min-w-64',
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
      <div className="bg-(--topbar-bg) rounded p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search alert title, rule ID, source IP..."
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Severity:</span>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Alert Console Table / Empty State */}
      <Card className="overflow-hidden shadow-lg border-0 block!">
        <CardHeader className="flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
          <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShieldAlert className="size-5 text-blue-600" />
            <span>Alert Detection Stream</span>
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
              <span>Refresh Stream</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden block!">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="size-10 text-amber-500 mb-2" />
              <span className="text-sm text-slate-900 dark:text-slate-50 font-semibold">No security alerts available</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
                The backend alert service (`GET /api/v1/alerts`) is not yet connected to stream live threat telemetry. No alerts have been triggered or recorded.
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mt-4 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md font-mono text-2xs">
                <Terminal className="size-3.5 text-cyan-500" />
                <span>Target Endpoint: GET /api/v1/alerts</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
              <table className="text-left border-collapse table-auto w-max min-w-full">
                <thead>
                  <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                    <th className="px-4 py-3 whitespace-nowrap">Severity</th>
                    <th className="px-4 py-3 whitespace-nowrap">Alert Title</th>
                    <th className="px-4 py-3 whitespace-nowrap">Source IP</th>
                    <th className="px-4 py-3 whitespace-nowrap">Destination IP</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {paginatedAlerts.map((alt) => (
                    <tr
                      key={alt.id}
                      onClick={() => setSelectedAlert(alt)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(alt.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <AlertSeverityBadge severity={alt.severity} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-50">
                        {alt.title}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-600 dark:text-cyan-400">
                        {alt.source_ip || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {alt.destination_ip || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={alt.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAlert(alt)
                          }}
                          className="group text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1.5 font-mono cursor-pointer"
                        >
                          <span>View</span>
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {filteredAlerts.length > 0 && (
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
                  {Math.min(currentPage * pageSize, filteredAlerts.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredAlerts.length}
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

      {/* Alert Detail Sheet Modal */}
      <Dialog
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        icon={<ShieldAlert className="size-7 text-blue-600 shrink-0" strokeWidth={1.5} />}
        title={
          selectedAlert && (
            <span className="flex items-center gap-2">
              <AlertSeverityBadge severity={selectedAlert.severity} />
              <span>{selectedAlert.title}</span>
            </span>
          )
        }
        description="Detailed telemetry record and rule match information."
        maxWidth="max-w-xl"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedAlert.description}</p>

            <div className="bg-slate-100 dark:bg-slate-900/60 p-3.5 rounded-xl space-y-1.5 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Source IP:</span>
                <span className="font-semibold">{selectedAlert.source_ip || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Destination IP:</span>
                <span className="font-semibold">{selectedAlert.destination_ip || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Rule Match:</span>
                <span className="font-semibold">{selectedAlert.rule_id || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="default"
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </Button>
              <Button
                disabled
                variant="secondary"
              >
                Acknowledge Alert (Disabled)
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
