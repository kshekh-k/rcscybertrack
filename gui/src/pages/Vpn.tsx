import { useState, useMemo } from 'react'
import {
  LockKeyhole,
  RefreshCw,
  Plus,
  Shield,
  ShieldCheck,
  Activity,
  Layers,
  FileText,
  Radio,
  Search,
  Terminal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { MetricCard } from '../components/cyber/MetricCard'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { VpnConnection, VpnPeer } from '../types/apiContracts'

export default function Vpn() {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'peers' | 'config' | 'logs'>('overview')
  const [connections] = useState<VpnConnection[]>([]) // Backend service not yet active
  const [peers] = useState<VpnPeer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const counts = useMemo(() => ({
    total: connections.length,
    up: connections.filter((c) => c.status === 'up').length,
    peersCount: peers.length,
  }), [connections, peers])

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      const q = searchQuery.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.remote_endpoint.toLowerCase().includes(q) ||
        (c.assigned_ip && c.assigned_ip.toLowerCase().includes(q))
      )
    })
  }, [connections, searchQuery])

  const totalPages = Math.ceil(filteredConnections.length / pageSize) || 1

  const paginatedConnections = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredConnections.slice(start, start + pageSize)
  }, [filteredConnections, currentPage, pageSize])

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={Shield}
        title="Virtual Private Network (VPN)"
        description="IPsec, WireGuard, and OpenVPN tunnel orchestration, remote site connectivity, and peer encryption"
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
        moduleName="VPN Subsystem & Tunnel Daemon"
        expectedEndpoint="GET /api/v1/vpn/connections"
        description="The VPN management interface is initialized. IPsec, WireGuard, and OpenVPN daemon controllers will bind to this console when the VPN backend module is enabled."
      />

      {/* Summary KPI Breakdown Cards */}
      <div className="max-w-full overflow-x-auto on-hover-scroll pt-2 pb-3 -mt-2">
        <div className="flex gap-3 w-full">
          {[
            {
              title: 'Active Tunnels',
              value: counts.total,
              icon: LockKeyhole,
              subtitle: 'Configured tunnel interfaces',
              className: 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/20 min-w-64',
            },
            {
              title: 'Tunnels UP',
              value: counts.up,
              icon: ShieldCheck,
              subtitle: 'Active encrypted sessions',
              className: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 min-w-64',
            },
            {
              title: 'Configured Peers',
              value: counts.peersCount,
              icon: Radio,
              subtitle: 'Registered peer keys',
              className: 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/20 min-w-64',
            },
            {
              title: 'Encryption Engine',
              value: 'AES-256',
              icon: Shield,
              subtitle: 'GCM & ChaCha20 Poly1305',
              className: 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md shadow-purple-500/20 min-w-64',
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
      <div className="bg-(--topbar-bg) -mt-3 rounded p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search connection name, remote IP, type..."
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />

        {/* Action Button */}
        <Button
          variant="primary"
          size="sm"
          disabled
          className="gap-1.5 cursor-not-allowed opacity-75 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Provision VPN Tunnel</span>
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 pb-3 overflow-x-auto on-hover-scroll max-w-full md:w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'connections', label: `Connections (${connections.length})`, icon: LockKeyhole },
          { id: 'peers', label: `Peers (${peers.length})`, icon: Radio },
          { id: 'config', label: 'Configuration', icon: Layers },
          { id: 'logs', label: 'Daemon Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'primary' : 'ghost'}
              size="lg"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="whitespace-nowrap gap-2 shadow-md bg-(--topbar-bg) hover:bg-blue-500 hover:text-white"
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Main Console Box / Table / Empty State */}
      <Card className="overflow-hidden shadow-lg border-0 block! -mt-3!">
        <CardHeader className="flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
          <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <LockKeyhole className="size-5 text-blue-600" />
            <span>VPN Tunnel Operations Stream</span>
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
          {filteredConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <LockKeyhole className="size-10 text-amber-500 mb-2" />
              <span className="text-sm text-slate-900 dark:text-slate-50 font-semibold">No active VPN connections</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
                The backend VPN service (`GET /api/v1/vpn/connections`) is not yet connected to stream live tunnel configurations. No active connections or peers found.
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mt-4 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md font-mono text-2xs">
                <Terminal className="size-3.5 text-cyan-500" />
                <span>Target Endpoint: GET /api/v1/vpn/connections</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
              <table className="text-left border-collapse table-auto w-max min-w-full">
                <thead>
                  <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3 whitespace-nowrap">Tunnel ID / Name</th>
                    <th className="px-4 py-3 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 whitespace-nowrap">Local Endpoint</th>
                    <th className="px-4 py-3 whitespace-nowrap">Remote Endpoint</th>
                    <th className="px-4 py-3 whitespace-nowrap">Assigned IP</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {paginatedConnections.map((conn) => (
                    <tr
                      key={conn.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-50">
                        {conn.name || conn.id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info" size="sm" className="uppercase font-bold text-3xs">
                          {conn.type || 'IPsec'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {conn.local_endpoint || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-600 dark:text-cyan-400">
                        {conn.remote_endpoint || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {conn.assigned_ip || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={conn.status === 'up' ? 'success' : 'neutral'}
                          size="sm"
                          className="uppercase font-bold text-3xs"
                        >
                          {conn.status || 'down'}
                        </Badge>
                      </td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {filteredConnections.length > 0 && (
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
                  {Math.min(currentPage * pageSize, filteredConnections.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredConnections.length}
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
