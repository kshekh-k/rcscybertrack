import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Search, Bell, HeartPulse, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface TopbarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function CyberTrackTopbar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: TopbarProps) {
  const location = useLocation()

  // Dynamic Page Title/Breadcrumb derived from route
  const getBreadcrumbs = () => {
    const path = location.pathname.substring(1)
    if (!path) return ['System', 'Dashboard']
    
    // Capitalize each section
    const parts = path.split('/')
    return ['System', ...parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))]
  }

  const breadcrumbs = getBreadcrumbs()
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]

  return (
    <header className="h-16 border-b border-[#1E293B] bg-[#0F172A] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none">
      
      {/* Left side: Hamburger Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2">
        {/* Toggle Collapse Button (Mobile Only) */}
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex p-2 border border-[#1E293B] bg-[#070B14] hover:bg-[#1E293B] rounded-lg items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Toggle Collapse Button (Desktop Only) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-2 border border-[#1E293B] bg-[#070B14] hover:bg-[#1E293B] rounded-lg items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer mr-2"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Page Title & Breadcrumbs (Desktop Only) */}
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium uppercase tracking-wider">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#1E293B]">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-[#94A3B8]' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <h1 className="sm:hidden text-base font-semibold text-[#F8FAFC]">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Search, Notifications, System status */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Search Input (Mimics command palette) */}
        <div className="hidden md:flex items-center relative w-64">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search console... (Ctrl+K)" 
            className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] transition-colors"
            readOnly
          />
          <div className="absolute right-2 px-1.5 py-0.5 rounded border border-[#1E293B] bg-[#0F172A] text-[9px] text-[#64748B] font-mono">
            ⌘K
          </div>
        </div>

        {/* Appliance Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 px-2.5 py-1 rounded-md text-[10px] text-[#06B6D4] font-semibold uppercase tracking-wider">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Appliance Online</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 border border-[#1E293B] bg-[#070B14] hover:bg-[#1E293B] rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          {/* Notification dot */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-[#070B14]"></span>
        </button>

      </div>

    </header>
  )
}
