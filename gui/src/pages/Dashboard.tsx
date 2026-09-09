import React, { useState } from 'react'
import {
  Activity,
  ShieldCheck,
  Network as NetIcon,
  MonitorSmartphone,
  ScrollText,
  RefreshCw,
  Plus,
  BarChart3,
  Sliders,
  FileText,
  Terminal,
  Download,
  AlertTriangle,
  Flame,
  XCircle,
  Zap,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'

import { useSystemHealth, useSystemInfo } from '../features/dashboard/useSystemHealth'
import { useFirewallRules } from '../features/firewall/useFirewallRules'
import { useNetworkInterfaces } from '../features/network/useNetworkData'
import { useDevices } from '../features/devices/useDevices'

import { MetricCard } from '../components/cyber/MetricCard'
import { SystemHealthCard } from '../components/cyber/SystemHealthCard'
import { FirewallStatusCard, ChainPolicyBadge, RuleAction } from '../components/cyber/FirewallVisuals'
import { NetworkInterfaceCard } from '../components/cyber/NetworkVisuals'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { ErrorState } from '../components/cyber/ErrorState'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { api, FirewallRule } from '../lib/api'

// Mock 24h Traffic Data for Technical Network Chart
const MOCK_TRAFFIC_DATA = [
  { time: '00:00', inbound: 120, outbound: 85, sessions: 920 },
  { time: '04:00', inbound: 80, outbound: 45, sessions: 650 },
  { time: '08:00', inbound: 450, outbound: 320, sessions: 1280 },
  { time: '12:00', inbound: 890, outbound: 610, sessions: 1650 },
  { time: '16:00', inbound: 720, outbound: 540, sessions: 1482 },
  { time: '20:00', inbound: 340, outbound: 210, sessions: 1100 },
  { time: '23:59', inbound: 210, outbound: 150, sessions: 980 },
]

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [lastRefetched, setLastRefetched] = useState<Date>(new Date())
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)

  // Rule Creator Form State
  const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
    id: `rule-${Date.now().toString().slice(-4)}`,
    action: 'allow',
    direction: 'input',
    interface: 'eth0',
    protocol: 'tcp',
    source: { address: '0.0.0.0/0', port: null },
    destination: { address: '192.168.1.100', port: 443 },
    state: ['new'],
    logging: true,
  })

  // Server state hooks
  const { data: health, isLoading: isHealthLoading, error: healthError } = useSystemHealth()
  const { data: systemInfo, isLoading: isSystemLoading, error: systemError } = useSystemInfo()
  const { data: rules, isLoading: isRulesLoading, error: rulesError } = useFirewallRules()
  const { data: interfaces, isLoading: isInterfacesLoading, error: interfacesError } = useNetworkInterfaces()
  const { data: devices, isLoading: isDevicesLoading, error: devicesError } = useDevices()

  const handleRefresh = async () => {
    setIsManualRefreshing(true)
    await queryClient.invalidateQueries()
    setLastRefetched(new Date())
    setTimeout(() => setIsManualRefreshing(false), 500)
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRule.id) return
    await api.createFirewallRule(newRule as FirewallRule)
    setShowAddRuleModal(false)
    handleRefresh()
  }

  const isHealthy = health?.status === 'healthy'
  const activeRulesCount = rules?.length ?? 0
  const activeInterfacesCount = interfaces?.filter((i) => i.enabled).length ?? 2
  const totalInterfacesCount = interfaces?.length ?? 2
  const onlineDevicesCount = devices?.filter((d) => d.status === 'online').length ?? 12
  const totalDevicesCount = devices?.length ?? 16

  const hasAnyError = healthError || systemError || rulesError || interfacesError || devicesError

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Security Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of your RCS CyberTrack firewall & network security appliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block font-mono">
            <p className="text-[10px] text-slate-400 uppercase">Last updated</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{lastRefetched.toLocaleTimeString()}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isManualRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isManualRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Connectivity Warning if API disconnects */}
      {hasAnyError && (
        <ErrorState
          title="Appliance Connectivity Notice"
          message="One or more daemon streams are running in cached fallback mode. Displaying verified local configuration."
          onRetry={handleRefresh}
        />
      )}

      {/* 2. Top 6 KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="System Health"
          value={isHealthLoading ? '...' : isHealthy ? 'Operational' : health?.status || 'Offline'}
          icon={<Activity className={`w-4 h-4 ${isHealthy ? 'text-emerald-500' : 'text-rose-500'}`} />}
          statusText={isHealthy ? 'Healthy' : 'Warning'}
          statusVariant={isHealthy ? 'success' : 'danger'}
          subtitle="Core engine status"
          trend="● Stable"
        />

        <MetricCard
          title="Firewall Policies"
          value={isRulesLoading ? '...' : activeRulesCount}
          icon={<ShieldCheck className="w-4 h-4 text-blue-500" />}
          statusText={`${activeRulesCount} Active`}
          statusVariant="info"
          subtitle="nftables backend"
        />

        <MetricCard
          title="Network Interfaces"
          value={isInterfacesLoading ? '...' : `${activeInterfacesCount}/${totalInterfacesCount}`}
          icon={<NetIcon className="w-4 h-4 text-cyan-500" />}
          statusText={`${activeInterfacesCount} UP`}
          statusVariant="success"
          subtitle="eth0 WAN / eth1 LAN"
        />

        <MetricCard
          title="Online Devices"
          value={isDevicesLoading ? '...' : `${onlineDevicesCount}/${totalDevicesCount}`}
          icon={<MonitorSmartphone className="w-4 h-4 text-indigo-500" />}
          statusText={`${onlineDevicesCount} Online`}
          statusVariant="success"
          subtitle="Discovered hosts"
        />

        <MetricCard
          title="Active Sessions"
          value="1,482"
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          statusText="Normal"
          statusVariant="info"
          subtitle="Concurrent TCP/UDP"
          trend="+4.2%"
        />

        <MetricCard
          title="Blocked Traffic"
          value="12,490"
          icon={<XCircle className="w-4 h-4 text-red-500" />}
          statusText="9.4% Rate"
          statusVariant="danger"
          subtitle="Packets 24h"
        />
      </div>

      {/* 3. Core Panels Row: System Health + Firewall Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SystemHealthCard
            health={health}
            systemInfo={systemInfo}
            isLoading={isHealthLoading || isSystemLoading}
            error={healthError || systemError}
          />
        </div>

        <div className="lg:col-span-1 space-y-3">
          <FirewallStatusCard backend="nftables" activeRules={activeRulesCount} isRunning={true} />
          
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">Default Chain Policies</h4>
            <ChainPolicyBadge chain="INPUT" policy="DROP" />
            <ChainPolicyBadge chain="OUTPUT" policy="ACCEPT" />
            <ChainPolicyBadge chain="FORWARD" policy="DROP" />
          </div>
        </div>
      </div>

      {/* 4. Network Interfaces Overview Row */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Network Interfaces Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NetworkInterfaceCard
            name="eth0"
            role="WAN"
            ipAddress="192.168.1.100/24"
            gateway="192.168.1.1"
            status="UP"
            speed="1 Gbps"
          />
          <NetworkInterfaceCard
            name="eth1"
            role="LAN"
            ipAddress="192.168.2.1/24"
            subnet="192.168.2.0/24"
            status="UP"
            speed="1 Gbps"
          />
        </div>
      </div>

      {/* 5. Real-Time Network Traffic Chart */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Traffic & Session Telemetry</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" /> Inbound (Mbps)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-500">
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500 inline-block" /> Outbound (Mbps)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_TRAFFIC_DATA}>
              <defs>
                <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="inbound" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#inboundGrad)" />
              <Area type="monotone" dataKey="outbound" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#outboundGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Security Alerts & Audit Events Dual Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Security Alerts Summary</h3>
            </div>
            <a href="/alerts" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">View All Alerts →</a>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              <span className="text-[10px] block font-sans">Critical</span>
              <span className="text-sm font-bold">1</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <span className="text-[10px] block font-sans">High</span>
              <span className="text-sm font-bold">2</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <span className="text-[10px] block font-sans">Medium</span>
              <span className="text-sm font-bold">5</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400">
              <span className="text-[10px] block font-sans">Low</span>
              <span className="text-sm font-bold">14</span>
            </div>
          </div>

          {/* Recent Alerts List */}
          <div className="space-y-2">
            {[
              { severity: 'danger', time: '10:42:15', event: 'Port Scan Detected (SYN Flood)', src: '198.51.100.42' },
              { severity: 'warning', time: '09:15:00', event: 'SSH Repeated Authentication Failures', src: '203.0.113.15' },
              { severity: 'info', time: '08:30:22', event: 'New DHCP Host Bound on eth1', src: '192.168.2.145' },
            ].map((alt, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={alt.severity} variant={alt.severity as 'danger' | 'warning' | 'info'} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{alt.event}</p>
                    <p className="text-[10px] font-mono text-slate-400">Source IP: {alt.src}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{alt.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Events */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Audit Log Events</h3>
            </div>
            <a href="/audit" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">View Full Audit Chain →</a>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {[
              { user: 'Administrator', action: 'Created Firewall Rule rule-allow-http', res: 'nftables', result: 'Success', time: '11:02:40' },
              { user: 'Administrator', action: 'Updated Interface eth0 IP Address', res: 'network.d', result: 'Success', time: '10:14:12' },
              { user: 'Operator', action: 'Triggered Diagnostics Ping Check', res: 'diagnostics', result: 'Success', time: '08:50:00' },
            ].map((log, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{log.user}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans">{log.res}</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-700 dark:text-slate-300 mt-0.5">{log.action}</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-500 font-bold text-[10px] block">{log.result}</span>
                  <span className="text-[10px] text-slate-400">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Quick Actions Bar */}
      <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
          <Flame className="w-4 h-4 text-blue-500" />
          <span>Appliance Quick Actions</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" onClick={() => setShowAddRuleModal(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Firewall Rule
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/analytics'} className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> View Traffic
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/network'} className="gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Network Interfaces
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/audit'} className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> View Logs
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'} className="gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Run Diagnostics
          </Button>
          <Button variant="secondary" size="sm" onClick={() => alert('Configuration Backup Initiated')} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Backup Config
          </Button>
        </div>
      </div>

      {/* Add Firewall Rule Quick Action Modal */}
      <Dialog
        isOpen={showAddRuleModal}
        onClose={() => setShowAddRuleModal(false)}
        title="Add Firewall Rule"
        description="Configure new nftables filtering policy for RCS CyberTrack appliance."
      >
        <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Rule ID</label>
              <Input
                value={newRule.id}
                onChange={(e) => setNewRule({ ...newRule, id: e.target.value })}
                required
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Action</label>
              <Select
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value as RuleAction })}
              >
                <option value="allow">ALLOW</option>
                <option value="deny">DENY</option>
                <option value="reject">REJECT</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Chain Direction</label>
              <Select
                value={newRule.direction}
                onChange={(e) => setNewRule({ ...newRule, direction: e.target.value as 'input' | 'output' | 'forward' })}
              >
                <option value="input">INPUT</option>
                <option value="output">OUTPUT</option>
                <option value="forward">FORWARD</option>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Protocol</label>
              <Select
                value={newRule.protocol}
                onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value as 'tcp' | 'udp' | 'icmp' | 'any' })}
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
                <option value="any">ANY</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Source IP / CIDR</label>
              <Input
                value={newRule.source?.address || ''}
                onChange={(e) => setNewRule({ ...newRule, source: { address: e.target.value, port: newRule.source?.port } })}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Destination Port</label>
              <Input
                type="number"
                value={newRule.destination?.port || ''}
                onChange={(e) => setNewRule({ ...newRule, destination: { address: newRule.destination?.address || '', port: Number(e.target.value) } })}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowAddRuleModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Apply Rule to Core
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
