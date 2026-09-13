import { useState, useEffect } from 'react'
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileCode,
  ToggleLeft,
  ToggleRight,
  Flame,
  BanknoteX,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { api, FirewallRule } from '../lib/api'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Alert } from '../components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { useSystemInfo } from '../features/dashboard/useSystemHealth'
import { cn } from '../lib/utils'

export default function Firewall() {
  const { data: systemInfo } = useSystemInfo()
  const [rules, setRules] = useState<FirewallRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const totalPages = Math.max(1, Math.ceil(rules.length / pageSize))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [rules.length, pageSize, totalPages, currentPage])

  const paginatedRules = rules.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const chainPolicies: Array<{ chain: string; policy: string }> = [
    { chain: 'INPUT', policy: (systemInfo as any)?.default_input_policy || 'DROP' },
    { chain: 'OUTPUT', policy: (systemInfo as any)?.default_output_policy || 'ACCEPT' },
    { chain: 'FORWARD', policy: (systemInfo as any)?.default_forward_policy || 'DROP' },
  ]

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Form Fields
  const [ruleId, setRuleId] = useState('')
  const [action, setAction] = useState<'allow' | 'deny' | 'reject'>('allow')
  const [direction, setDirection] = useState<'input' | 'output' | 'forward'>('input')
  const [netInterface, setNetInterface] = useState('')
  const [protocol, setProtocol] = useState<'tcp' | 'udp' | 'icmp' | 'any'>('any')
  const [srcAddress, setSrcAddress] = useState('any')
  const [srcPort, setSrcPort] = useState('')
  const [dstAddress, setDstAddress] = useState('any')
  const [dstPort, setDstPort] = useState('')
  const [stateNew, setStateNew] = useState(false)
  const [stateEstablished, setStateEstablished] = useState(false)
  const [stateRelated, setStateRelated] = useState(false)
  const [logging, setLogging] = useState(false)

  // Fetch Rules from API
  const loadRules = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getFirewallRules()
      setRules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }


  // Input Validation Helper Functions
  const isValidAddress = (addr: string) => {
    if (addr.toLowerCase() === 'any') return true
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?$/
    const match = addr.match(ipPattern)
    if (!match) return false
    for (let i = 1; i <= 4; i++) {
      const val = parseInt(match[i], 10)
      if (val < 0 || val > 255) return false
    }
    if (match[6] !== undefined) {
      const cidr = parseInt(match[6], 10)
      if (cidr < 0 || cidr > 32) return false
    }
    return true
  }

  const isValidPort = (portStr: string) => {
    if (!portStr) return true
    if (/^\d+$/.test(portStr)) {
      const p = parseInt(portStr, 10)
      return p >= 1 && p <= 65535
    }
    if (/^\d+:\d+$/.test(portStr)) {
      const [start, end] = portStr.split(':').map(x => parseInt(x, 10))
      return start >= 1 && start <= 65535 && end >= 1 && end <= 65535 && start <= end
    }
    return false
  }

  // Open Modal for Create or Edit
  const openModal = (rule: FirewallRule | null = null) => {
    setFormError(null)
    if (rule) {
      setEditingRule(rule)
      setRuleId(rule.id)
      setAction(rule.action)
      setDirection(rule.direction)
      setNetInterface(rule.interface || '')
      setProtocol(rule.protocol)
      setSrcAddress(rule.source.address)
      setSrcPort(rule.source.port?.toString() || '')
      setDstAddress(rule.destination.address)
      setDstPort(rule.destination.port?.toString() || '')
      setStateNew(rule.state.includes('new'))
      setStateEstablished(rule.state.includes('established'))
      setStateRelated(rule.state.includes('related'))
      setLogging(rule.logging)
    } else {
      setEditingRule(null)
      // Auto generate a simple rule ID to reduce friction
      setRuleId(`rule-${Math.floor(1000 + Math.random() * 9000)}`)
      setAction('allow')
      setDirection('input')
      setNetInterface('')
      setProtocol('any')
      setSrcAddress('any')
      setSrcPort('')
      setDstAddress('any')
      setDstPort('')
      setStateNew(false)
      setStateEstablished(false)
      setStateRelated(false)
      setLogging(false)
    }
    setModalOpen(true)
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validations
    if (!ruleId.trim()) {
      setFormError('Rule ID is required')
      return
    }

    if (!editingRule && rules.some(r => r.id === ruleId)) {
      setFormError(`Rule ID "${ruleId}" already exists. Please choose a unique ID.`)
      return
    }

    if (!isValidAddress(srcAddress)) {
      setFormError('Source address must be "any", a valid IP (e.g. 192.168.1.10), or CIDR network (e.g. 10.0.0.0/24)')
      return
    }

    if (!isValidAddress(dstAddress)) {
      setFormError('Destination address must be "any", a valid IP, or CIDR network')
      return
    }

    if (!isValidPort(srcPort)) {
      setFormError('Source port must be empty, a single port (1-65535), or range (e.g. 8000:9000)')
      return
    }

    if (!isValidPort(dstPort)) {
      setFormError('Destination port must be empty, a single port (1-65535), or range (e.g. 8000:9000)')
      return
    }

    // Build States array
    const states: ('new' | 'established' | 'related')[] = []
    if (stateNew) states.push('new')
    if (stateEstablished) states.push('established')
    if (stateRelated) states.push('related')

    // Parse Ports
    const parsePort = (portVal: string) => {
      if (!portVal) return null
      return /^\d+$/.test(portVal) ? parseInt(portVal, 10) : portVal
    }

    const payload: FirewallRule = {
      id: ruleId.trim(),
      action,
      direction,
      interface: netInterface.trim() || null,
      protocol,
      source: {
        address: srcAddress.trim(),
        port: parsePort(srcPort.trim())
      },
      destination: {
        address: dstAddress.trim(),
        port: parsePort(dstPort.trim())
      },
      state: states,
      logging
    }

    try {
      if (editingRule) {
        await api.updateFirewallRule(editingRule.id, payload)
      } else {
        await api.createFirewallRule(payload)
      }

      setModalOpen(false)
      await loadRules()

    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to apply rule'
      )
    }
  }

  // Delete confirmation modal states
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api.deleteFirewallRule(ruleToDelete)
      setRuleToDelete(null)
      await loadRules()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete rule')
    } finally {
      setIsDeleting(false)
    }
  }

  // Backend nftables status state
  const [backendStatus, setBackendStatus] = useState<any>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const loadBackendStatus = async () => {
    try {
      const data = await api.getFirewallStatus()
      setBackendStatus(data)
    } catch {
      // Ignore background status failure
    }
  }

  useEffect(() => {
    loadRules()
    loadBackendStatus()
  }, [])

  const handleValidate = async () => {
    setStatusMsg(null)
    setError(null)
    try {
      const data = await api.validateFirewall()
      setStatusMsg(data.message || 'nftables Ruleset Validation PASSED!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    }
  }

  const handleApply = async () => {
    setStatusMsg(null)
    setError(null)
    setApplying(true)
    try {
      await api.applyFirewall()
      setStatusMsg('Ruleset APPLIED & VERIFIED on nftables table inet rcs_cybertrack!')
      await loadBackendStatus()
      await loadRules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Firewall apply failed')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header Summary */}
      <PageHeader
        icon={Flame}
        title="Firewall Policies"
        description="Configure stateful security rules applied to local nftables table inet rcs_cybertrack."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleValidate}
              className="px-3 py-2"
            >
              Validate Ruleset
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={handleApply}
              isLoading={applying}
              className="gap-1 px-3 py-2"
            >
              {!applying && <CheckCircle className="size-4" />}
              <span>Apply to nftables</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openModal(null)}
              className="gap-1 px-3 py-2"
            >
              <Plus className="size-4" /> Add Security Rule
            </Button>
          </>
        }
      />

      {/* Backend Status Notification */}
      {backendStatus && (
        <div className="p-3 bg-(--topbar-bg) rounded shadow-md flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full shrink-0 ${backendStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <p className="truncate">Backend: <strong className="text-slate-700 dark:text-white font-mono">{backendStatus.backend}</strong> ({backendStatus.version || 'Detection active'})</p>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <p className="truncate">Managed Table: <strong className="text-cyan-500 dark:text-cyan-400 font-mono">table inet {backendStatus.table_name}</strong></p>
          </div>
          <p className="flex items-center gap-1 font-mono text-slate-400">
            Rules: {rules.length}/{backendStatus.rule_count}
          </p>
        </div>
      )}


      {statusMsg && (
        <Alert
          variant="success"
          title="Firewall Operation Successful"
          message={statusMsg}
          onClose={() => setStatusMsg(null)}
        />
      )}

      {/* Chain Policy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {chainPolicies.map((cp) => {
          const isAccept = cp.policy.toUpperCase() === 'ACCEPT'
          const IconComponent = isAccept ? CheckCircle : BanknoteX
          const cardGradient = isAccept
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
            : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/20'
          const labelText = isAccept ? 'text-emerald-100' : 'text-rose-100'

          return (
            <Card key={cp.chain} className={cn('p-4 flex items-center gap-2 border-0', cardGradient)}>

              <IconComponent className="size-7 text-white" strokeWidth={1.5} />

              <div>
                <h4 className={cn('text-3xs leading-tight font-semibold uppercase tracking-wider font-mono', labelText)}>
                  {cp.chain} Chain
                </h4>
                <p className="text-sm leading-tight font-semibold text-white font-mono">
                  DEFAULT {cp.policy.toUpperCase()}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Rules Database Panel */}
      <Card className="overflow-hidden shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
          <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileCode className="size-5 text-blue-600" />
            <span>Active Ruleset</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <label htmlFor="pageSizeSelect" className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Show</label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadRules}
              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 gap-1.5 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh Rules</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="size-8 text-blue-600 animate-spin" />
              <span>Retrieving nftables policies...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
              <AlertTriangle className="size-10 text-amber-500" />
              <span className="text-sm text-slate-900 dark:text-slate-50 font-semibold">Failed to load rules</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 max-w-md">{error}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadRules}
                className="mt-2 cursor-pointer"
              >
                Retry Connection
              </Button>
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="size-10 text-slate-500 mb-2" />
              <span className="text-sm text-slate-900 dark:text-slate-50 font-semibold">No rules configured</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">Add a security policy rule above to populate the active table.</span>
            </div>
          ) : (
            <div className="overflow-x-auto on-hover-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">ID / Name</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Chain</th>
                    <th className="px-4 py-3">Interface</th>
                    <th className="px-4 py-3">Proto</th>
                    <th className="px-4 py-3">Source IP / Port</th>
                    <th className="px-4 py-3">Dest IP / Port</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Log</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {paginatedRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-50">{rule.id}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={rule.action === 'allow' ? 'success' : rule.action === 'deny' ? 'destructive' : 'warning'}
                          size="sm"
                          className="uppercase font-bold text-3xs"
                        >
                          {rule.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold capitalize">{rule.direction}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{rule.interface || 'any'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono uppercase">{rule.protocol}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                        {rule.source.address}
                        {rule.source.port ? `:${rule.source.port}` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                        {rule.destination.address}
                        {rule.destination.port ? `:${rule.destination.port}` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {rule.state.length > 0 ? (
                          <div className="flex gap-1">
                            {rule.state.map(s => (
                              <Badge key={s} variant="secondary" size="sm" className="text-4xs uppercase">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {rule.logging ? (
                          <span className="text-blue-600 font-semibold text-3xs uppercase">Active</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Off</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(rule)}
                            className="size-7 text-emerald-500! hover:text-emerald-600! hover:bg-emerald-500/10! cursor-pointer"
                            title="Edit Policy"
                          >
                            <Edit2 className="size-3.5" />
                            <span className="sr-only">Edit Policy</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setRuleToDelete(rule.id)
                              setDeleteError(null)
                            }}
                            className="size-7 text-red-500! hover:text-red-600! hover:bg-red-500/10! cursor-pointer"
                            title="Delete Policy"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete Policy</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {!loading && !error && rules.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="pageSizeSelect" className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Show</label>
                <select
                  id="pageSizeSelect"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                </select>
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
                  {Math.min(currentPage * pageSize, rules.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {rules.length}
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

      {/* Add / Edit Rules Dialog Modal */}
      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<FileCode className="size-7 text-blue-600" strokeWidth={1.5} />}
        title={editingRule ? 'Edit Firewall Policy Rule' : 'Create New Firewall Policy Rule'}
        description='Configure ports, addresses, and actions below. Changes are saved to the firewall policy configuration and become active after applying the ruleset to nftables.'
        maxWidth="max-w-2xl"
      >
        {formError && (
          <div className="mb-4 bg-red-500/10 text-red-400 text-xs rounded-lg p-3 font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule ID */}
            <Input
              label="Rule ID"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              disabled={!!editingRule}
              placeholder="rule-allow-dns"
              className="font-mono text-xs"
            />

            {/* Interface */}
            <Input
              label="Link Interface (Optional)"
              value={netInterface}
              onChange={(e) => setNetInterface(e.target.value)}
              placeholder="eth0"
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action */}
            <Select
              label="Action"
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
            >
              <option value="allow">Allow</option>
              <option value="deny">Deny (Drop)</option>
              <option value="reject">Reject</option>
            </Select>

            {/* Direction / Chain */}
            <Select
              label="Target Chain"
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
            >
              <option value="input">Input (Incoming)</option>
              <option value="output">Output (Outgoing)</option>
              <option value="forward">Forward (Routing)</option>
            </Select>

            {/* Protocol */}
            <Select
              label="Protocol"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as any)}
            >
              <option value="any">Any Protocol</option>
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="icmp">ICMP</option>
            </Select>
          </div>

          {/* Source address and Port */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Input
              label="Source IP / CIDR"
              value={srcAddress}
              onChange={(e) => setSrcAddress(e.target.value)}
              placeholder="any"
              className="font-mono text-xs"
            />
            <Input
              label="Source Port (Optional)"
              value={srcPort}
              onChange={(e) => setSrcPort(e.target.value)}
              disabled={protocol !== 'tcp' && protocol !== 'udp'}
              placeholder="e.g. 80, 80:90"
              className="font-mono text-xs"
            />
          </div>

          {/* Destination address and Port */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Destination IP / CIDR"
              value={dstAddress}
              onChange={(e) => setDstAddress(e.target.value)}
              placeholder="any"
              className="font-mono text-xs"
            />
            <Input
              label="Destination Port (Optional)"
              value={dstPort}
              onChange={(e) => setDstPort(e.target.value)}
              disabled={protocol !== 'tcp' && protocol !== 'udp'}
              placeholder="e.g. 443"
              className="font-mono text-xs"
            />
          </div>

          {/* Advanced: States & Logging */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <label className="block text-xs text-slate-700 dark:text-slate-300 tracking-wider mb-2">Connection Track State</label>
              <div className="flex gap-4 items-center">
                <Checkbox
                  checked={stateNew}
                  onChange={(c) => setStateNew(c)}
                  label="New"
                />
                <Checkbox
                  checked={stateEstablished}
                  onChange={(c) => setStateEstablished(c)}
                  label="Established"
                />
                <Checkbox
                  checked={stateRelated}
                  onChange={(c) => setStateRelated(c)}
                  label="Related"
                />
              </div>
            </div>

            <div className="flex items-center md:justify-end gap-3 cursor-pointer select-none" onClick={() => setLogging(!logging)}>
              <div>
                <div className="text-xs font-semibold text-slate-500">Kernel Security Log</div>
                <div className="text-xs text-slate-400">Log triggered packet details to dmesg</div>
              </div>
              {logging ? (
                <ToggleRight className="size-7 text-blue-600" strokeWidth={1.5} />
              ) : (
                <ToggleLeft className="size-7 text-slate-500" strokeWidth={1.5} />
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <Button
              type="button"
              variant="default" className='bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100'
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingRule ? 'Save Changes' : 'Apply Rule'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Rule Confirmation Dialog */}
      <Dialog
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        maxWidth="max-w-md"
        icon={<AlertTriangle className="size-7" strokeWidth={1.5} />}
        title="Confirm Rule Deletion"
        description={ruleToDelete ? `Rule ID: ${ruleToDelete}` : undefined}
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-950/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete firewall policy rule <strong className="font-mono text-slate-900 dark:text-slate-100">{ruleToDelete}</strong>? This will immediately remove the rule from active nftables chain configuration.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="default"
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
              onClick={() => setRuleToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteRule}
              isLoading={isDeleting}
              className="gap-2 cursor-pointer"
            >
              {!isDeleting && <Trash2 className="size-3.5" />}
              <span>Delete Rule</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
