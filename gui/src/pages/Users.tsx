import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserCheck,
  Layers,
  AlertTriangle,
  Lock,
  RefreshCw,
  AlertCircle,
  Users as UsersIcon,
  ShieldCheck,
  UserX,
  Shield,
} from 'lucide-react'
import { UserTable } from '../components/cyber/UserTable'
import { PermissionMatrix } from '../components/cyber/PermissionMatrix'
import { CapabilityNotice } from '../components/cyber/CapabilityNotice'
import { MetricCard } from '../components/cyber/MetricCard'
import { User } from '../types/apiContracts'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Alert } from '../components/ui/alert'
import { Dialog } from '../components/ui/dialog'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'

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

  // Summary counts
  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
    admins: users.filter((u) => u.role === 'admin').length,
  }), [users])

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
    <div className="space-y-6">
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

      {/* Backend Contract Banner */}
      <CapabilityNotice
        moduleName="User Administration & RBAC Subsystem"
        expectedEndpoint="GET /api/v1/users"
        description="Administrative account governance, permission roles, and persistent JWT session controls."
      />

      {/* Summary KPI Breakdown Cards */}
      <div className="max-w-full overflow-x-auto on-hover-scroll pt-2 pb-3 -mt-2">
        <div className="flex gap-3 w-full">
          {[
            {
              title: 'Total Accounts',
              value: counts.total,
              icon: UsersIcon,
              subtitle: 'Provisioned user accounts',
              className: 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/20 min-w-64',
            },
            {
              title: 'Active Users',
              value: counts.active,
              icon: ShieldCheck,
              subtitle: 'Enabled API / UI access',
              className: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 min-w-64',
            },
            {
              title: 'Disabled Accounts',
              value: counts.disabled,
              icon: UserX,
              subtitle: 'Revoked access sessions',
              className: 'bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-rose-500/20 min-w-64',
            },
            {
              title: 'Administrators',
              value: counts.admins,
              icon: Shield,
              subtitle: 'Full access RBAC role',
              className: 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md shadow-purple-500/20 min-w-64',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <MetricCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={<Icon className="size-5 text-white" />}
                subtitle={item.subtitle}
                className={`w-full ${item.className}`}
              />
            )
          })}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 pb-3 overflow-x-auto on-hover-scroll max-w-full md:w-fit">
        {[
          { id: 'users', label: `User Accounts (${users.length})`, icon: UserCheck },
          { id: 'matrix', label: 'Permission Matrix', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'primary' : 'ghost'}
              size="lg"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="whitespace-nowrap gap-2 shadow-md bg-(--topbar-bg) hover:bg-blue-500 hover:text-white"
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </Button>
          )
        })}
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
        icon={<UserCheck className="size-7 text-blue-600 shrink-0" strokeWidth={1.5} />}
        title="Create User Account"
        description="Provision a new user account with assigned role and credentials."
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createUserMutation.mutate()
          }}
          className="space-y-4"
        >
          {actionError && (
            <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-lg font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          <Input
            label="Username *"
            type="text"
            required
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            placeholder="e.g. secops-analyst"
            className="font-mono text-xs"
          />

          <Input
            label="Password * (Min 8 characters)"
            type="password"
            required
            minLength={8}
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            placeholder="••••••••••••"
            className="font-mono text-xs"
          />

          <Input
            label="Email Address *"
            type="email"
            required
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="analyst@rcs-cybertrack.local"
            className="font-mono text-xs"
          />

          <Input
            label="Full Name *"
            type="text"
            required
            value={formFullName}
            onChange={(e) => setFormFullName(e.target.value)}
            placeholder="e.g. Alex Mercer"
          />

          <Select
            label="Assigned RBAC Role *"
            value={formRole}
            onChange={(e) => setFormRole(e.target.value as any)}
          >
            <option value="admin">Administrator (Full Access)</option>
            <option value="operator">Security Operator (Write Rules/Alerts)</option>
            <option value="auditor">Compliance Auditor (Read Audit/Config)</option>
            <option value="viewer">Read-Only Monitor (NOC View)</option>
          </Select>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="default"
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
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
        icon={<UserCheck className="size-7 text-blue-600 shrink-0" strokeWidth={1.5} />}
        title={`Edit Account: ${selectedUser?.username}`}
        description="Update email address, full name, assigned role, or reset password."
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editUserMutation.mutate()
          }}
          className="space-y-4"
        >
          {actionError && (
            <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-lg font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            required
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            className="font-mono text-xs"
          />

          <Input
            label="Full Name"
            type="text"
            required
            value={formFullName}
            onChange={(e) => setFormFullName(e.target.value)}
          />

          <Select
            label="Assigned Role"
            value={formRole}
            onChange={(e) => setFormRole(e.target.value as any)}
          >
            <option value="admin">Administrator</option>
            <option value="operator">Security Operator</option>
            <option value="auditor">Compliance Auditor</option>
            <option value="viewer">Read-Only Monitor</option>
          </Select>

          <Input
            label="Reset Password (Optional)"
            type="password"
            minLength={8}
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            placeholder="Leave blank to keep existing password"
            className="font-mono text-xs"
          />

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="default"
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
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
        icon={<AlertTriangle className="size-7 text-rose-500 shrink-0" strokeWidth={1.5} />}
        title="Disable Account Access"
        description={`Target User: ${selectedUser?.username}`}
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-lg font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Disabling <strong className="font-mono text-slate-900 dark:text-slate-100">{selectedUser?.username}</strong> will immediately revoke all active JWT session tokens and block access to the RCS CyberTrack management API.
          </p>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="default"
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
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
