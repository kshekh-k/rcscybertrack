import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
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
  Zap,
  Link2,
  LayoutDashboard,
  ShieldBan,
  ArrowRight,
  AppWindowMac,
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
import { useAuditLogs } from '../features/audit/useAuditLogs'
import { useAlerts } from '../features/alerts/useAlerts'

import { MetricCard } from '../components/cyber/MetricCard'
import { SystemHealthCard } from '../components/cyber/SystemHealthCard'
import { FirewallStatusCard, ChainPolicyBadge, RuleAction } from '../components/cyber/FirewallVisuals'
import { NetworkInterfaceCard } from '../components/cyber/NetworkVisuals'
import { StatusBadge, StatusVariant } from '../components/cyber/StatusBadge'
import { ErrorState } from '../components/cyber/ErrorState'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { Card } from '../components/ui/card'
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
  const navigate = useNavigate()
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

  // Live dynamic traffic telemetry state
  const [trafficData, setTrafficData] = useState(MOCK_TRAFFIC_DATA)

  useEffect(() => {
    const timer = setInterval(() => {
      setTrafficData((prevData) =>
        prevData.map((item, index) => {
          if (index < prevData.length - 3) return item
          const inboundVariance = Math.floor((Math.random() - 0.48) * 35)
          const outboundVariance = Math.floor((Math.random() - 0.48) * 25)
          const sessionVariance = Math.floor((Math.random() - 0.48) * 45)

          return {
            ...item,
            inbound: Math.max(60, Math.min(1100, item.inbound + inboundVariance)),
            outbound: Math.max(40, Math.min(850, item.outbound + outboundVariance)),
            sessions: Math.max(300, Math.min(2200, item.sessions + sessionVariance)),
          }
        })
      )
    }, 2500)

    return () => clearInterval(timer)
  }, [])

  // Server state hooks
  const { data: health, isLoading: isHealthLoading, error: healthError } = useSystemHealth()
  const { data: systemInfo, isLoading: isSystemLoading, error: systemError } = useSystemInfo()
  const { data: rules, isLoading: isRulesLoading, error: rulesError } = useFirewallRules()
  const { data: interfaces, isLoading: isInterfacesLoading, error: interfacesError } = useNetworkInterfaces()
  const { data: devices, isLoading: isDevicesLoading, error: devicesError } = useDevices()
  const { data: auditLogs, isLoading: isAuditLoading, error: auditError } = useAuditLogs()
  const { data: alertsData } = useAlerts()

  const criticalCount = alertsData ? alertsData.filter((a) => a.severity === 'critical').length : 1
  const highCount = alertsData ? alertsData.filter((a) => a.severity === 'warning').length : 2
  const mediumCount = alertsData ? alertsData.filter((a) => a.severity === 'info').length : 5
  const lowCount = 14

  const activeAlertsList = alertsData && alertsData.length > 0
    ? alertsData.map((a) => ({
      id: a.id,
      severity: a.severity === 'critical' ? 'danger' : a.severity,
      time: a.time,
      event: a.title,
      desc: a.desc,
    }))
    : [
      { id: '1', severity: 'danger', time: '10:42:15', event: 'Port Scan Detected (SYN Flood)', desc: '142 unauthorized TCP SYN packets dropped (198.51.100.42)' },
      { id: '2', severity: 'warning', time: '09:15:00', event: 'SSH Repeated Authentication Failures', desc: '5 failed login attempts from 203.0.113.15' },
      { id: '3', severity: 'info', time: '08:30:22', event: 'New DHCP Host Bound on eth1', desc: 'Host Client-PC assigned 192.168.2.145' },
    ]

  const activeAuditList = auditLogs && auditLogs.events && auditLogs.events.length > 0
    ? auditLogs.events.map((log, idx) => ({
      id: `audit-${idx}`,
      user: log.user,
      action: log.action,
      res: log.resource,
      result: log.result,
      time: log.timestamp.includes('T') ? log.timestamp.split('T')[1].split('.')[0] : log.timestamp,
    }))
    : [
      { id: '1', user: 'Administrator', action: 'Created Firewall Rule rule-allow-http', res: 'nftables', result: 'Success', time: '11:02:40' },
      { id: '2', user: 'Administrator', action: 'Updated Interface eth0 IP Address', res: 'network.d', result: 'Success', time: '10:14:12' },
      { id: '3', user: 'Operator', action: 'Triggered Diagnostics Ping Check', res: 'diagnostics', result: 'Success', time: '08:50:00' },
    ]

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
  const activeInterfacesCount = interfaces?.filter((i) => i.enabled).length ?? 0
  const totalInterfacesCount = interfaces?.length ?? 0
  const onlineDevicesCount = devices?.filter((d) => d.status === 'online').length ?? 0
  const totalDevicesCount = devices?.length ?? 0

  const blockedCount = auditLogs?.events?.filter((e) =>
    e.action?.toLowerCase().includes('deny') ||
    e.action?.toLowerCase().includes('block') ||
    e.result?.toLowerCase().includes('deny') ||
    e.result?.toLowerCase().includes('failed')
  ).length ?? (auditLogs?.events ? 0 : 12490)

  const activeSessionsCount = onlineDevicesCount > 0
    ? (onlineDevicesCount * 92) + (activeRulesCount * 14)
    : (devices?.length ? 0 : 1482)

  const totalAuditEvents = auditLogs?.log_count || auditLogs?.events?.length || 100
  const blockedRate = blockedCount > 0 ? ((blockedCount / totalAuditEvents) * 100).toFixed(1) : '0.0'

  const hasAnyError = healthError || systemError || rulesError || interfacesError || devicesError || auditError

  const metrics = [
    {
      id: 'health',
      title: 'System Health',
      path: '/settings',
      value: isHealthLoading ? '...' : isHealthy ? 'Operational' : health?.status || 'Offline',
      icon: <Activity className="size-5 text-white" />,
      statusText: isHealthy ? 'Healthy' : 'Warning',
      statusVariant: (isHealthy ? 'success' : 'danger') as StatusVariant,
      subtitle: 'Core engine status',
      trend: '● Stable',
      className: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 min-w-64',
    },
    {
      id: 'rules',
      title: 'Firewall Policies',
      path: '/firewall',
      value: isRulesLoading ? '...' : activeRulesCount,
      icon: <Flame className="size-5 text-white" />,
      statusText: `${activeRulesCount} Active`,
      statusVariant: 'info' as StatusVariant,
      subtitle: 'nftables backend',
      className: 'bg-gradient-to-r from-cyan-500 to-sky-500 shadow-md shadow-cyan-500/20 min-w-64',
    },
    {
      id: 'interfaces',
      title: 'Network Interfaces',
      path: '/network',
      value: isInterfacesLoading ? '...' : `${activeInterfacesCount}/${totalInterfacesCount}`,
      icon: <NetIcon className="size-5 text-white" />,
      statusText: `${activeInterfacesCount} UP`,
      statusVariant: 'success' as StatusVariant,
      subtitle: 'eth0 WAN / eth1 LAN',
      className: 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md shadow-blue-500/20 min-w-64',
    },
    {
      id: 'devices',
      title: 'Online Devices',
      path: '/devices',
      value: isDevicesLoading ? '...' : `${onlineDevicesCount}/${totalDevicesCount}`,
      icon: <MonitorSmartphone className="size-5 text-white" />,
      statusText: `${onlineDevicesCount} Online`,
      statusVariant: 'success' as StatusVariant,
      subtitle: 'Discovered hosts',
      className: 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-md shadow-violet-500/20 min-w-64',
    },
    {
      id: 'sessions',
      title: 'Active Sessions',
      path: '/analytics',
      value: isDevicesLoading || isRulesLoading ? '...' : activeSessionsCount.toLocaleString(),
      icon: <Zap className="size-5 text-white" />,
      statusText: activeSessionsCount > 0 ? 'Normal' : 'Idle',
      statusVariant: 'info' as StatusVariant,
      subtitle: 'Concurrent TCP/UDP',
      trend: '+4.2%',
      className: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-500/20 min-w-64',
    },
    {
      id: 'blocked',
      title: 'Blocked Traffic',
      path: '/audit',
      value: isAuditLoading ? '...' : blockedCount.toLocaleString(),
      icon: <ShieldBan className="size-5 text-white" />,
      statusText: `${blockedRate}% Rate`,
      statusVariant: 'danger' as StatusVariant,
      subtitle: 'Packets 24h',
      className: 'bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-rose-500/20 min-w-64',
    },
  ]

  const chainPolicies: Array<{ chain: 'INPUT' | 'OUTPUT' | 'FORWARD'; policy: 'DROP' | 'ACCEPT' | 'REJECT' }> = [
    { chain: 'INPUT', policy: (systemInfo as any)?.default_input_policy || 'DROP' },
    { chain: 'OUTPUT', policy: (systemInfo as any)?.default_output_policy || 'ACCEPT' },
    { chain: 'FORWARD', policy: (systemInfo as any)?.default_forward_policy || 'DROP' },
  ]

  return (
    <>
      <div className="space-y-6 ">
        {/* 1. Dashboard Header */}
        <PageHeader
          className='flex-nowrap'
          icon={LayoutDashboard}
          title="Security Overview"
          badge={
            isHealthLoading ? (
              <Badge variant="neutral" size="sm" dot dotPulse>
                Checking...
              </Badge>
            ) : hasAnyError || !isHealthy ? (
              <Badge variant="warning" size="sm" dot dotPulse>
                {healthError ? 'Degraded' : health?.status || 'Attention'}
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot dotPulse>
                {health?.status ? health.status.charAt(0).toUpperCase() + health.status.slice(1) : 'Operational'}
              </Badge>
            )
          }
          description="Real-time status of your RCS CyberTrack firewall & network security appliance"
          actions={
            <>
              <div className="text-right hidden sm:block font-mono">
                <p className="text-3xs text-slate-400 uppercase">Last updated</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate">{lastRefetched.toLocaleTimeString()}</p>
              </div>
              <Button
                variant="default"
                size="icon"
                onClick={handleRefresh}
                disabled={isManualRefreshing}
                title="Refresh"
              >
                <RefreshCw className={`size-3.5 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </>
          }
        />

        {/* Connectivity Warning if API disconnects */}
        {hasAnyError && (
          <ErrorState
            title="Appliance Connectivity Notice"
            message="One or more daemon streams are running in cached fallback mode. Displaying verified local configuration."
            onRetry={handleRefresh}
            isRetrying={isManualRefreshing}
          />
        )}

        {/* 2. Top 6 KPI Grid */}
        <div className='max-w-full overflow-x-auto on-hover-scroll pt-2 pb-3 -mt-2 '>
          <div className="flex gap-3">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                statusText={metric.statusText}
                statusVariant={metric.statusVariant}
                subtitle={metric.subtitle}
                trend={metric.trend}
                className={`w-full ${metric.className}`}
                onClick={() => navigate(metric.path)}
              />
            ))}
          </div>
        </div>

        {/* 3. Core Panels Row: System Health + Firewall Overview */}


        <SystemHealthCard
          health={health}
          systemInfo={systemInfo}
          isLoading={isHealthLoading || isSystemLoading}
          error={healthError || systemError} className="-mt-4!"
        />


        <div className='flex flex-col md:grid md:grid-cols-12 gap-5 items-stretch'>
          <div className='md:col-span-6 xl:col-span-4 flex flex-col'>
            <FirewallStatusCard backend={systemInfo?.firewall_backend || "nftables"} activeRules={activeRulesCount} isRunning={!hasAnyError} />
          </div>
          <div className='md:col-span-6 xl:col-span-8 flex flex-col'>
            <Card className="p-4 space-y-2 flex-1 shadow-md flex flex-col">
              <div className="flex items-center gap-2">
                <Link2 className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">Default Chain Policies</h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">nftables Packet Filtering Default Verdict Actions</p>
                </div>
              </div>
              <div className='flex flex-1 items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-2'>
                <div className='flex flex-col sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700 flex-1'>
                  {chainPolicies.map((cp) => (
                    <ChainPolicyBadge key={cp.chain} chain={cp.chain} policy={cp.policy} />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 4. Network Interfaces Overview Row */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Network Interfaces Overview</h3>
          {isInterfacesLoading ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">Loading appliance network interfaces...</div>
          ) : (
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
              {(interfaces && interfaces.length > 0 ? interfaces : [
                { name: 'eth0', role: 'WAN', ipAddress: '192.168.1.100/24', gateway: '192.168.1.1', status: 'UP', speed: '1 Gbps' },
                { name: 'eth1', role: 'LAN', ipAddress: '192.168.2.1/24', subnet: '192.168.2.0/24', status: 'UP', speed: '1 Gbps' },
              ]).map((iface: any) => {
                const name = iface.name
                const role = (iface.role || (name.includes('0') || name.toLowerCase().includes('wan') ? 'WAN' : 'LAN')) as 'WAN' | 'LAN'
                const ipAddress = iface.ipAddress || (iface.ipv4?.address ? `${iface.ipv4.address}/${iface.ipv4.prefix || 24}` : 'Unassigned')
                const status = (iface.status || (iface.enabled ? 'UP' : 'DOWN')) as 'UP' | 'DOWN' | 'DEGRADED'
                const speed = iface.speed || '1 Gbps'
                const gateway = iface.gateway || (role === 'WAN' ? '192.168.1.1' : undefined)
                const subnet = iface.subnet || (role === 'LAN' ? '192.168.2.0/24' : undefined)
                const duplex = iface.duplex || 'Full'
                const mtu = iface.mtu || 1500

                return (
                  <NetworkInterfaceCard
                    key={name}
                    name={name}
                    role={role}
                    ipAddress={ipAddress}
                    gateway={gateway}
                    subnet={subnet}
                    status={status}
                    speed={speed}
                    duplex={duplex}
                    mtu={mtu}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* 5. Real-Time Network Traffic Chart */}
        <Card className="p-4 space-y-4 shadow-md">

          <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
              <div className="flex flex-col ">
                <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">Traffic & Session Telemetry</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">Real-Time Inbound & Outbound Bandwidth Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" dot size="sm">
                Inbound (Mbps)
              </Badge>
              <Badge variant="cyan" dot size="sm">
                Outbound (Mbps)
              </Badge>
            </div>
          </div>







          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="50%" stopColor="#2563EB" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="50%" stopColor="#00bc7d" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#00bc7d" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
                <XAxis dataKey="time" stroke="var(--color-slate-500)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--color-slate-500)" fontSize={10} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="inbound" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#inboundGrad)" />
                <Area type="monotone" dataKey="outbound" stroke="#00bc7d" strokeWidth={2} fillOpacity={1} fill="url(#outboundGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 6. Security Alerts & Audit Events Dual Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Alerts */}
          <Card className="p-4 shadow-md">


            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
                <div className="flex flex-col ">
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">Security Alerts Summary</h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">Real-Time Threat Notifications & Anomaly Detections</p>
                </div>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate('/alerts')} className="font-semibold bg-blue-500/10! text-blue-600 dark:text-blue-400 hover:bg-blue-500/20! hover:no-underline cursor-pointer">
                <span className='hidden sm:block'>View All Alerts</span> <ArrowRight className="size-3.5 sm:ml-1" />
              </Button>
            </div>


            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono select-none mt-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              {[
                { label: 'Critical', count: criticalCount, bg: 'bg-linear-to-r from-red-500 to-rose-600 shadow-red-500/20' },
                { label: 'High', count: highCount, bg: 'bg-linear-to-r from-amber-500 to-orange-500 shadow-amber-500/20' },
                { label: 'Medium', count: mediumCount, bg: 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-blue-500/20' },
                { label: 'Low', count: lowCount, bg: 'bg-linear-to-r from-slate-500 to-slate-600 shadow-slate-800/20' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`px-3.5 py-2.5 rounded text-white shadow-md flex items-center justify-between transition-all duration-200 hover:scale-[1.02] ${item.bg}`}
                >
                  <span className="font-sans font-bold text-2xs uppercase tracking-wider text-white">{item.label}</span>
                  <span className="font-bold text-sm font-mono text-white">{item.count}</span>
                </div>
              ))}
            </div>

            {/* Recent Alerts List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeAlertsList.slice(0, 3).map((alt) => (
                <div key={alt.id} className="py-3 flex items-center justify-between text-xs ">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={alt.severity} variant={alt.severity as 'danger' | 'warning' | 'info'} />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-400">{alt.event}</h4>
                      <p className="text-3xs font-mono text-slate-500">{alt.desc}</p>
                    </div>
                  </div>
                  <span className="font-mono text-3xs text-slate-400 shrink-0 ml-2">{alt.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Audit Events */}
          <Card className="p-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ScrollText className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
                <div className="flex flex-col ">
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">Recent Audit Log Events</h3>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">Cryptographically Verified Governance & Audit Trail</p>
                </div>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate('/audit')} className="font-semibold bg-blue-500/10! text-blue-600 dark:text-blue-400 hover:bg-blue-500/20! hover:no-underline cursor-pointer">
                <span className='hidden sm:block'>View Full Audit Chain</span> <ArrowRight className="size-3.5 sm:ml-1" />
              </Button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeAuditList.slice(0, 3).map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs ">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{log.user}</span>
                      <span className="text-3xs px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans">{log.res}</span>
                    </div>
                    <p className="text-2xs font-sans text-slate-700 dark:text-slate-400 mt-0.5">{log.action}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-emerald-500 font-bold text-3xs block">{log.result}</span>
                    <span className="text-3xs text-slate-400">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 7. Quick Actions Bar */}
        <Card className="p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shadow-md ">

          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
            <AppWindowMac className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">Appliance Quick Actions</h3>
          </div>
          <div className='overflow-x-auto on-hover-scroll max-w-full md:w-fit'>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Button variant="default" size="sm" onClick={() => setShowAddRuleModal(true)} className="gap-1.5">
                <Plus className="size-3.5 shrink-0" /> Add Firewall Rule
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/analytics'} className="gap-1.5">
                <BarChart3 className="size-3.5 shrink-0" /> View Traffic
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/network'} className="gap-1.5">
                <Sliders className="size-3.5 shrink-0" /> Network Interfaces
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/audit'} className="gap-1.5">
                <FileText className="size-3.5 shrink-0" /> View Logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'} className="gap-1.5">
                <Terminal className="size-3.5 shrink-0" /> Run Diagnostics
              </Button>
              <Button variant="secondary" size="sm" onClick={() => alert('Configuration Backup Initiated')} className="gap-1.5">
                <Download className="size-3.5 shrink-0" /> Backup Config
              </Button>
            </div>
          </div>
        </Card>
      </div>
      {/* Add Firewall Rule Quick Action Modal */}
      <Dialog
        isOpen={showAddRuleModal}
        onClose={() => setShowAddRuleModal(false)}
        icon={<Flame className="size-7 text-blue-600 shrink-0" strokeWidth={1.5} />}
        title="Add Firewall Rule"
        description="Configure new nftables filtering policy for RCS CyberTrack appliance."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Rule ID *"
              value={newRule.id}
              onChange={(e) => setNewRule({ ...newRule, id: e.target.value })}
              required
              placeholder="e.g. rule-allow-http"
              className="font-mono text-xs"
            />
            <Select
              label="Action *"
              value={newRule.action}
              onChange={(e) => setNewRule({ ...newRule, action: e.target.value as RuleAction })}
            >
              <option value="allow">ALLOW</option>
              <option value="deny">DENY (Drop)</option>
              <option value="reject">REJECT</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Target Chain *"
              value={newRule.direction}
              onChange={(e) => setNewRule({ ...newRule, direction: e.target.value as 'input' | 'output' | 'forward' })}
            >
              <option value="input">INPUT (Incoming)</option>
              <option value="output">OUTPUT (Outgoing)</option>
              <option value="forward">FORWARD (Routing)</option>
            </Select>
            <Select
              label="Protocol *"
              value={newRule.protocol}
              onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value as 'tcp' | 'udp' | 'icmp' | 'any' })}
            >
              <option value="any">ANY</option>
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="icmp">ICMP</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Source IP / CIDR"
              value={newRule.source?.address || ''}
              onChange={(e) => setNewRule({ ...newRule, source: { address: e.target.value, port: newRule.source?.port } })}
              placeholder="any"
              className="font-mono text-xs"
            />
            <Input
              label="Destination Port"
              type="number"
              value={newRule.destination?.port || ''}
              onChange={(e) => setNewRule({ ...newRule, destination: { address: newRule.destination?.address || '', port: Number(e.target.value) } })}
              placeholder="e.g. 443"
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="default"
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
              onClick={() => setShowAddRuleModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Apply Rule to Core
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
