import { useState } from 'react'
import {
  Network as NetIcon,
  Route as RouteIcon,
  RefreshCw,
  Server,
  Layers,
  ArrowUpDown,
  Search,
  Terminal,
} from 'lucide-react'
import { useNetworkInterfaces, useNetworkRoutes } from '../features/network/useNetworkData'
import { EmptyState } from '../components/cyber/EmptyState'
import { ErrorState } from '../components/cyber/ErrorState'
import { TableSkeleton } from '../components/cyber/LoadingState'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Alert } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'

export default function Network() {
  const [activeTab, setActiveTab] = useState<'interfaces' | 'routes'>('interfaces')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: interfaces = [],
    isLoading: isInterfacesLoading,
    error: interfacesError,
    refetch: refetchInterfaces,
  } = useNetworkInterfaces()

  const {
    data: routes = [],
    isLoading: isRoutesLoading,
    error: routesError,
    refetch: refetchRoutes,
  } = useNetworkRoutes()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    if (activeTab === 'interfaces') {
      await refetchInterfaces()
    } else {
      await refetchRoutes()
    }
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Filter interfaces based on search
  const filteredInterfaces = interfaces.filter(
    (iface) =>
      iface.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.ipv4?.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter routes based on search
  const filteredRoutes = routes.filter(
    (rt) =>
      rt.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rt.gateway.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rt.interface.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={NetIcon}
        title="Network Visibility"
        description="Inspect network interfaces, link states, and static routing table configurations"
        actions={
          <Button
            variant="default"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh network data"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      {/* Subsystem Status Banner */}
      <Alert
        variant="info"
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>Kernel & Network Interface Subsystem Notice</span>
            <span className="text-3xs uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
              System Active
            </span>
          </div>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <p className="text-xs leading-relaxed text-blue-100 max-w-2xl">
            Real-time interface state monitoring, IP address bindings, and Linux kernel static routing tables are synchronized with the host subsystem.
          </p>
          <div className="flex flex-wrap items-center gap-2 font-mono text-2xs bg-black/20 px-3 py-1.5 rounded shrink-0">
            <Terminal className="size-3.5 text-cyan-300 shrink-0" />
            <span className="text-blue-100">Target Endpoint:</span>
            <span className="text-cyan-400 font-semibold">GET /api/v1/network/{activeTab}</span>
          </div>
        </div>
      </Alert>

      {/* Error Callout */}
      {(interfacesError || routesError) && (
        <ErrorState
          title="Network Subsystem Error"
          message={interfacesError?.message || routesError?.message || 'Unable to fetch network data.'}
          onRetry={handleRefresh}
        />
      )}

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 pb-3 overflow-x-auto on-hover-scroll max-w-full md:w-fit">
        {[
          { id: 'interfaces', label: `Interfaces (${interfaces.length})`, icon: NetIcon },
          { id: 'routes', label: `Routing Table (${routes.length})`, icon: RouteIcon },
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

      {/* Controls Bar */}
      <div className="bg-(--topbar-bg) -mt-3 rounded p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'interfaces'
              ? 'Filter interfaces or IPs...'
              : 'Filter destinations or gateways...'
          }
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />
      </div>

      {/* TAB 1: INTERFACES */}
      {activeTab === 'interfaces' && (
        <Card className="overflow-hidden shadow-lg border-0 block! -mt-3">
          <CardHeader className="flex gap-1 flex-wrap flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
            <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Server className="size-5 text-blue-600" />
              <span>Physical & Virtual Interfaces</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm" className="font-mono text-3xs uppercase">
                Read-Only
              </Badge>
              <Badge variant="default" dot size="sm">
                GET /api/v1/network/interfaces
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden block!">
            {isInterfacesLoading ? (
              <div className="p-6">
                <TableSkeleton rows={4} />
              </div>
            ) : filteredInterfaces.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No Network Interfaces Found"
                  description={
                    searchQuery
                      ? `No interfaces matching "${searchQuery}".`
                      : 'No network interface configurations returned by CyberTrack Core.'
                  }
                  icon={<NetIcon className="size-6 text-slate-500" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
                <table className="text-left border-collapse table-auto w-max min-w-full">
                  <thead>
                    <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3 whitespace-nowrap">Interface</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">IPv4 Address</th>
                      <th className="px-4 py-3 whitespace-nowrap">Prefix</th>
                      <th className="px-4 py-3 whitespace-nowrap">IP Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {filteredInterfaces.map((iface) => {
                      const isEnabled = iface.enabled
                      const ipAddress = iface.ipv4?.address || 'Unassigned'
                      const prefix =
                        iface.ipv4?.prefix !== null && iface.ipv4?.prefix !== undefined
                          ? `/${iface.ipv4.prefix}`
                          : '—'
                      const mode = iface.ipv4?.dhcp ? 'DHCP' : 'Static'

                      return (
                        <tr
                          key={iface.name}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                        >
                          {/* Interface Name */}
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-50">
                            <span className="bg-slate-100 dark:bg-slate-800/80 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded font-mono">
                              {iface.name}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <Badge
                              variant={isEnabled ? 'success' : 'neutral'}
                              size="sm"
                              className="uppercase font-bold text-3xs"
                            >
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </td>

                          {/* IPv4 Address */}
                          <td className="px-4 py-3 font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                            {ipAddress}
                          </td>

                          {/* Prefix */}
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {prefix}
                          </td>

                          {/* IP Mode */}
                          <td className="px-4 py-3">
                            <Badge
                              variant={iface.ipv4?.dhcp ? 'info' : 'secondary'}
                              size="sm"
                              className="font-mono text-3xs"
                            >
                              {mode}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ROUTES */}
      {activeTab === 'routes' && (
        <Card className="overflow-hidden shadow-lg border-0 block! -mt-3">
          <CardHeader className="flex gap-1 flex-row flex-wrap items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
            <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Layers className="size-5 text-blue-600" />
              <span>Kernel Routing Table</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm" className="font-mono text-3xs uppercase">
                Read-Only
              </Badge>
              <Badge variant="default" dot size="sm">
                GET /api/v1/network/routes
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-hidden block!">
            {isRoutesLoading ? (
              <div className="p-6">
                <TableSkeleton rows={4} />
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No Static Routes Configured"
                  description={
                    searchQuery
                      ? `No routes matching "${searchQuery}".`
                      : 'No kernel routing entries returned by CyberTrack Core.'
                  }
                  icon={<RouteIcon className="size-6 text-slate-500" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
                <table className="text-left border-collapse table-auto w-max min-w-full">
                  <thead>
                    <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3 whitespace-nowrap">Destination (CIDR)</th>
                      <th className="px-4 py-3 whitespace-nowrap">Gateway</th>
                      <th className="px-4 py-3 whitespace-nowrap">Interface</th>
                      <th className="px-4 py-3 whitespace-nowrap">Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {filteredRoutes.map((rt, idx) => {
                      const isDefaultRoute = rt.destination === '0.0.0.0/0' || rt.destination === 'default'

                      return (
                        <tr
                          key={`${rt.destination}-${rt.gateway}-${idx}`}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                        >
                          {/* Destination */}
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-50">
                            <div className="flex items-center gap-2">
                              <span>{rt.destination}</span>
                              {isDefaultRoute && (
                                <Badge variant="warning" size="sm" className="text-4xs uppercase">
                                  Default Gateway
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Gateway */}
                          <td className="px-4 py-3 font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                            {rt.gateway}
                          </td>

                          {/* Interface */}
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-300 font-mono">
                              {rt.interface}
                            </span>
                          </td>

                          {/* Metric */}
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <ArrowUpDown className="size-3 text-slate-500" />
                              <span>{rt.metric !== null && rt.metric !== undefined ? rt.metric : '0'}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
