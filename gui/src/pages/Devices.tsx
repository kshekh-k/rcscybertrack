import { useState } from 'react'
import {
  MonitorSmartphone,
  Search,
  RefreshCw,
  Filter,
  Tag,
  Clock,
  Laptop,
  Server as ServerIcon,
  Shield,
  Wifi,
  HardDrive,
  Cpu,
} from 'lucide-react'
import { useDevices } from '../features/devices/useDevices'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { EmptyState } from '../components/cyber/EmptyState'
import { ErrorState } from '../components/cyber/ErrorState'
import { TableSkeleton } from '../components/cyber/LoadingState'
import { Device } from '../lib/api'

export default function Devices() {
  const { data: devices = [], isLoading, error, refetch } = useDevices()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'degraded'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Device type icon mapping
  const getDeviceIcon = (type: Device['device_type']) => {
    switch (type) {
      case 'router':
      case 'switch':
        return <HardDrive className="w-4 h-4 text-cyan-400" />
      case 'firewall':
        return <Shield className="w-4 h-4 text-primary" />
      case 'ap':
        return <Wifi className="w-4 h-4 text-emerald-400" />
      case 'server':
        return <ServerIcon className="w-4 h-4 text-indigo-400" />
      case 'client':
        return <Laptop className="w-4 h-4 text-amber-400" />
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />
    }
  }

  // Client-side filtering
  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      dev.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.mac_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.operating_system && dev.operating_system.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter
    const matchesType = typeFilter === 'all' || dev.device_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Summary counts
  const totalCount = devices.length
  const onlineCount = devices.filter((d) => d.status === 'online').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length
  const degradedCount = devices.filter((d) => d.status === 'degraded').length

  return (
    <div className="space-y-6 pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Connected Devices</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Real-time host inventory, hardware types, IP allocations, and reachability state
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-surface hover:bg-slate-800 border border-border-subtle text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Refresh device inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <ErrorState
          title="Device Registry Error"
          message={error.message || 'Unable to fetch connected devices from CyberTrack Core.'}
          onRetry={handleRefresh}
        />
      )}

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Discovered</p>
            <p className="text-xl font-bold font-mono text-text-primary mt-1">{totalCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <MonitorSmartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Online Hosts</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{onlineCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block animate-pulse" />
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">Offline Hosts</p>
            <p className="text-xl font-bold font-mono text-rose-400 mt-1">{offlineCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Degraded Hosts</p>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1">{degradedCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hostnames, IP, MAC address, OS..."
            className="w-full bg-app-bg border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-app-bg border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="degraded">Degraded</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-app-bg border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Types</option>
              <option value="router">Router</option>
              <option value="switch">Switch</option>
              <option value="firewall">Firewall</option>
              <option value="ap">Access Point</option>
              <option value="server">Server</option>
              <option value="client">Client</option>
              <option value="iot">IoT Device</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <MonitorSmartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Device Inventory</h2>
              <p className="text-xs text-text-muted">
                Showing {filteredDevices.length} of {devices.length} registered network devices
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} />
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No Devices Found"
                description={
                  searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No devices match your selected search or filter criteria.'
                    : 'No connected devices detected on local subnets.'
                }
                icon={<MonitorSmartphone className="w-6 h-6 text-slate-500" />}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-app-bg/80 border-b border-border-subtle text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-6">Hostname</th>
                  <th className="py-3.5 px-6">IP Address</th>
                  <th className="py-3.5 px-6">MAC Address</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Operating System</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Last Seen</th>
                  <th className="py-3.5 px-6">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60 text-xs">
                {filteredDevices.map((dev) => {
                  const statusVariant =
                    dev.status === 'online'
                      ? 'success'
                      : dev.status === 'degraded'
                      ? 'warning'
                      : 'danger'

                  const formattedLastSeen = dev.last_seen
                    ? new Date(dev.last_seen).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'

                  return (
                    <tr
                      key={dev.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Hostname */}
                      <td className="py-4 px-6 font-semibold text-text-primary">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-800 rounded border border-slate-700">
                            {getDeviceIcon(dev.device_type)}
                          </div>
                          <span>{dev.hostname}</span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-4 px-6 font-mono font-medium text-cyan-400">
                        {dev.ip_address}
                      </td>

                      {/* MAC Address */}
                      <td className="py-4 px-6 font-mono text-text-secondary">
                        {dev.mac_address}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-6">
                        <span className="capitalize font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {dev.device_type}
                        </span>
                      </td>

                      {/* Operating System */}
                      <td className="py-4 px-6 text-text-secondary">
                        {dev.operating_system || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={dev.status} variant={statusVariant} />
                      </td>

                      {/* Last Seen */}
                      <td className="py-4 px-6 font-mono text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formattedLastSeen}</span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="py-4 px-6">
                        {dev.tags && dev.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {dev.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[10px] bg-slate-800/90 text-slate-300 border border-slate-700/80 px-1.5 py-0.2 rounded"
                              >
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
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
