import React from 'react'
import { X, Shield, Eye, Edit3, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'

interface ModuleAccess {
  module: string
  admin: { read: boolean; write: boolean; execute: boolean }
  operator: { read: boolean; write: boolean; execute: boolean }
  auditor: { read: boolean; write: boolean; execute: boolean }
  viewer: { read: boolean; write: boolean; execute: boolean }
}

const MATRIX_DATA: ModuleAccess[] = [
  {
    module: 'Dashboard Overview',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: false, execute: false },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
  {
    module: 'Firewall Engine (Rules)',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: true, execute: true },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
  {
    module: 'Network Interfaces & Routes',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: true, execute: false },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
  {
    module: 'Connected Devices',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: true, execute: false },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
  {
    module: 'System Audit Logs',
    admin: { read: true, write: true, execute: true },
    operator: { read: false, write: false, execute: false },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: false, write: false, execute: false },
  },
  {
    module: 'Users & RBAC',
    admin: { read: true, write: true, execute: true },
    operator: { read: false, write: false, execute: false },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: false, write: false, execute: false },
  },
  {
    module: 'System Settings',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: false, execute: false },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
  {
    module: 'VPN Tunnels',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: true, execute: true },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
  {
    module: 'SD-WAN Orchestration',
    admin: { read: true, write: true, execute: true },
    operator: { read: true, write: true, execute: true },
    auditor: { read: true, write: false, execute: false },
    viewer: { read: true, write: false, execute: false },
  },
]

export const PermissionMatrix: React.FC = () => {
  const renderAccessBadges = (access: { read: boolean; write: boolean; execute: boolean }) => {
    if (!access.read && !access.write && !access.execute) {
      return (
        <span className="inline-flex items-center gap-1 text-2xs font-mono text-slate-400 dark:text-slate-500">
          <X className="size-3 text-slate-400 dark:text-slate-500" />
          <span>No Access</span>
        </span>
      )
    }

    return (
      <div className="flex items-center gap-1 font-mono text-3xs">
        {access.read && (
          <span
            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold text-3xs"
            title="Read Access"
          >
            R
          </span>
        )}
        {access.write && (
          <span
            className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold text-3xs"
            title="Write Access"
          >
            W
          </span>
        )}
        {access.execute && (
          <span
            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold text-3xs "
            title="Execute Access"
          >
            X
          </span>
        )}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden shadow-lg border-0 block! -mt-3">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-800 space-y-0">
        <div className="flex items-center gap-3">

          <Shield className="size-7 shrink-0 text-blue-600" strokeWidth={1.5} />

          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Role Permission Matrix
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Module access rights across Admin, Operator, Auditor, and Viewer roles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-3xs font-mono text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="size-3 text-emerald-600 dark:text-emerald-400" /> Read (R)
          </span>
          <span className="flex items-center gap-1">
            <Edit3 className="size-3 text-blue-600 dark:text-blue-400" /> Write (W)
          </span>
          <span className="flex items-center gap-1">
            <Zap className="size-3 text-amber-600 dark:text-amber-400" /> Execute (X)
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Module Name</th>
                <th className="py-3 px-4 text-rose-600 dark:text-rose-400 font-bold">Admin</th>
                <th className="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">Security Operator</th>
                <th className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">Auditor</th>
                <th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {MATRIX_DATA.map((row) => (
                <tr key={row.module} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{row.module}</td>
                  <td className="py-3 px-4">{renderAccessBadges(row.admin)}</td>
                  <td className="py-3 px-4">{renderAccessBadges(row.operator)}</td>
                  <td className="py-3 px-4">{renderAccessBadges(row.auditor)}</td>
                  <td className="py-3 px-4">{renderAccessBadges(row.viewer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-0">
        <div className="text-3xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{MATRIX_DATA.length}</span> module access control rules
        </div>
        <div className="text-3xs font-mono text-slate-400">RBAC Policy Engine v1.0 Active</div>
      </CardFooter>
    </Card>
  )
}
