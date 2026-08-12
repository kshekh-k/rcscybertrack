import { useState } from 'react'
import {
  Network as NetIcon,
  Route as RouteIcon,
  RefreshCw,
  Server,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react'
import { useNetworkInterfaces, useNetworkRoutes } from '../features/network/useNetworkData'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { EmptyState } from '../components/cyber/EmptyState'
import { ErrorState } from '../components/cyber/ErrorState'
import { TableSkeleton } from '../components/cyber/LoadingState'

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
    <div className="space-y-6 pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Network Visibility</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Inspect network interfaces, link states, and static routing table configurations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-surface hover:bg-slate-800 border border-border-subtle text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Refresh network data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {(interfacesError || routesError) && (
        <ErrorState
          title="Network Subsystem Error"
          message={interfacesError?.message || routesError?.message || 'Unable to fetch network data.'}
          onRetry={handleRefresh}
        />
      )}

      {/* Tabs & Controls Bar */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-app-bg border border-border-subtle rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'interfaces'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
            }`}
          >
            <NetIcon className="w-4 h-4" />
            <span>Interfaces ({interfaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'routes'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
            }`}
          >
            <RouteIcon className="w-4 h-4" />
            <span>Routing Table ({routes.length})</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'interfaces'
                ? 'Filter interfaces or IPs...'
                : 'Filter destinations or gateways...'
            }
            className="w-full bg-app-bg border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* TAB 1: INTERFACES */}
      {activeTab === 'interfaces' && (
        <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Physical & Virtual Interfaces</h2>
                <p className="text-xs text-text-muted">Network interface binding, IP assignments, and link operational states</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
              Read-Only
            </span>
          </div>

          <div className="overflow-x-auto">
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
                  icon={<NetIcon className="w-6 h-6 text-slate-500" />}
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-bg/80 border-b border-border-subtle text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-6">Interface</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">IPv4 Address</th>
                    <th className="py-3.5 px-6">Prefix</th>
                    <th className="py-3.5 px-6">IP Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60 text-xs">
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
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Interface Name */}
                        <td className="py-4 px-6 font-mono font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                              {iface.name}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <StatusBadge
                            status={isEnabled ? 'Enabled' : 'Disabled'}
                            variant={isEnabled ? 'success' : 'neutral'}
                          />
                        </td>

                        {/* IPv4 Address */}
                        <td className="py-4 px-6 font-mono text-text-primary font-medium">
                          {ipAddress}
                        </td>

                        {/* Prefix */}
                        <td className="py-4 px-6 font-mono text-text-secondary">
                          {prefix}
                        </td>

                        {/* IP Mode */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              iface.ipv4?.dhcp
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {mode}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROUTES */}
      {activeTab === 'routes' && (
        <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Kernel Routing Table</h2>
                <p className="text-xs text-text-muted">Static routes, gateways, metrics, and exit interfaces</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
              Read-Only
            </span>
          </div>

          <div className="overflow-x-auto">
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
                  icon={<RouteIcon className="w-6 h-6 text-slate-500" />}
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-bg/80 border-b border-border-subtle text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-6">Destination (CIDR)</th>
                    <th className="py-3.5 px-6">Gateway</th>
                    <th className="py-3.5 px-6">Interface</th>
                    <th className="py-3.5 px-6">Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60 text-xs">
                  {filteredRoutes.map((rt, idx) => {
                    const isDefaultRoute = rt.destination === '0.0.0.0/0' || rt.destination === 'default'

                    return (
                      <tr
                        key={`${rt.destination}-${rt.gateway}-${idx}`}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Destination */}
                        <td className="py-4 px-6 font-mono font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <span>{rt.destination}</span>
                            {isDefaultRoute && (
                              <span className="text-[10px] font-sans bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-medium">
                                Default Gateway
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Gateway */}
                        <td className="py-4 px-6 font-mono text-cyan-400 font-medium">
                          {rt.gateway}
                        </td>

                        {/* Interface */}
                        <td className="py-4 px-6 font-mono text-text-primary">
                          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                            {rt.interface}
                          </span>
                        </td>

                        {/* Metric */}
                        <td className="py-4 px-6 font-mono text-text-secondary">
                          <div className="flex items-center gap-1">
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            <span>{rt.metric !== null && rt.metric !== undefined ? rt.metric : '0'}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
