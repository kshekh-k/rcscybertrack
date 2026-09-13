import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserCheck,
  Layers,
  AlertTriangle,
  Lock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { UserTable } from '../components/cyber/UserTable'
import { PermissionMatrix } from '../components/cyber/PermissionMatrix'
import { User } from '../types/apiContracts'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Alert } from '../components/ui/alert'
import { Dialog } from '../components/ui/dialog'

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
    isFetching,
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
      <PageHeader
        icon={UserCheck}
        title="Users & Role-Based Access Control (RBAC)"
        description="Persistent administrative user governance, role permissions, and security controls"
        actions={
          <Button
            variant="default"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-1 bg-app-bg rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-800/50'
          }`}
        >
          <UserCheck className="size-4" />
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
          <Layers className="size-4" />
          <span>Permission Matrix</span>
        </button>
      </div>

      {/* Error state alert banner */}
      {isError && (
        <Alert
          variant="error"
          title="User Data Fetch Error"
          message={(error as Error).message}
        />
      )}

      {/* Content Rendering */}
      {activeTab === 'users' ? (
        isLoading ? (
          <div className="bg-surface rounded-xl p-12 text-center text-text-secondary">
            <RefreshCw className="size-6 animate-spin text-accent mx-auto mb-3" />
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
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <UserCheck className="size-5 text-blue-500" />
            <span>Create User Account</span>
          </span>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createUserMutation.mutate()
          }}
          className="space-y-4"
        >
          {actionError && (
            <div className="p-3 bg-red-950/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username *
            </label>
            <input
              type="text"
              required
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="e.g. secops-analyst"
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password * (Min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="analyst@rcs-cybertrack.local"
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Assigned RBAC Role *
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            >
              <option value="admin">Administrator (Full Access)</option>
              <option value="operator">Security Operator (Write Rules/Alerts)</option>
              <option value="auditor">Compliance Auditor (Read Audit/Config)</option>
              <option value="viewer">Read-Only Monitor (NOC View)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createUserMutation.isPending}
              className="gap-2"
            >
              {!createUserMutation.isPending && <Lock className="size-3.5" />}
              <span>Provision Account</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog
        isOpen={isEditOpen && !!selectedUser}
        onClose={() => setIsEditOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <UserCheck className="size-5 text-blue-500" />
            <span>Edit Account: {selectedUser?.username}</span>
          </span>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editUserMutation.mutate()
          }}
          className="space-y-4"
        >
          {actionError && (
            <div className="p-3 bg-red-950/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            >
              <option value="admin">Administrator</option>
              <option value="operator">Security Operator</option>
              <option value="auditor">Compliance Auditor</option>
              <option value="viewer">Read-Only Monitor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Reset Password (Optional)
            </label>
            <input
              type="password"
              minLength={8}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Leave blank to keep existing password"
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-lg text-sm text-slate-50 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={editUserMutation.isPending}
              className="gap-2"
            >
              {!editUserMutation.isPending && <Lock className="size-3.5" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* DISABLE USER CONFIRMATION DIALOG */}
      <Dialog
        isOpen={isDisableOpen && !!selectedUser}
        onClose={() => setIsDisableOpen(false)}
        maxWidth="max-w-md"
        title={
          <span className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="size-5" />
            <span>Disable Account Access</span>
          </span>
        }
        description={`Target User: ${selectedUser?.username}`}
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-950/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Disabling <strong className="text-slate-100">{selectedUser?.username}</strong> will immediately revoke all active JWT session tokens and block access to the RCS CyberTrack management API.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisableOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => disableUserMutation.mutate()}
              isLoading={disableUserMutation.isPending}
              className="gap-2"
            >
              {!disableUserMutation.isPending && <AlertTriangle className="size-3.5" />}
              <span>Disable User</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
