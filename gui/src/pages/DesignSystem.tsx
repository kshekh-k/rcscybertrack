import { useState } from 'react'
import {
  Palette,
  Sun,
  Moon,
  Plus,
  Trash2,
  Flame,
  Network,
} from 'lucide-react'
import { useTheme } from '../lib/theme'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { Dialog } from '../components/ui/dialog'
import { DataTable, Column } from '../components/ui/data-table'
import { StatusBadge } from '../components/cyber/StatusBadge'
import { ChainPolicyBadge, ActionBadge } from '../components/cyber/FirewallVisuals'
import { NetworkInterfaceCard } from '../components/cyber/NetworkVisuals'

interface SampleRule {
  id: string
  action: 'allow' | 'deny' | 'reject'
  direction: 'input' | 'output' | 'forward'
  protocol: string
  source: string
  destination: string
  status: string
}

const SAMPLE_RULES: SampleRule[] = [
  { id: 'rule-allow-ssh', action: 'allow', direction: 'input', protocol: 'TCP', source: '0.0.0.0/0', destination: 'Port 22', status: 'Active' },
  { id: 'rule-allow-web', action: 'allow', direction: 'input', protocol: 'TCP', source: '0.0.0.0/0', destination: 'Port 443', status: 'Active' },
  { id: 'rule-block-malware', action: 'deny', direction: 'input', protocol: 'ANY', source: '198.51.100.0/24', destination: 'ANY', status: 'Active' },
  { id: 'rule-reject-udp', action: 'reject', direction: 'forward', protocol: 'UDP', source: '192.168.2.0/24', destination: 'Port 53', status: 'Active' },
]

export default function DesignSystem() {
  const { theme, toggleTheme } = useTheme()
  const [switchChecked, setSwitchChecked] = useState(true)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [tableError, setTableError] = useState<string | null>(null)

  const columns: Column<SampleRule>[] = [
    { key: 'id', header: 'Rule ID', accessor: (r) => <span className="font-mono font-semibold">{r.id}</span>, sortable: true },
    { key: 'action', header: 'Action', accessor: (r) => <ActionBadge action={r.action} />, sortable: true },
    { key: 'direction', header: 'Chain', accessor: (r) => <span className="font-mono uppercase text-3xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{r.direction}</span> },
    { key: 'protocol', header: 'Protocol', accessor: (r) => <span className="font-mono">{r.protocol}</span> },
    { key: 'source', header: 'Source', accessor: (r) => <span className="font-mono text-slate-500">{r.source}</span> },
    { key: 'destination', header: 'Destination', accessor: (r) => <span className="font-mono text-slate-500">{r.destination}</span> },
    { key: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} variant="success" /> },
  ]

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">RCS CyberTrack Design System</h1>
            <Badge variant="cyan">Tailwind v4 + shadcn/ui</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official visual language, design tokens, typography, and component specifications for CyberTrack hardware appliances.
          </p>
        </div>

        <Button onClick={toggleTheme} variant="outline" className="gap-2">
          {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-blue-600" />}
          <span>Toggle Mode ({theme.toUpperCase()})</span>
        </Button>
      </div>

      {/* Color Palette Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-blue-500" /> 1. Native Color Palette & Semantic System
          </CardTitle>
          <CardDescription>
            Tailwind native Blue, Cyan, and Slate scales combined with strict security semantic status tokens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono text-xs text-center">
            <div className="p-3 rounded-lg bg-blue-600 text-white shadow-xs">
              <span className="block font-bold">BLUE-600</span>
              <span className="text-3xs opacity-80">#2563EB (Primary)</span>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500 text-white shadow-xs">
              <span className="block font-bold">CYAN-500</span>
              <span className="text-3xs opacity-80">#06B6D4 (Network)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800 text-white shadow-xs">
              <span className="block font-bold">SLATE-800</span>
              <span className="text-3xs opacity-80">#1E293B (Structure)</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500 text-white shadow-xs">
              <span className="block font-bold">GREEN-500</span>
              <span className="text-3xs opacity-80">#22C55E (Allowed)</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-500 text-white shadow-xs">
              <span className="block font-bold">AMBER-500</span>
              <span className="text-3xs opacity-80">#F59E0B (Warning)</span>
            </div>
            <div className="p-3 rounded-lg bg-red-600 text-white shadow-xs">
              <span className="block font-bold">RED-600</span>
              <span className="text-3xs opacity-80">#DC2626 (Blocked)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>2. Buttons & Actions</CardTitle>
            <CardDescription>shadcn button variants with loading and icon support.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="default">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Gradient Color Variants</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="emerald">Emerald</Button>
                <Button variant="purple">Purple</Button>
                <Button variant="amber">Amber</Button>
                <Button variant="rose">Rose</Button>
                <Button variant="cyan">Cyan</Button>
                <Button variant="sunset">Sunset</Button>
                <Button variant="lime">Lime</Button>
                <Button variant="slate">Slate</Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button size="sm" className="gap-1.5"><Plus className="size-3.5" /> Small Button</Button>
              <Button size="default" isLoading>Processing</Button>
              <Button size="icon" variant="outline"><Trash2 className="size-4 text-red-500" /></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Status & Badges System</CardTitle>
            <CardDescription>Icon + Text + Color accessibility rule enforcement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="Operational" variant="success" />
              <StatusBadge status="Degraded" variant="warning" />
              <StatusBadge status="Critical Drop" variant="danger" />
              <StatusBadge status="DHCP Active" variant="info" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Allowed</Badge>
              <Badge variant="warning" className="font-mono">Pending 8000/TCP</Badge>
              <Badge variant="danger">Blocked Packet</Badge>
              <Badge variant="cyan">eth0 WAN</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Controls */}
      <Card>
        <CardHeader>
          <CardTitle>4. Enterprise Form Controls</CardTitle>
          <CardDescription>High-density inputs, selects, and switches for firewall rule customization.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Interface Name</label>
            <Input placeholder="eth0 / eth1 / vlan10" className="font-mono" defaultValue="eth0" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Firewall Action</label>
            <Select defaultValue="allow">
              <option value="allow">ALLOW Traffic</option>
              <option value="deny">DENY Traffic</option>
              <option value="reject">REJECT Traffic</option>
            </Select>
          </div>
          <div className="flex items-center pt-5">
            <Switch
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
              label={switchChecked ? 'Log Packet State (Enabled)' : 'Logging Disabled'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Domain Visual Primitives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-blue-500" /> 5. Firewall Visual Language
            </CardTitle>
            <CardDescription>Chain default policies and rule action badges.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <ActionBadge action="allow" />
              <ActionBadge action="deny" />
              <ActionBadge action="reject" />
            </div>
            <div className="space-y-2 pt-2">
              <ChainPolicyBadge chain="INPUT" policy="DROP" />
              <ChainPolicyBadge chain="OUTPUT" policy="ACCEPT" />
              <ChainPolicyBadge chain="FORWARD" policy="DROP" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="size-4 text-cyan-500" /> 6. Network Visual Language
            </CardTitle>
            <CardDescription>Interface cards and technical monospace address formatting.</CardDescription>
          </CardHeader>
          <CardContent>
            <NetworkInterfaceCard
              name="eth0"
              role="WAN"
              ipAddress="192.168.1.100/24"
              gateway="192.168.1.1"
              status="UP"
              speed="1 Gbps"
            />
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Data Table Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle>7. Enterprise Data Table (All States)</CardTitle>
            <CardDescription>Sorting, filtering, selection, empty state, error state, and pagination.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setTableLoading(!tableLoading)}>
              Toggle Loading
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTableError(tableError ? null : 'Failed to query nftables ruleset')}>
              Toggle Error
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={SAMPLE_RULES}
            keyExtractor={(r) => r.id}
            isLoading={tableLoading}
            error={tableError}
            enableSelection
            searchPlaceholder="Filter rules by ID, protocol, or IP..."
            bulkActions={(selected) => (
              <Button size="sm" variant="destructive" onClick={() => alert(`Deleting ${selected.join(', ')}`)}>
                Delete Selected
              </Button>
            )}
          />
        </CardContent>
      </Card>

      {/* Dialog Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>8. Modal Dialog & Quick Action Triggers</CardTitle>
          <CardDescription>Accessible popups for confirmation and policy creation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowDemoModal(true)}>Trigger Sample Appliance Modal</Button>
          <Dialog
            isOpen={showDemoModal}
            onClose={() => setShowDemoModal(false)}
            title="Sample Appliance Confirmation"
            description="Verify changes before applying configuration to core nftables backend."
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300">
                Warning: Updating firewall chain policy will immediately disconnect existing non-established TCP sessions.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDemoModal(false)}>Cancel</Button>
                <Button variant="default" onClick={() => setShowDemoModal(false)}>Apply Policy</Button>
              </div>
            </div>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
