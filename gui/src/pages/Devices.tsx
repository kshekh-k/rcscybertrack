import { useState, useMemo } from 'react'
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
  ShieldAlert,
  Wifi,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { useDevices } from '../features/devices/useDevices'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { MetricCard } from '../components/cyber/MetricCard'
import { EmptyState } from '../components/cyber/EmptyState'
import { ErrorState } from '../components/cyber/ErrorState'
import { TableSkeleton } from '../components/cyber/LoadingState'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Device } from '../lib/api'

export default function Devices() {
  const { data: devices = [], isLoading, error, refetch } = useDevices()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'degraded'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

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
        return <HardDrive className="size-4 text-cyan-500" />
      case 'firewall':
        return <Shield className="size-4 text-blue-500" />
      case 'ap':
        return <Wifi className="size-4 text-emerald-500" />
      case 'server':
        return <ServerIcon className="size-4 text-indigo-500" />
      case 'client':
        return <Laptop className="size-4 text-amber-500" />
      default:
        return <Cpu className="size-4 text-slate-400" />
    }
  }

  // Client-side filtering
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      const matchesSearch =
        dev.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.mac_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dev.operating_system && dev.operating_system.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || dev.status === statusFilter
      const matchesType = typeFilter === 'all' || dev.device_type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [devices, searchQuery, statusFilter, typeFilter])

  // Summary counts
  const totalCount = devices.length
  const onlineCount = devices.filter((d) => d.status === 'online').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length
  const degradedCount = devices.filter((d) => d.status === 'degraded').length

  const totalPages = Math.ceil(filteredDevices.length / pageSize) || 1

  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDevices.slice(start, start + pageSize)
  }, [filteredDevices, currentPage, pageSize])

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={MonitorSmartphone}
        title="Connected Devices"
        description="Real-time host inventory, hardware types, IP allocations, and reachability state"
        actions={
          <Button
            variant="default"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh device inventory"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      {/* Backend Contract Banner */}
      <CapabilityNotice
        moduleName="Host Discovery & Device Inventory Service"
        expectedEndpoint="GET /api/v1/devices"
        description="Real-time ARP scanning, DHCP lease discovery, and reachability ping probes track connected hosts across active local network segments."
      />

      {/* Error Callout */}
      {error && (
        <ErrorState
          title="Device Registry Error"
          message={error.message || 'Unable to fetch connected devices from CyberTrack Core.'}
          onRetry={handleRefresh}
        />
      )}

      {/* Summary KPI Breakdown Cards */}
      <div className="max-w-full overflow-x-auto on-hover-scroll pt-2 pb-3 -mt-2">
        <div className="flex gap-3 w-full">
          {[
            {
              title: 'Total Discovered',
              value: totalCount,
              icon: MonitorSmartphone,
              subtitle: 'Discovered network hosts',
              className: 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/20 min-w-64',
            },
            {
              title: 'Online Hosts',
              value: onlineCount,
              icon: Activity,
              subtitle: 'Active ARP / ping response',
              className: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 min-w-64',
            },
            {
              title: 'Offline Hosts',
              value: offlineCount,
              icon: ShieldAlert,
              subtitle: 'Unreachable endpoints',
              className: 'bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-rose-500/20 min-w-64',
            },
            {
              title: 'Degraded Hosts',
              value: degradedCount,
              icon: AlertTriangle,
              subtitle: 'High latency / packet loss',
              className: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 min-w-64',
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
      <div className="bg-(--topbar-bg) rounded -mt-3 p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hostnames, IP, MAC address, OS..."
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="degraded">Degraded</option>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted font-medium">Type:</span>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Types</option>
              <option value="router">Router</option>
              <option value="switch">Switch</option>
              <option value="firewall">Firewall</option>
              <option value="ap">Access Point</option>
              <option value="server">Server</option>
              <option value="endpoint">Endpoint</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Console Box / Table / Empty State */}
      <Card className="overflow-hidden shadow-lg border-0 block! -mt-3!">
        <CardHeader className="flex flex-wrap gap-1 flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
          <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MonitorSmartphone className="size-5 text-blue-600" />
            <span>Host Discovery & Device Inventory</span>
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
              <span>Refresh Registry</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden block!">
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
                icon={<MonitorSmartphone className="size-6 text-slate-500" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
              <table className="text-left border-collapse table-auto w-max min-w-full">
                <thead>
                  <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3 whitespace-nowrap">Hostname</th>
                    <th className="px-4 py-3 whitespace-nowrap">IP Address</th>
                    <th className="px-4 py-3 whitespace-nowrap">MAC Address</th>
                    <th className="px-4 py-3 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 whitespace-nowrap">Operating System</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap">Last Seen</th>
                    <th className="px-4 py-3 whitespace-nowrap">Tags</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {paginatedDevices.map((dev) => {
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
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                      >
                        {/* Hostname */}
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded">
                              {getDeviceIcon(dev.device_type)}
                            </div>
                            <span>{dev.hostname}</span>
                          </div>
                        </td>

                        {/* IP Address */}
                        <td className="px-4 py-3 font-mono font-medium text-cyan-600 dark:text-cyan-400">
                          {dev.ip_address}
                        </td>

                        {/* MAC Address */}
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {dev.mac_address}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <Badge variant="secondary" size="sm" className="capitalize font-mono text-3xs">
                            {dev.device_type}
                          </Badge>
                        </td>

                        {/* Operating System */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {dev.operating_system || '—'}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge
                            variant={statusVariant}
                            size="sm"
                            className="uppercase font-bold text-3xs"
                          >
                            {dev.status}
                          </Badge>
                        </td>

                        {/* Last Seen */}
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-slate-400" />
                            <span>{formattedLastSeen}</span>
                          </div>
                        </td>

                        {/* Tags */}
                        <td className="px-4 py-3">
                          {dev.tags && dev.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {dev.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  size="sm"
                                  className="text-4xs"
                                >
                                  <Tag className="size-2.5 text-slate-400 mr-0.5" />
                                  <span>{tag}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1.5 font-mono cursor-pointer"
                          >
                            <span>View</span>
                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {filteredDevices.length > 0 && (
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
                  {Math.min(currentPage * pageSize, filteredDevices.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredDevices.length}
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
