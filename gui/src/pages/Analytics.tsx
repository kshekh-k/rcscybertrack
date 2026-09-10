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
import { TelemetryUnavailable } from '../components/cyber/TelemetryUnavailable'

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'interfaces' | 'throughput' | 'packets' | 'sessions' | 'sources' | 'destinations'
  >('overview')

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Traffic Analytics & Telemetry</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Real-time network throughput, interface packet rates, session density, and bandwidth talkers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-surface hover:bg-slate-800 text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend Contract Banner */}
      <CapabilityNotice
        moduleName="eBPF / Netflow Telemetry Engine"
        expectedEndpoint="GET /api/v1/analytics/traffic"
        description="The Traffic Analytics UI uses Recharts visualization primitives. Live time-series charts, top-talker IP breakdowns, and active session flow tables will hydrate when backend telemetry streaming is active."
      />

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-1 bg-app-bg rounded-lg overflow-x-auto w-full md:w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="size-4" />
          <span>Traffic Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('interfaces')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'interfaces'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <NetIcon className="size-4" />
          <span>Interfaces</span>
        </button>

        <button
          onClick={() => setActiveTab('throughput')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'throughput'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <ArrowDownUp className="size-4" />
          <span>Throughput</span>
        </button>

        <button
          onClick={() => setActiveTab('packets')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'packets'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Radio className="size-4" />
          <span>Packets</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Activity className="size-4" />
          <span>Active Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'sources'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Users className="size-4" />
          <span>Top Sources</span>
        </button>

        <button
          onClick={() => setActiveTab('destinations')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'destinations'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <HardDrive className="size-4" />
          <span>Top Destinations</span>
        </button>
      </div>

      {/* Recharts Chart Container Template */}
      <div className="bg-surface rounded-xl p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-accent" />
            <h3 className="text-base font-semibold text-text-primary capitalize">
              {activeTab} Telemetry Chart Container
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded ">
            Target Endpoint: GET /api/v1/analytics/{activeTab}
          </span>
        </div>

        {/* Empty Telemetry Stream Callout */}
        <TelemetryUnavailable
          title={`${activeTab.toUpperCase()} Telemetry Feed Offline`}
          description="Real-time network traffic throughput, eBPF socket tracing, and Netflow sampling require active backend telemetry streaming."
          endpoint={`GET /api/v1/analytics/${activeTab}`}
        />

        {/* Prepared Responsive Recharts Primitive */}
        <div className="h-48 opacity-30 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="timestamp" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Area type="monotone" dataKey="bytes_in" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
