import { useState, useMemo } from 'react'
import {
  Globe,
  Network,
  RefreshCw,
  Sliders,
  Activity,
  AlertTriangle,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { WanLink } from '../types/apiContracts'

// Conceptual WAN Link representations
const CONCEPTUAL_WAN_LINKS: WanLink[] = [
  {
    id: 'wan-01',
    name: 'WAN1 (Primary Fiber)',
    interface: 'eth0',
    provider: 'Enterprise Fiber ISP',
    bandwidth_down_mbps: 1000,
    bandwidth_up_mbps: 1000,
    status: 'standby',
  },
  {
    id: 'wan-02',
    name: 'WAN2 (Secondary Broadband)',
    interface: 'eth1',
    provider: 'Commercial Cable ISP',
    bandwidth_down_mbps: 500,
    bandwidth_up_mbps: 50,
    status: 'standby',
  },
  {
    id: 'wan-03',
    name: 'WAN3 (5G Backup)',
    interface: 'eth2',
    provider: 'Cellular 5G NR',
    bandwidth_down_mbps: 100,
    bandwidth_up_mbps: 20,
    status: 'standby',
  },
]

export default function Sdwan() {
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'policies' | 'health' | 'events'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const filteredLinks = useMemo(() => {
    return CONCEPTUAL_WAN_LINKS.filter((l) => {
      const q = searchQuery.toLowerCase()
      return (
        l.name.toLowerCase().includes(q) ||
        l.interface.toLowerCase().includes(q) ||
        l.provider.toLowerCase().includes(q)
      )
    })
  }, [searchQuery])

  const totalPages = Math.ceil(filteredLinks.length / pageSize) || 1

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLinks.slice(start, start + pageSize)
  }, [filteredLinks, currentPage, pageSize])

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={Globe}
        title="Software-Defined WAN (SD-WAN)"
        description="Multi-WAN link balancing, dynamic traffic steering, SLA monitoring, and automated failover orchestration"
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
        moduleName="SD-WAN Link Monitor & Steering Engine"
        expectedEndpoint="GET /api/v1/sdwan/links"
        description="The SD-WAN orchestrator console is configured. Real-time latency, jitter, packet loss telemetry, and dynamic path selection will become active when the backend SD-WAN daemon starts."
      />

      {/* Conceptual WAN Link Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CONCEPTUAL_WAN_LINKS.map((link) => (
          <Card
            key={link.id}
            className="p-4 space-y-3 relative overflow-hidden shadow-lg border-0 "
          >
            <div className="flex flex-wrap gap-1 items-center justify-between">
              <div className="flex items-center gap-2.5">

                <Network className="size-6 shrink-0 text-cyan-500 dark:text-cyan-400" strokeWidth={1.5} />

                <div>
                  <h3 className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-50">{link.name}</h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">{link.interface} • {link.provider}</p>
                </div>
              </div>
              <Badge variant="neutral" size="sm" dot className="uppercase font-bold text-3xs">
                Standby
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-3 rounded">
              <div>
                <span className="text-3xs text-slate-500 dark:text-slate-400 block uppercase">Bandwidth (Down)</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{link.bandwidth_down_mbps} Mbps</span>
              </div>
              <div>
                <span className="text-3xs text-slate-500 dark:text-slate-400 block uppercase">Bandwidth (Up)</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{link.bandwidth_up_mbps} Mbps</span>
              </div>
            </div>

            <div className="text-2xs text-slate-500 dark:text-slate-400 flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2">
              <span>SLA Health Telemetry:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">Backend Stream Offline</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="bg-(--topbar-bg) rounded p-4 shadow-lg flex  items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter WAN links, steering policies, interfaces..."
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />

        {/* Action Button */}
        <Button
          variant="primary"
          size="sm"
          disabled
          className="gap-1.5 cursor-not-allowed opacity-75 shrink-0 relative"
        >
          <Plus className="size-3.5" />
          <span className='hidden sm:inline-block'>Add Steering Policy</span>
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 pb-3 overflow-x-auto on-hover-scroll max-w-full md:w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'links', label: 'WAN Links (3)', icon: Globe },
          { id: 'policies', label: 'Steering Policies', icon: Sliders },
          { id: 'health', label: 'SLA Health', icon: Activity },
          { id: 'events', label: 'Failover Events', icon: AlertTriangle },
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
            <Globe className="size-5 text-blue-600" />
            <span>SD-WAN Traffic Path Control</span>
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
          <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
            <table className="text-left border-collapse table-auto w-max min-w-full">
              <thead>
                <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">Link ID / Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Interface</th>
                  <th className="px-4 py-3 whitespace-nowrap">Provider</th>
                  <th className="px-4 py-3 whitespace-nowrap">Bandwidth (Down/Up)</th>
                  <th className="px-4 py-3 whitespace-nowrap">SLA Telemetry</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {paginatedLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-50">
                      {link.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-600 dark:text-cyan-300">
                      <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                        {link.interface}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {link.provider}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {link.bandwidth_down_mbps} / {link.bandwidth_up_mbps} Mbps
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400 text-2xs">
                      Backend Offline
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm" dot className="uppercase font-bold text-3xs">
                        Standby
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
        </CardContent>

        {filteredLinks.length > 0 && (
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
                  {Math.min(currentPage * pageSize, filteredLinks.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredLinks.length}
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
