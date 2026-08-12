import React from 'react'
import { X, Shield, Eye, Edit3, Zap } from 'lucide-react'

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
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
          <X className="w-3.5 h-3.5 text-slate-600" />
          <span>No Access</span>
        </span>
      )
    }

    return (
      <div className="flex items-center gap-1 font-mono text-[10px]">
        {access.read && (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded" title="Read Access">
            R
          </span>
        )}
        {access.write && (
          <span className="bg-primary/10 text-primary-hover border border-primary/20 px-1.5 py-0.2 rounded" title="Write Access">
            W
          </span>
        )}
        {access.execute && (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded" title="Execute Access">
            X
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-lg">
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Role Permission Matrix</h3>
            <p className="text-xs text-text-muted">Module access rights across Admin, Operator, Auditor, and Viewer roles</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-emerald-400" /> Read (R)</span>
          <span className="flex items-center gap-1"><Edit3 className="w-3 h-3 text-primary-hover" /> Write (W)</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Execute (X)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-app-bg/80 border-b border-border-subtle text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="py-3.5 px-6">Module Name</th>
              <th className="py-3.5 px-6 text-rose-400">Admin</th>
              <th className="py-3.5 px-6 text-primary-hover">Security Operator</th>
              <th className="py-3.5 px-6 text-amber-400">Auditor</th>
              <th className="py-3.5 px-6 text-slate-400">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {MATRIX_DATA.map((row) => (
              <tr key={row.module} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-6 font-medium text-text-primary">{row.module}</td>
                <td className="py-3.5 px-6">{renderAccessBadges(row.admin)}</td>
                <td className="py-3.5 px-6">{renderAccessBadges(row.operator)}</td>
                <td className="py-3.5 px-6">{renderAccessBadges(row.auditor)}</td>
                <td className="py-3.5 px-6">{renderAccessBadges(row.viewer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
