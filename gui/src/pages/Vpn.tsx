import { useState } from 'react'
import {
  LockKeyhole,
  RefreshCw,
  Plus,
  Shield,
  Activity,
  Layers,
  FileText,
  Radio,
} from 'lucide-react'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { EmptyState } from '../components/cyber/EmptyState'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { VpnConnection, VpnPeer } from '../types/apiContracts'

export default function Vpn() {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'peers' | 'config' | 'logs'>('overview')
  const [connections] = useState<VpnConnection[]>([]) // Backend service not yet active
  const [peers] = useState<VpnPeer[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="space-y-6 pb-8">
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
        moduleName="VPN Subsystem Daemon"
        expectedEndpoint="GET /api/v1/vpn/connections"
        description="The VPN management interface is fully rendered. IPSec and WireGuard daemon controllers will bind to this console when the VPN backend module is enabled."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Active Tunnels</p>
            <p className="text-xl font-bold font-mono text-text-primary mt-1">0</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 ">
            <LockKeyhole className="size-5" />
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Tunnels UP</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">0</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 ">
            <span className="size-2.5 rounded-full bg-emerald-400 block" />
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Configured Peers</p>
            <p className="text-xl font-bold font-mono text-text-primary mt-1">{peers.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300 ">
            <Radio className="size-5" />
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Encryption Mode</p>
            <p className="text-sm font-bold font-mono text-cyan-400 mt-1 uppercase">AES-256-GCM / Chacha20</p>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 ">
            <Shield className="size-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
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
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'connections'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <LockKeyhole className="size-4" />
          <span>Connections ({connections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('peers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'peers'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Radio className="size-4" />
          <span>Peers ({peers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Layers className="size-4" />
          <span>Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <FileText className="size-4" />
          <span>Daemon Logs</span>
        </button>
      </div>

      {/* Main Console Box */}
      <div className="bg-surface rounded-xl overflow-hidden shadow-lg p-6">
        {connections.length === 0 ? (
          <EmptyState
            title="No Active VPN Connections"
            description="The VPN daemon service (`GET /api/v1/vpn/connections`) is not currently active on this CyberTrack Core instance."
            icon={<LockKeyhole className="size-6 text-slate-500" />}
            action={
              <button
                disabled
                className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="size-3.5" />
                <span>Provision VPN Tunnel (Backend Required)</span>
              </button>
            }
          />
        ) : (
          <div className="text-xs text-text-secondary">
            {/* Tunnel Table placeholder when connections exist */}
          </div>
        )}
      </div>
    </div>
  )
}
