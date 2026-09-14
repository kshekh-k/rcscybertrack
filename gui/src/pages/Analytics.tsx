import { useState } from 'react'
import {
  Activity,
  RefreshCw,
  BarChart3,
  Network as NetIcon,
  ArrowDownUp,
  Radio,
  Users,
  HardDrive,
  Terminal,
  ChartNoAxesCombined,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { Badge } from '../components/ui/badge'
import { TelemetryUnavailable } from '../components/cyber/TelemetryUnavailable'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Card } from '../components/ui/card'

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'interfaces' | 'throughput' | 'packets' | 'sessions' | 'sources' | 'destinations'
  >('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const telemetryData: Array<{ timestamp: string; bytes_in: number; bytes_out: number }> = []
  const hasTelemetryData = telemetryData.length > 0

  return (
    <div className="space-y-6">
      {/* Header section */}
      <PageHeader
        icon={TrendingUp}
        title="Traffic Analytics & Telemetry"
        description="Real-time network throughput, interface packet rates, session density, and bandwidth talkers"
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
        moduleName="eBPF / Netflow Telemetry Engine"
        expectedEndpoint="GET /api/v1/analytics/traffic"
        description="The Traffic Analytics UI uses Recharts visualization primitives. Live time-series charts, top-talker IP breakdowns, and active session flow tables will hydrate when backend telemetry streaming is active."
      />

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 pb-3 overflow-x-auto on-hover-scroll max-w-full md:w-fit">
        {[
          { id: 'overview', label: 'Traffic Overview', icon: BarChart3 },
          { id: 'interfaces', label: 'Interfaces', icon: NetIcon },
          { id: 'throughput', label: 'Throughput', icon: ArrowDownUp },
          { id: 'packets', label: 'Packets', icon: Radio },
          { id: 'sessions', label: 'Active Sessions', icon: Activity },
          { id: 'sources', label: 'Top Sources', icon: Users },
          { id: 'destinations', label: 'Top Destinations', icon: HardDrive },
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

      {/* Recharts Chart Container Template */}
      <Card className="p-4 space-y-4 -mt-3">
        <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
            <div className="flex flex-col">
              <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 capitalize">
                {activeTab} Telemetry Chart Container
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">Real-Time Inbound & Outbound Bandwidth Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" dot size="sm">
              Target Endpoint: GET /api/v1/analytics/{activeTab}
            </Badge>
          </div>
        </div>

        {/* Telemetry Stream Display (Conditional) */}
        {hasTelemetryData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
                <XAxis dataKey="timestamp" stroke="var(--color-slate-500)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--color-slate-500)" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="bytes_in" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <TelemetryUnavailable
            title={`${activeTab.toUpperCase()} Telemetry Feed Offline`}
            description="Real-time network traffic throughput, eBPF socket tracing, and Netflow sampling require active backend telemetry streaming."
            endpoint={`GET /api/v1/analytics/${activeTab}`}
          />
        )}
      </Card>
    </div>
  )
}
