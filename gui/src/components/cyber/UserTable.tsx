import React, { useState } from 'react'
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  UserX,
  Lock,
  Mail,
} from 'lucide-react'
import { User } from '../../types/apiContracts'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'
import { Button } from '../ui/button'

interface UserTableProps {
  users: User[]
  onCreateUserClick: () => void
  onEditUserClick: (user: User) => void
  onDisableUserClick: (user: User) => void
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onCreateUserClick,
  onEditUserClick,
  onDisableUserClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg space-y-0">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, name, email..."
            className="w-full bg-app-bg border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-app-bg border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operator">Security Operator</option>
              <option value="auditor">Auditor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-app-bg border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Create User Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateUserClick}
            className="gap-1.5 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-app-bg/80 border-b border-border-subtle text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="py-3.5 px-6">User / Full Name</th>
              <th className="py-3.5 px-6">Email</th>
              <th className="py-3.5 px-6">Role</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">MFA</th>
              <th className="py-3.5 px-6">Created / Last Login</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {filteredUsers.map((u) => {
              const statusVariant =
                u.status === 'active'
                  ? 'success'
                  : u.status === 'pending'
                  ? 'warning'
                  : 'danger'

              return (
                <tr
                  key={u.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* User / Full Name */}
                  <td className="py-4 px-6 font-semibold text-text-primary">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs shrink-0">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-mono text-text-primary">{u.username}</p>
                        <p className="text-[11px] text-text-muted font-sans font-normal">{u.full_name}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-6 font-mono text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{u.email}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-6">
                    <RoleBadge role={u.role} />
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <StatusBadge status={u.status} variant={statusVariant} />
                  </td>

                  {/* MFA */}
                  <td className="py-4 px-6">
                    {u.mfa_enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <Lock className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">Disabled</span>
                    )}
                  </td>

                  {/* Created / Last Login */}
                  <td className="py-4 px-6 font-mono text-[11px] text-text-muted">
                    <p>{new Date(u.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-500">
                      Last: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditUserClick(u)}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-800 rounded transition-colors"
                        title="Edit User Role/Status"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDisableUserClick(u)}
                        className="p-1.5 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        title="Disable User Account"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
