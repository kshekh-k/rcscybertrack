import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserCheck,
  Layers,
  X,
  AlertTriangle,
  Lock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { UserTable } from '../components/cyber/UserTable'
import { PermissionMatrix } from '../components/cyber/PermissionMatrix'
import { User } from '../types/apiContracts'

export default function Users() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users')

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDisableOpen, setIsDisableOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Form Fields State
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formRole, setFormRole] = useState<'admin' | 'operator' | 'auditor' | 'viewer'>('viewer')

  const token = localStorage.getItem('cybertrack_token')

  // Fetch Users Query
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to fetch user accounts')
      }
      const data = await res.json()
      return data.map((u: any) => ({
        ...u,
        status: u.enabled ? 'active' : 'disabled',
        last_login: u.last_login_at,
      }))
    },
  })

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      setActionError(null)
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          email: formEmail,
          full_name: formFullName,
          role: formRole,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create user account')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (err: Error) => {
      setActionError(err.message)
    },
  })

  // Edit User Mutation
  const editUserMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return
      setActionError(null)
      const payload: any = {
        email: formEmail,
        full_name: formFullName,
        role: formRole,
      }
      if (formPassword) {
        payload.password = formPassword
      }
      const res = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to update user account')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsEditOpen(false)
      setSelectedUser(null)
      resetForm()
    },
    onError: (err: Error) => {
      setActionError(err.message)
    },
  })

  // Disable User Mutation
  const disableUserMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return
      setActionError(null)
      const res = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to disable user account')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDisableOpen(false)
      setSelectedUser(null)
    },
    onError: (err: Error) => {
      setActionError(err.message)
    },
  })

  const resetForm = () => {
    setFormUsername('')
    setFormPassword('')
    setFormEmail('')
    setFormFullName('')
    setFormRole('viewer')
    setActionError(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setFormUsername(user.username)
    setFormEmail(user.email)
    setFormFullName(user.full_name)
    setFormRole(user.role as any)
    setFormPassword('')
    setActionError(null)
    setIsEditOpen(true)
  }

  const handleOpenDisable = (user: User) => {
    setSelectedUser(user)
    setActionError(null)
    setIsDisableOpen(true)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Users & Role-Based Access Control (RBAC)</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Persistent administrative user governance, role permissions, and security controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 bg-surface hover:bg-slate-800 border border-border-subtle text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-1 bg-app-bg border border-border-subtle rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'matrix'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Permission Matrix</span>
        </button>
      </div>

      {/* Error state alert banner */}
      {isError && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="font-semibold">User Data Fetch Error: </span>
            {(error as Error).message}
          </div>
        </div>
      )}

      {/* Content Rendering */}
      {activeTab === 'users' ? (
        isLoading ? (
          <div className="bg-surface border border-border-subtle rounded-xl p-12 text-center text-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto mb-3" />
            <p className="text-sm font-medium">Loading persistent user accounts...</p>
          </div>
        ) : (
          <UserTable
            users={users}
            onCreateUserClick={handleOpenCreate}
            onEditUserClick={handleOpenEdit}
            onDisableUserClick={handleOpenDisable}
          />
        )
      ) : (
        <PermissionMatrix />
      )}

      {/* CREATE USER DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Create User Account</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                createUserMutation.mutate()
              }}
              className="p-6 space-y-4"
            >
              {actionError && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. secops-analyst"
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Password * (Min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="analyst@rcs-cybertrack.local"
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Assigned RBAC Role *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="operator">Security Operator (Write Rules/Alerts)</option>
                  <option value="auditor">Compliance Auditor (Read Audit/Config)</option>
                  <option value="viewer">Read-Only Monitor (NOC View)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-text-secondary text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 bg-primary hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER DIALOG */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Edit Account: {selectedUser.username}</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                editUserMutation.mutate()
              }}
              className="p-6 space-y-4"
            >
              {actionError && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="admin">Administrator</option>
                  <option value="operator">Security Operator</option>
                  <option value="auditor">Compliance Auditor</option>
                  <option value="viewer">Read-Only Monitor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-text-secondary text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserMutation.isPending}
                  className="px-4 py-2 bg-primary hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {editUserMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISABLE USER CONFIRMATION DIALOG */}
      {isDisableOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-red-900/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-red-900/40 bg-red-950/30 flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Disable Account Access</h3>
                <p className="text-xs text-red-300/80">Target User: {selectedUser.username}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="text-xs text-text-secondary leading-relaxed">
                Disabling <strong className="text-text-primary">{selectedUser.username}</strong> will immediately revoke all active JWT session tokens and block access to the RCS CyberTrack management API.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDisableOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-text-secondary text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => disableUserMutation.mutate()}
                  disabled={disableUserMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {disableUserMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>Disable User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
