import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, HeartPulse, PanelLeftClose, PanelLeftOpen, Sun, Moon, Globe } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import { Dialog } from '../ui/dialog'

interface TopbarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function CyberTrackTopbar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false)

  // Dynamic Breadcrumb derived from route
  const getBreadcrumbs = () => {
    const path = location.pathname.substring(1)
    if (!path) return ['System', 'Dashboard']
    const parts = path.split('/')
    return ['System', ...parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1))]
  }

  const breadcrumbs = getBreadcrumbs()
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]

  return (
    <header className="h-16 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none transition-colors">
      {/* Left Side: Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Toggle Collapse Button (Mobile Only) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex p-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070B14] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg items-center justify-center text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Toggle Collapse Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070B14] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Breadcrumbs */}
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-400">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-slate-200 font-bold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <h1 className="sm:hidden text-sm font-bold text-slate-900 dark:text-slate-100">{pageTitle}</h1>
      </div>

      {/* Right Side: Health Status, Search, Notifications, Theme Switcher */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* System Health Badge */}
        <div className="hidden xl:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <HeartPulse className="w-3.5 h-3.5" />
          <span>System Operational</span>
        </div>

        {/* WAN Connected Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold uppercase tracking-wider select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          <Globe className="w-3.5 h-3.5" />
          <span>WAN Connected</span>
        </div>

        {/* Search Input Trigger */}
        <div
          onClick={() => setShowSearchModal(true)}
          className="hidden md:flex items-center relative w-56 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appliance..."
            className="w-full bg-slate-100 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 cursor-pointer pointer-events-none"
            readOnly
          />
          <div className="absolute right-2 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-[9px] text-slate-500 font-mono">
            ⌘K
          </div>
        </div>

        {/* Theme Switcher Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070B14] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
          className="relative p-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070B14] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title="Security Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0F172A]"></span>
        </button>

        {/* Search Modal */}
        <Dialog
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          title="RCS CyberTrack Command Search"
          description="Quick navigation across firewall rules, interfaces, and system logs."
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Type command or page name (e.g. firewall, eth0, audit)..."
                className="w-full bg-slate-100 dark:bg-[#070B14] border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1 text-xs pt-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">Popular Quick Links</p>
              {[
                { label: 'Security Overview Dashboard', path: '/dashboard' },
                { label: 'nftables Firewall Rules', path: '/firewall' },
                { label: 'Network Interfaces (eth0 / eth1)', path: '/network' },
                { label: 'Security Alerts & Events', path: '/alerts' },
                { label: 'UI Design System Showcase', path: '/design-system' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setShowSearchModal(false)
                    navigate(item.path)
                  }}
                  className="p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.path}</span>
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      </div>
    </header>
  )
}
