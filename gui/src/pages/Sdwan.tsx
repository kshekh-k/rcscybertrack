import { useState } from 'react'
import {
  Globe,
  RefreshCw,
  Sliders,
  Activity,
  AlertTriangle,
} from 'lucide-react'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
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
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="space-y-6 pb-8">
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
          <div
            key={link.id}
            className="bg-surface rounded-xl p-5 shadow-lg space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 ">
                  <Globe className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{link.name}</h3>
                  <p className="text-2xs font-mono text-text-muted">{link.interface} • {link.provider}</p>
                </div>
              </div>
              <StatusBadge status="Standby / Ready" variant="neutral" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-app-bg/60 p-3 rounded-lg /80">
              <div>
                <span className="text-3xs text-text-muted block uppercase">Bandwidth (Down)</span>
                <span className="text-text-primary font-semibold">{link.bandwidth_down_mbps} Mbps</span>
              </div>
              <div>
                <span className="text-3xs text-text-muted block uppercase">Bandwidth (Up)</span>
                <span className="text-text-primary font-semibold">{link.bandwidth_up_mbps} Mbps</span>
              </div>
            </div>

            <div className="text-2xs text-text-muted flex justify-between items-center border-t border-slate-800/80 pt-2">
              <span>SLA Health Telemetry:</span>
              <span className="font-mono text-amber-400">Backend Stream Offline</span>
            </div>
          </div>
        ))}
      </div>

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
          <Activity className="size-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'links'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Globe className="size-4" />
          <span>WAN Links (3)</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'policies'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="size-4" />
          <span>Steering Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'health'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Activity className="size-4" />
          <span>SLA Health</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="size-4" />
          <span>Failover Events</span>
        </button>
      </div>

      {/* Main Console Box */}
      <div className="bg-surface rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-semibold text-text-primary">SD-WAN Traffic Path Control</h3>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded ">
            Target Endpoint: GET /api/v1/sdwan/policies
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Dynamic path selection and latency-based traffic routing will route high-priority application flows across WAN1, WAN2, and WAN3 automatically based on real-time link health.
        </p>

        <div className="p-4 bg-app-bg rounded-lg text-center text-xs text-text-muted font-mono">
          SD-WAN Link Steering Engine is in Standby Mode. Connect backend daemon to view live SLA path telemetry.
        </div>
      </div>
    </div>
  )
}
