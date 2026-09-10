import { useState } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  X,
  Terminal,
  Activity,
} from 'lucide-react'
import { AlertSeverityBadge } from '../components/cyber/AlertSeverityBadge'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { Alert } from '../types/apiContracts'

export default function Alerts() {
  const [alertsList] = useState<Alert[]>([]) // Real backend alert service not connected
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const filteredAlerts = alertsList.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.source_ip && a.source_ip.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter

    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Threat & Alert Center</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Enterprise intrusion detection alerts, anomaly signals, and automated threat mitigation events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-surface hover:bg-slate-800 text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 text-warning ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend Contract Banner */}
      <CapabilityNotice
        moduleName="Threat Detection Engine & Alert Daemon"
        expectedEndpoint="GET /api/v1/alerts"
        description="The Threat Center console is initialized. Security detection triggers, IDS/IPS alerts, and rule match telemetry will stream into this console upon activation of the backend alert daemon service."
      />

      {/* Severity Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-bold text-rose-400">Critical</span>
            <AlertTriangle className="size-4 text-rose-400" />
          </div>
          <p className="text-xl font-mono font-bold text-text-primary mt-1">0</p>
          <p className="text-2xs text-text-muted mt-1">Immediate action required</p>
        </div>

        <div className="bg-surface rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-bold text-amber-400">High</span>
            <ShieldAlert className="size-4 text-amber-400" />
          </div>
          <p className="text-xl font-mono font-bold text-text-primary mt-1">0</p>
          <p className="text-2xs text-text-muted mt-1">Elevated risk events</p>
        </div>

        <div className="bg-surface rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-bold text-yellow-300">Medium</span>
            <Activity className="size-4 text-yellow-300" />
          </div>
          <p className="text-xl font-mono font-bold text-text-primary mt-1">0</p>
          <p className="text-2xs text-text-muted mt-1">Policy violations</p>
        </div>

        <div className="bg-surface rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-bold text-cyan-400">Low</span>
            <Activity className="size-4 text-cyan-400" />
          </div>
          <p className="text-xl font-mono font-bold text-text-primary mt-1">0</p>
          <p className="text-2xs text-text-muted mt-1">Minor anomalies</p>
        </div>

        <div className="bg-surface /60 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-bold text-slate-400">Info</span>
            <Terminal className="size-4 text-slate-400" />
          </div>
          <p className="text-xl font-mono font-bold text-text-primary mt-1">0</p>
          <p className="text-2xs text-text-muted mt-1">Informational logs</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-surface rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alert title, rule ID, source IP..."
            className="w-full bg-app-bg rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-app-bg text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-app-bg text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Alert Console Table / Empty State */}
      <div className="bg-surface rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 ">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Alert Detection Stream</h2>
              <p className="text-xs text-text-muted">Real-time intrusion detection and security policy violation events</p>
            </div>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-app-bg/40">
            <div className="p-4 bg-surface rounded-full text-slate-500 mb-4">
              <AlertTriangle className="size-8 text-amber-400/60" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">No security alerts available</h3>
            <p className="text-xs text-text-secondary max-w-md mb-4 leading-relaxed">
              The backend alert service (`GET /api/v1/alerts`) is not yet connected to stream live threat telemetry. No alerts have been triggered or recorded.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-slate-400 rounded-md font-mono text-2xs">
              <Terminal className="size-3.5 text-cyan-400" />
              <span>Target Endpoint: GET /api/v1/alerts</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-app-bg/80 border-b border-border-subtle text-2xs font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Severity</th>
                  <th className="py-3.5 px-6">Alert Title</th>
                  <th className="py-3.5 px-6">Source IP</th>
                  <th className="py-3.5 px-6">Destination IP</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {filteredAlerts.map((alt) => (
                  <tr
                    key={alt.id}
                    onClick={() => setSelectedAlert(alt)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-mono text-text-muted">
                      {new Date(alt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <AlertSeverityBadge severity={alt.severity} />
                    </td>
                    <td className="py-4 px-6 font-semibold text-text-primary">
                      {alt.title}
                    </td>
                    <td className="py-4 px-6 font-mono text-cyan-400">
                      {alt.source_ip || '—'}
                    </td>
                    <td className="py-4 px-6 font-mono text-text-secondary">
                      {alt.destination_ip || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={alt.status} />
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-primary">
                      View →
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Detail Sheet Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-surface rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertSeverityBadge severity={selectedAlert.severity} />
                <h3 className="text-base font-semibold text-text-primary">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">{selectedAlert.description}</p>

            <div className="bg-app-bg p-3 rounded-lg space-y-1 font-mono text-xs text-slate-300">
              <p>Source IP: {selectedAlert.source_ip || 'N/A'}</p>
              <p>Destination IP: {selectedAlert.destination_ip || 'N/A'}</p>
              <p>Rule Match: {selectedAlert.rule_id || 'N/A'}</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium rounded-lg"
              >
                Close
              </button>
              <button
                disabled
                className="px-4 py-2 bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg cursor-not-allowed "
              >
                Acknowledge Alert (Disabled)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
