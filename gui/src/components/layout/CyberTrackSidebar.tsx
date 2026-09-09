import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  LayoutDashboard,
  Shield,
  Network,
  MonitorSmartphone,
  LockKeyhole,
  Globe,
  ScrollText,
  Settings2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  LogOut,
  AlertTriangle,
  UserCheck,
  BarChart3,
  Palette,
  Server,
  Activity,
  Workflow,
  Radio,
  FileCode,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    title: 'CONTROL CENTER',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'NETWORK',
    items: [
      { name: 'Interfaces', path: '/network', icon: Network },
      { name: 'Routing', path: '/network#routing', icon: Workflow, disabled: true },
      { name: 'NAT Rules', path: '/network#nat', icon: Server, disabled: true },
      { name: 'DHCP Server', path: '/network#dhcp', icon: Radio, disabled: true },
      { name: 'DNS Settings', path: '/network#dns', icon: FileCode, disabled: true },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { name: 'Firewall', path: '/firewall', icon: Shield },
      { name: 'Security Policies', path: '/firewall#policies', icon: Shield },
      { name: 'Traffic Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Alerts', path: '/alerts', icon: AlertTriangle, badge: '3' },
    ],
  },
  {
    title: 'CONNECTIVITY',
    items: [
      { name: 'VPN Tunnels', path: '/vpn', icon: LockKeyhole },
      { name: 'SD-WAN', path: '/sdwan', icon: Globe },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { name: 'Devices', path: '/devices', icon: MonitorSmartphone },
      { name: 'Analytics', path: '/analytics', icon: Activity },
      { name: 'Audit Logs', path: '/audit', icon: ScrollText },
    ],
  },
  {
    title: 'SYSTEM & ADMIN',
    items: [
      { name: 'Users & RBAC', path: '/users', icon: UserCheck },
      { name: 'Settings', path: '/settings', icon: Settings2 },
      { name: 'Design System', path: '/design-system', icon: Palette, badge: 'UI' },
    ],
  },
]

export default function CyberTrackSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] select-none transition-colors">
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-5 h-16 border-b border-[var(--sidebar-border)] relative overflow-hidden transition-all duration-300',
          collapsed && 'px-3 justify-center'
        )}
      >
        <div className="flex items-center justify-center w-9 h-9 bg-blue-600/10 border border-blue-500/30 rounded-xl shrink-0">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">RCS CyberTrack</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Firewall Appliance</span>
          </div>
        )}

        {/* Toggle Collapse Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-800 rounded items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed ? (
              <span className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-widest block uppercase">
                {group.title}
              </span>
            ) : (
              <div className="h-[1px] bg-slate-200 dark:bg-slate-800 mx-2 my-3" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item, itemIdx) => {
                const IconComponent = item.icon
                const isActive = location.pathname === item.path
                const isDisabled = item.disabled

                return (
                  <NavLink
                    key={itemIdx}
                    to={isDisabled ? '#' : item.path}
                    onClick={(e) => {
                      if (isDisabled) e.preventDefault()
                      else setMobileOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative group',
                      isActive
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60',
                      isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-400'
                    )}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r" />
                    )}

                    <IconComponent
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      )}
                    />

                    {!collapsed && <span className="truncate">{item.name}</span>}

                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip when Collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                        {item.name} {isDisabled && '(Coming Soon)'}
                      </div>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Appliance Core Status Card */}
      <div className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]">
        {!collapsed ? (
          <div className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Appliance Engine</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Operational</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 group relative">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-[var(--sidebar-border)] relative">
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-slate-700 dark:text-slate-300 group',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <CircleUserRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{api.getUsername()}</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate">Security Admin</span>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        {userMenuOpen && (
          <div
            className={cn(
              'absolute bottom-full mb-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-[calc(100%-24px)] left-3 py-1.5 z-50 transition-all',
              collapsed && 'w-44 left-16 bottom-3'
            )}
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Profile & Session
            </div>
            <button
              onClick={() => {
                setUserMenuOpen(false)
                navigate('/settings')
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CircleUserRound className="w-3.5 h-3.5 text-blue-500" />
              Settings Profile
            </button>
            <button
              onClick={() => {
                setUserMenuOpen(false)
                api.logout()
                navigate('/login')
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              Logout Session
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-2 border-t border-[var(--sidebar-border)] text-[9px] text-slate-400 font-mono select-none">
          CyberTrack v0.6.1 OS
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'hidden md:block h-screen sticky top-0 transition-all duration-300 z-30 shrink-0',
          collapsed ? 'w-[72px]' : 'w-[250px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          <aside className="relative flex flex-col w-[260px] h-full shadow-2xl animate-in slide-in-from-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
