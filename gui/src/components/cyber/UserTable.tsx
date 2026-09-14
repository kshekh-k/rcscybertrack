import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  UserX,
  Lock,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { User } from '../../types/apiContracts'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { Input } from '../ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'

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
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  return (
    <div className="space-y-4 -mt-3">
      {/* Controls Bar */}
      <div className="bg-(--topbar-bg) rounded p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <Input
          icon={<Search className="size-4 text-slate-500 dark:text-slate-400" />}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search username, name, email..."
          containerClassName="flex-1 max-w-md"
          className="h-9 py-1.5 text-xs"
        />

        {/* Filters & Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Role:</span>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operator">Security Operator</option>
              <option value="auditor">Auditor</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted font-medium">Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="pending">Pending</option>
            </Select>
          </div>

          {/* Create User Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateUserClick}
            className="gap-1.5 shrink-0"
          >
            <UserPlus className="size-3.5" />
            <span>Create User</span>
          </Button>
        </div>
      </div>

      {/* Main Console Box / Table */}
      <Card className="overflow-hidden shadow-lg border-0 block! -mt-3!">
        <CardHeader className="flex flex-wrap gap-1 flex-row items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 space-y-0">
          <CardTitle className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <UserCheck className="size-5 text-blue-600" />
            <span>Administrative User Directory</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <label htmlFor="pageSizeSelectHeader" className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Show</label>
              <Select
                id="pageSizeSelectHeader"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 py-1 text-xs font-mono"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden block!">
          <div className="overflow-x-auto on-hover-scroll min-w-0 w-full">
            <table className="text-left border-collapse table-auto w-max min-w-full">
              <thead>
                <tr className="bg-slate-200/30 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">User / Full Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 whitespace-nowrap">Role</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">MFA</th>
                  <th className="px-4 py-3 whitespace-nowrap">Created / Last Login</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {paginatedUsers.map((u) => {
                  const statusVariant =
                    u.status === 'active'
                      ? 'success'
                      : u.status === 'pending'
                        ? 'warning'
                        : 'danger'

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors group"
                    >
                      {/* User / Full Name */}
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-mono text-xs shrink-0">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-mono text-slate-900 dark:text-slate-50">{u.username}</p>
                            <p className="text-2xs text-slate-500 dark:text-slate-400 font-sans font-normal">{u.full_name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} variant={statusVariant} />
                      </td>

                      {/* MFA */}
                      <td className="px-4 py-3">
                        {u.mfa_enabled ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-mono text-emerald-500 dark:text-emerald-400">
                            <Lock className="size-3" /> Enabled
                          </span>
                        ) : (
                          <span className="text-2xs font-mono text-slate-400">Disabled</span>
                        )}
                      </td>

                      {/* Created / Last Login */}
                      <td className="px-4 py-3 font-mono text-2xs text-slate-600 dark:text-slate-400">
                        <p>{new Date(u.created_at).toLocaleDateString()}</p>
                        <p className="text-3xs text-slate-400">
                          Last: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditUserClick(u)}
                            className="size-7 relative text-emerald-500! hover:text-emerald-600! hover:bg-emerald-500/10! cursor-pointer"
                            title="Edit User Role/Status"
                          >
                            <Edit2 className="size-3.5" />
                            <span className="sr-only">Edit User</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDisableUserClick(u)}
                            className="size-7 relative text-rose-500! hover:text-rose-600! hover:bg-rose-500/10! cursor-pointer"
                            title="Disable User Account"
                          >
                            <UserX className="size-3.5" />
                            <span className="sr-only">Disable User</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>

        {filteredUsers.length > 0 && (
          <CardFooter className="flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="pageSizeSelectFooter" className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Show</label>
                <Select
                  id="pageSizeSelectFooter"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 py-1 text-xs font-mono"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                </Select>
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
                  {Math.min(currentPage * pageSize, filteredUsers.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredUsers.length}
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
    </div>
  )
}
