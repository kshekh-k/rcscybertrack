import { useState, useEffect } from 'react'
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileCode,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { api, FirewallRule } from '../lib/api'

export default function Firewall() {
  const [rules, setRules] = useState<FirewallRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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

  useEffect(() => {
    loadRules()
  }, [])

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
      loadRules()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to apply rule')
    }
  }

  // Handle Delete Action
  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete rule "${id}"?`)) {
      return
    }

    try {
      await api.deleteFirewallRule(id)
      loadRules()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete rule')
    }
  }

  // Backend nftables status state
  const [backendStatus, setBackendStatus] = useState<any>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const loadBackendStatus = async () => {
    try {
      const token = localStorage.getItem('cybertrack_token')
      const res = await fetch('/api/v1/firewall/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBackendStatus(data)
      }
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
      const token = localStorage.getItem('cybertrack_token')
      const res = await fetch('/api/v1/firewall/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Validation failed')
      setStatusMsg('nftables Ruleset Validation PASSED!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    }
  }

  const handleApply = async () => {
    setStatusMsg(null)
    setError(null)
    setApplying(true)
    try {
      const token = localStorage.getItem('cybertrack_token')
      const res = await fetch('/api/v1/firewall/apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Firewall apply failed')
      setStatusMsg('Ruleset APPLIED & VERIFIED on nftables table inet rcs_cybertrack!')
      loadBackendStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Firewall apply failed')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#2563EB]" />
            <h1 className="text-2xl font-semibold text-[#F8FAFC]">Firewall Policies</h1>
          </div>
          <p className="text-sm text-[#94A3B8]">Configure stateful security rules applied to local nftables table inet rcs_cybertrack.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleValidate}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-700 transition-colors"
          >
            Validate Ruleset
          </button>
          <button 
            onClick={handleApply}
            disabled={applying}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/20 disabled:opacity-50"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Apply to nftables</span>
          </button>
          <button 
            onClick={() => openModal(null)}
            className="bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-blue-900/10"
          >
            <Plus className="w-4 h-4" /> Add Security Rule
          </button>
        </div>
      </div>

      {/* Backend Status Notification */}
      {backendStatus && (
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${backendStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>Backend: <strong className="text-white font-mono">{backendStatus.backend}</strong> ({backendStatus.version || 'Detection active'})</span>
            <span className="text-slate-500">|</span>
            <span>Managed Table: <strong className="text-cyan-400 font-mono">table inet {backendStatus.table_name}</strong></span>
          </div>
          <span className="font-mono text-slate-400">Rules Active: {backendStatus.rule_count}</span>
        </div>
      )}

      {statusMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Chain Policy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">INPUT Chain</div>
            <div className="text-sm font-semibold text-[#F8FAFC] mt-0.5">DEFAULT DROP</div>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/5 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">OUTPUT Chain</div>
            <div className="text-sm font-semibold text-[#F8FAFC] mt-0.5">DEFAULT ACCEPT</div>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">FORWARD Chain</div>
            <div className="text-sm font-semibold text-[#F8FAFC] mt-0.5">DEFAULT DROP</div>
          </div>
        </div>
      </div>

      {/* Rules Database Panel */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Active Ruleset</h2>
          </div>
          <button 
            onClick={loadRules} 
            className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Refresh Rules
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-[#94A3B8]">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <span>Retrieving nftables policies...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <span className="text-sm text-[#F8FAFC] font-semibold">Failed to load rules</span>
            <span className="text-xs text-[#94A3B8] max-w-md">{error}</span>
            <button 
              onClick={loadRules}
              className="mt-2 text-xs bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="w-10 h-10 text-[#64748B] mb-2" />
            <span className="text-sm text-[#F8FAFC] font-semibold">No rules configured</span>
            <span className="text-xs text-[#94A3B8] max-w-xs mt-1">Add a security policy rule above to populate the active table.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0F1C] border-b border-[#1E293B] text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-6 py-3.5">ID / Name</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Chain</th>
                  <th className="px-6 py-3.5">Interface</th>
                  <th className="px-6 py-3.5">Proto</th>
                  <th className="px-6 py-3.5">Source IP / Port</th>
                  <th className="px-6 py-3.5">Dest IP / Port</th>
                  <th className="px-6 py-3.5">State</th>
                  <th className="px-6 py-3.5">Log</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] text-xs">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#0A0F1C]/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-[#F8FAFC]">{rule.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rule.action === 'allow' ? 'bg-green-500/10 text-green-400' :
                        rule.action === 'deny' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {rule.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8] font-semibold capitalize">{rule.direction}</td>
                    <td className="px-6 py-4 text-[#94A3B8] font-mono">{rule.interface || 'any'}</td>
                    <td className="px-6 py-4 text-[#94A3B8] font-mono uppercase">{rule.protocol}</td>
                    <td className="px-6 py-4 text-[#94A3B8] font-mono">
                      {rule.source.address}
                      {rule.source.port ? `:${rule.source.port}` : ''}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8] font-mono">
                      {rule.destination.address}
                      {rule.destination.port ? `:${rule.destination.port}` : ''}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8]">
                      {rule.state.length > 0 ? (
                        <div className="flex gap-1">
                          {rule.state.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-[#1E293B] text-[9px] text-[#94A3B8] font-semibold uppercase">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#64748B]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8]">
                      {rule.logging ? (
                        <span className="text-[#2563EB] font-semibold text-[10px] uppercase">Active</span>
                      ) : (
                        <span className="text-[#64748B]">Off</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button 
                          onClick={() => openModal(rule)}
                          className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded hover:bg-[#1E293B] transition-colors cursor-pointer"
                          title="Edit Policy"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Rules Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setModalOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-[#1E293B]">
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                {editingRule ? 'Edit Firewall Policy Rule' : 'Create New Firewall Policy Rule'}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">Configure ports, addresses, and actions below. Changes apply instantly to nftables.</p>
            </div>

            {formError && (
              <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rule ID */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Rule ID</label>
                  <input 
                    type="text"
                    value={ruleId}
                    onChange={(e) => setRuleId(e.target.value)}
                    disabled={!!editingRule}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors font-mono"
                    placeholder="rule-allow-dns"
                  />
                </div>

                {/* Interface */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Link Interface (Optional)</label>
                  <input 
                    type="text"
                    value={netInterface}
                    onChange={(e) => setNetInterface(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] transition-colors font-mono"
                    placeholder="eth0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Action */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Action</label>
                  <select 
                    value={action} 
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] transition-colors"
                  >
                    <option value="allow">Allow</option>
                    <option value="deny">Deny (Drop)</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                {/* Direction / Chain */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Target Chain</label>
                  <select 
                    value={direction} 
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] transition-colors"
                  >
                    <option value="input">Input (Incoming)</option>
                    <option value="output">Output (Outgoing)</option>
                    <option value="forward">Forward (Routing)</option>
                  </select>
                </div>

                {/* Protocol */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Protocol</label>
                  <select 
                    value={protocol} 
                    onChange={(e) => setProtocol(e.target.value as any)}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] transition-colors"
                  >
                    <option value="any">Any Protocol</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                  </select>
                </div>
              </div>

              {/* Source address and Port */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1E293B] pt-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Source IP / CIDR</label>
                  <input 
                    type="text"
                    value={srcAddress}
                    onChange={(e) => setSrcAddress(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] transition-colors font-mono"
                    placeholder="any"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Source Port (Optional)</label>
                  <input 
                    type="text"
                    value={srcPort}
                    onChange={(e) => setSrcPort(e.target.value)}
                    disabled={protocol !== 'tcp' && protocol !== 'udp'}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
                    placeholder="e.g. 80, 80:90"
                  />
                </div>
              </div>

              {/* Destination address and Port */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Destination IP / CIDR</label>
                  <input 
                    type="text"
                    value={dstAddress}
                    onChange={(e) => setDstAddress(e.target.value)}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] transition-colors font-mono"
                    placeholder="any"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Destination Port (Optional)</label>
                  <input 
                    type="text"
                    value={dstPort}
                    onChange={(e) => setDstPort(e.target.value)}
                    disabled={protocol !== 'tcp' && protocol !== 'udp'}
                    className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono"
                    placeholder="e.g. 443"
                  />
                </div>
              </div>

              {/* Advanced: States & Logging */}
              <div className="border-t border-[#1E293B] pt-4 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Connection Track State</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stateNew} 
                        onChange={(e) => setStateNew(e.target.checked)} 
                        className="rounded border-[#1E293B] bg-[#070B14] text-[#2563EB] focus:ring-0 cursor-pointer"
                      />
                      <span>New</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stateEstablished} 
                        onChange={(e) => setStateEstablished(e.target.checked)} 
                        className="rounded border-[#1E293B] bg-[#070B14] text-[#2563EB] focus:ring-0 cursor-pointer"
                      />
                      <span>Established</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stateRelated} 
                        onChange={(e) => setStateRelated(e.target.checked)} 
                        className="rounded border-[#1E293B] bg-[#070B14] text-[#2563EB] focus:ring-0 cursor-pointer"
                      />
                      <span>Related</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center md:justify-end gap-3 cursor-pointer select-none" onClick={() => setLogging(!logging)}>
                  <div>
                    <div className="text-xs font-semibold text-[#F8FAFC]">Kernel Security Log</div>
                    <div className="text-[10px] text-[#94A3B8]">Log triggered packet details to dmesg</div>
                  </div>
                  {logging ? (
                    <ToggleRight className="w-9 h-9 text-[#2563EB]" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-[#64748B]" />
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-[#1E293B] pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="bg-[#1E293B] hover:bg-[#334155] text-xs text-[#F8FAFC] font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#2563EB] hover:bg-[#3B82F6] text-xs text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-lg"
                >
                  {editingRule ? 'Save Changes' : 'Apply Rule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
