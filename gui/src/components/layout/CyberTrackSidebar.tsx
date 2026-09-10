import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  LayoutDashboard,
  Flame,
  ShieldCheck,
  Network,
  MonitorSmartphone,
  LockKeyhole,
  Globe,
  ScrollText,
  Settings2,
  CircleUserRound,
  LogOut,
  AlertTriangle,
  UserCheck,
  BarChart3,
  Palette,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useBrand } from '../../lib/brand'

interface SidebarProps {
  collapsed: boolean
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
      { name: 'Analytics & Traffic', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { name: 'Firewall', path: '/firewall', icon: Flame },
      { name: 'Security Policies', path: '/firewall#policies', icon: ShieldCheck },
      { name: 'Alerts', path: '/alerts', icon: AlertTriangle, badge: 'Live' },
    ],
  },
  {
    title: 'CONNECTIVITY',
    items: [
      { name: 'Interfaces', path: '/network', icon: Network },
      { name: 'VPN Tunnels', path: '/vpn', icon: LockKeyhole },
      { name: 'SD-WAN', path: '/sdwan', icon: Globe },
    ],
  },
  {
    title: 'MONITORING & GOVERNANCE',
    items: [
      { name: 'Devices', path: '/devices', icon: MonitorSmartphone },
      { name: 'Audit Logs', path: '/audit', icon: ScrollText },
      { name: 'Users & RBAC', path: '/users', icon: UserCheck },
      { name: 'Settings', path: '/settings', icon: Settings2 },
      { name: 'Design System', path: '/design-system', icon: Palette, badge: 'UI' },
    ],
  },
]

interface SidebarViewProps {
  locationPath: string
  navigate: (path: string) => void
  brand: ReturnType<typeof useBrand>['brand']
  getLogoLight: () => string
  getLogoDark: () => string
  getIconLight: () => string
  getIconDark: () => string
  userMenuOpen: boolean
  setUserMenuOpen: (open: boolean) => void
  setMobileOpen: (open: boolean) => void
  userMenuRef?: React.RefObject<HTMLDivElement | null>
}

/* Dedicated Expanded Sidebar View */
function ExpandedSidebarView({
  locationPath,
  navigate,
  brand,
  getLogoLight,
  getLogoDark,
  userMenuOpen,
  setUserMenuOpen,
  setMobileOpen,
  userMenuRef,
}: SidebarViewProps) {
  return (
    <div className="flex flex-col h-full bg-(--sidebar-bg) select-none transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 h-16 bg-slate-200/30 dark:bg-slate-800/60 relative overflow-hidden shrink-0">
        <div className="flex items-center justify-center">
          <img
            src={getLogoDark()}
            alt={brand.brandName}
            className="hidden dark:block h-10 w-auto object-contain"
          />
          <img
            src={getLogoLight()}
            alt={brand.brandName}
            className="block dark:hidden h-10 w-auto object-contain"
          />
        </div>
        <div className="flex flex-col sr-only">
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">{brand.brandName}</span>
          <span className="text-4xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">{brand.tagline}</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <span className="px-6 text-3xs font-bold text-slate-400 dark:text-slate-500 tracking-widest block uppercase pb-1">
              {group.title}
            </span>

            <div className="space-y-0.5">
              {group.items.map((item, itemIdx) => {
                const IconComponent = item.icon
                const isActive = locationPath === item.path
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
                      'flex items-center gap-2 pl-6! p-2.5 text-sm font-medium transition-all duration-150 relative group',
                      isActive
                        ? 'bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/20',
                      isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-400'
                    )}
                  >
                    <IconComponent
                      className={cn(
                        'size-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      )}
                    />

                    <span className="truncate">{item.name}</span>

                    {item.badge && (
                      <span
                        className={`ml-auto text-4xs font-bold px-1.5 py-1 rounded ${isActive
                          ? 'bg-linear-to-r from-white to-blue-200 text-blue-600 dark:text-blue-400'
                          : 'bg-linear-to-r from-emerald-500 to-sky-500 text-white'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Section */}
      <div ref={userMenuRef} className="border-t border-(--sidebar-border) relative shrink-0">
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex pl-6 p-2.5 items-center gap-2 transition-colors cursor-pointer text-slate-700 dark:text-slate-300 group hover:bg-slate-200 dark:hover:bg-slate-800/20"
        >
          <div className="relative shrink-0">

            <CircleUserRound className="size-7 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1} />

            <span className="absolute bottom-0 right-0 flex size-2.5">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950"></span>
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-3xs font-semibold text-slate-900 dark:text-slate-100 truncate">{api.getUsername()}</span>
              <span className="text-4xs font-semibold px-1.5 py-0.5 rounded bg-linear-to-r from-emerald-500 to-sky-500 text-white">
                Online
              </span>
            </div>
            <span className="text-4xs text-slate-500 dark:text-slate-400 truncate">Security Admin • Engine Active</span>
          </div>
        </div>

        {userMenuOpen && (
          <div className="absolute bottom-full mb-2 bg-white dark:bg-slate-900 rounded shadow-xl w-[calc(100%-24px)] left-3 z-50 transition-all">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-4xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Profile & Session</span>
              <span className="text-emerald-500 font-normal">● Engine Active</span>
            </div>
            <button
              onClick={() => {
                setUserMenuOpen(false)
                navigate('/settings')
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CircleUserRound className="size-4" />
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
              <LogOut className="size-4 text-red-500" />
              Logout Session
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-(--sidebar-border) text-4xs text-slate-400 font-mono select-none shrink-0">
        RCS CyberTrack v2.1.0 OS
      </div>
    </div>
  )
}

/* Dedicated Collapsed Sidebar View */
function CollapsedSidebarView({
  locationPath,
  navigate,
  brand,
  getIconLight,
  getIconDark,
  userMenuOpen,
  setUserMenuOpen,
  setMobileOpen,
  userMenuRef,
}: SidebarViewProps) {
  return (
    <div className="flex flex-col h-full bg-(--sidebar-bg) select-none transition-colors shadow-lg">
      {/* Brand Header Icon */}
      <div className="flex items-center justify-center h-16 bg-slate-200/30 dark:bg-slate-800/60 shrink-0">
        <img
          src={getIconDark()}
          alt={brand.brandName}
          className="hidden dark:block size-14 w-auto object-contain"
        />
        <img
          src={getIconLight()}
          alt={brand.brandName}
          className="block dark:hidden size-14 w-auto object-contain"
        />
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-visible py-4 space-y-4">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="h-px bg-(--sidebar-border) mx-3 my-2" />

            <div className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const IconComponent = item.icon
                const isActive = locationPath === item.path
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
                      'flex items-center justify-center size-10 mx-auto rounded transition-all duration-150 relative group',
                      isActive
                        ? 'bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/20',
                      isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-400'
                    )}
                  >
                    <IconComponent
                      className={cn(
                        'size-5 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      )}
                    />

                    {/* Instant Clean Tooltip */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-100 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50 shadow-2xl flex items-center gap-1.5 translate-x-10 group-hover:translate-x-3 ">
                      <span>{item.name}</span>
                      {isDisabled && <span className="text-3xs text-amber-400 font-normal">(Coming Soon)</span>}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 bg-white dark:bg-slate-900 rotate-45" />
                    </div>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Section (Collapsed Avatar) */}
      <div ref={userMenuRef} className="p-2 border-t border-(--sidebar-border) relative shrink-0 flex justify-center">
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="relative size-10 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-center group"
        >
          <div className="relative">

            <CircleUserRound className="size-7 text-blue-600 dark:text-blue-400" strokeWidth={1} />

            <span className="absolute bottom-0 right-0 flex size-2.5">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950"></span>
            </span>
          </div>
        </div>

        {/* User Dropdown for Collapsed Sidebar */}
        {userMenuOpen && (
          <div className="absolute bottom-3 left-16 mb-0 bg-slate-200 dark:bg-slate-950 rounded shadow-xl w-54 z-50 transition-all translate-x-3.5">
            <div className="absolute -left-1 bottom-3 -translate-y-1/2 size-2 bg-slate-200 dark:bg-slate-950 rotate-45" />
            <div className='relative bg-slate-200 dark:bg-slate-950 rounded'>
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-4xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Profile & Session</span>
                <span className="text-emerald-500 font-normal">● Engine Active</span>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false)
                  navigate('/settings')
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <CircleUserRound className="size-4" />
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
                <LogOut className="size-3.5 text-red-500" />
                Logout Session
              </button>

            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default function CyberTrackSidebar({ collapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const brandContext = useBrand()

  const expandedUserMenuRef = useRef<HTMLDivElement | null>(null)
  const collapsedUserMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!userMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideExpanded = expandedUserMenuRef.current?.contains(target)
      const isInsideCollapsed = collapsedUserMenuRef.current?.contains(target)

      if (!isInsideExpanded && !isInsideCollapsed) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const expandedViewProps: SidebarViewProps = {
    locationPath: location.pathname,
    navigate,
    brand: brandContext.brand,
    getLogoLight: brandContext.getLogoLight,
    getLogoDark: brandContext.getLogoDark,
    getIconLight: brandContext.getIconLight,
    getIconDark: brandContext.getIconDark,
    userMenuOpen,
    setUserMenuOpen,
    setMobileOpen,
    userMenuRef: expandedUserMenuRef,
  }

  const collapsedViewProps: SidebarViewProps = {
    ...expandedViewProps,
    userMenuRef: collapsedUserMenuRef,
  }

  return (
    <>
      <aside
        className={cn(
          'hidden md:block h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 shrink-0 bg-(--sidebar-bg)',
          collapsed ? 'w-18 overflow-visible' : 'w-62.5 overflow-hidden'
        )}
      >
        {/* Expanded View Animated Sliding Layer */}
        <div
          className={cn(
            'absolute inset-0 w-62.5 transition-all duration-300 ease-in-out transform overflow-hidden',
            !collapsed
              ? 'translate-x-0 opacity-100 pointer-events-auto z-10'
              : '-translate-x-full opacity-0 pointer-events-none z-0'
          )}
        >
          <ExpandedSidebarView {...expandedViewProps} />
        </div>

        {/* Collapsed View Animated Sliding Layer */}
        <div
          className={cn(
            'absolute inset-0 w-18 transition-all duration-300 ease-in-out transform',
            collapsed
              ? 'translate-x-0 opacity-100 pointer-events-auto z-10'
              : '-translate-x-full opacity-0 pointer-events-none z-0'
          )}
        >
          <CollapsedSidebarView {...collapsedViewProps} />
        </div>
      </aside>

      {/* Mobile Drawer (Always renders Expanded View) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          <aside className="relative flex flex-col w-65 h-full shadow-2xl animate-in slide-in-from-left">
            <ExpandedSidebarView {...expandedViewProps} />
          </aside>
        </div>
      )}
    </>
  )
}
