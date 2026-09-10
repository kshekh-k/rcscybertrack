import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, HeartPulse, Sun, Moon, Globe, List, LogOut, ArrowRight } from 'lucide-react'
import { api } from '../../lib/api'
import { useTheme } from '../../lib/theme'
import { useAlerts } from '../../features/alerts/useAlerts'
import { Dialog } from '../ui/dialog'
import { Input } from '../ui/input'
import { Sheet } from '../ui/sheet'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

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
  const { data: alerts = [], isLoading: isAlertsLoading } = useAlerts()
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
    <header className="h-16 bg-(--topbar-bg) px-4 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none transition-colors">
      {/* Left Side: Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Toggle Collapse Button (Mobile Only) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex p-2 items-center justify-center text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <Menu className="size-5" />
        </button>

        {/* Toggle Collapse Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-2 items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <List className="size-5" /> : <Menu className="size-5" />}
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
      <div className="flex items-center gap-1 md:gap-2">
        {/* System Health Badge */}
        <div className="hidden xl:flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded text-3xs text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider select-none">
          <HeartPulse className="size-3" />
          <span>System Operational</span>
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* WAN Connected Badge */}
        <div className="hidden lg:flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded text-3xs text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider select-none">
          <Globe className="size-3" />
          <span>WAN Connected</span>
          <span className="size-1.5 rounded-full bg-cyan-500" />
        </div>

        {/* Search Input Trigger */}
        <div
          onClick={() => setShowSearchModal(true)}
          className="hidden md:block w-56 cursor-pointer"
        >
          <Input
            type="text"
            placeholder="Search appliance..."
            readOnly
            icon={<Search className="size-3 text-slate-400" />}
            rightElement={
              <div className="px-1.5 py-0.5 text-xs text-slate-400 font-mono select-none">
                ⌘K
              </div>
            }
            className="py-2 text-xs cursor-pointer pointer-events-none bg-slate-100 dark:bg-slate-950 "
            containerClassName="space-y-0"
          />
        </div>

        {/* Theme Switcher Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-950 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="size-4 " /> : <Moon className="size-4" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
          className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-950 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          title="Security Notifications"
        >
          <Bell className="size-4" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={() => {
            api.logout()
            navigate('/login')
          }}
          className="p-2 hover:bg-red-500/10 rounded text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          title="Logout Session"
        >
          <LogOut className="size-4 " />
        </button>

        {/* Search Modal */}
        <Dialog
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          title="Appliance Command & Search Palette"
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Type command or page name (e.g. firewall, eth0, audit)..."
                className="w-full bg-slate-100 dark:bg-slate-950 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1 text-xs pt-2">
              <p className="text-3xs uppercase font-bold text-slate-400">Popular Quick Links</p>
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
                  <span className="text-3xs font-mono text-slate-400">{item.path}</span>
                </div>
              ))}
            </div>
          </div>
        </Dialog>

        {/* Security Notifications Side Panel (Sheet) */}
        <Sheet
          isOpen={showNotificationDrawer}
          onClose={() => setShowNotificationDrawer(false)}
          title="Security Notifications"
          description="Real-time alert stream and appliance events"
          footer={
            <Button
              variant="primary"
              className="w-full gap-2"
              onClick={() => {
                setShowNotificationDrawer(false)
                navigate('/alerts')
              }}
            >
              <span>View All Security Alerts</span>
              <ArrowRight className="size-3.5" />
            </Button>
          }
        >
          <div className="space-y-3">
            {isAlertsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 animate-pulse space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bell className="size-8 mx-auto text-slate-400 opacity-50" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No security notifications</p>
                <p className="text-3xs text-slate-400">Your system is running smoothly with no active alerts.</p>
              </div>
            ) : (
              alerts.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    setShowNotificationDrawer(false)
                    navigate('/alerts')
                  }}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-4xs font-bold uppercase px-1.5 py-0.5 rounded',
                        notification.severity === 'critical' && 'bg-red-500/10 text-red-500 ',
                        notification.severity === 'warning' && 'bg-amber-500/10 text-amber-500 ',
                        notification.severity === 'info' && 'bg-blue-500/10 text-blue-500 '
                      )}
                    >
                      {notification.severity}
                    </span>
                    <span className="text-4xs text-slate-400 font-mono">{notification.time}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                    {notification.title}
                  </h4>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {notification.desc}
                  </p>
                </div>
              ))
            )}
          </div>
        </Sheet>
      </div>
    </header>
  )
}
