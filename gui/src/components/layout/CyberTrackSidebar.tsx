import { useState } from 'react'
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
  BarChart3
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
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    title: "CONTROL CENTER",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Firewall", path: "/firewall", icon: Shield },
      { name: "Network", path: "/network", icon: Network },
      { name: "Devices", path: "/devices", icon: MonitorSmartphone },
      { name: "Audit Logs", path: "/audit", icon: ScrollText },
    ]
  },
  {
    title: "SECURITY",
    items: [
      { name: "Alerts", path: "/alerts", icon: AlertTriangle },
      { name: "Users & RBAC", path: "/users", icon: UserCheck },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "Traffic Analytics", path: "/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "CONNECTIVITY",
    items: [
      { name: "VPN", path: "/vpn", icon: LockKeyhole },
      { name: "SD-WAN", path: "/sdwan", icon: Globe },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", path: "/settings", icon: Settings2 },
    ]
  }
]

export default function CyberTrackSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A0F1C] border-r border-[#1E293B] select-none">
      
      {/* Brand Header */}
      <div className={cn(
        "flex items-center gap-3 px-6 h-16 border-b border-[#1E293B] relative overflow-hidden transition-all duration-300",
        collapsed && "px-4 justify-center"
      )}>
        <div className="flex items-center justify-center w-9 h-9 bg-blue-600/10 border border-blue-500/30 rounded-lg shrink-0">
          <Shield className="w-5 h-5 text-[#2563EB]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-wide text-[#F8FAFC]">RCS CyberTrack</span>
            <span className="text-[10px] text-[#64748B] uppercase tracking-widest font-semibold mt-0.5">Security Platform</span>
          </div>
        )}
        
        {/* Toggle Collapse Button (Desktop Only) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 border border-[#1E293B] bg-[#0F172A] hover:bg-[#1E293B] rounded items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1.5">
            {!collapsed ? (
              <span className="px-3 text-[10px] font-semibold text-[#64748B] tracking-wider block uppercase">
                {group.title}
              </span>
            ) : (
              <div className="h-[1px] bg-[#1E293B] mx-2 my-4" />
            )}
            
            <div className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const IconComponent = item.icon
                const isActive = location.pathname === item.path
                const isDisabled = item.disabled

                return (
                  <NavLink
                    key={itemIdx}
                    to={isDisabled ? "#" : item.path}
                    onClick={(e) => {
                      if (isDisabled) e.preventDefault()
                      else setMobileOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative group",
                      isActive 
                        ? "bg-[#2563EB]/10 text-[#F8FAFC] font-medium" 
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]/50",
                      isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#94A3B8]"
                    )}
                  >
                    {/* Active Left Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#2563EB] rounded-r" />
                    )}

                    <IconComponent className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-[#2563EB]" : "text-[#94A3B8] group-hover:text-[#F8FAFC]"
                    )} />
                    
                    {!collapsed && <span>{item.name}</span>}

                    {/* Tooltip on Hover when Collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-xs text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                        {item.name} {isDisabled && "(Disabled)"}
                      </div>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Core Status Card */}
      <div className="p-3 border-t border-[#1E293B] bg-[#0A0F1C]">
        {!collapsed ? (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#F8FAFC]">CyberTrack Core</span>
                <span className="text-[10px] text-[#22C55E] font-medium uppercase tracking-wider">Operational</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 group relative">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
            </span>
            <div className="absolute left-full ml-3 px-2 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-xs text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Core Status: Operational
            </div>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-[#1E293B] relative">
        <div 
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-[#0F172A]/50 transition-colors cursor-pointer text-[#94A3B8] hover:text-[#F8FAFC] group",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center shrink-0">
            <CircleUserRound className="w-5 h-5 text-[#2563EB]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#F8FAFC] truncate">{api.getUsername()}</span>
              <span className="text-[10px] text-[#64748B] truncate">Security Admin</span>
            </div>
          )}

          {collapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-xs text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Administrator (Security Admin)
            </div>
          )}
        </div>

        {/* Simple User Dropdown */}
        {userMenuOpen && (
          <div className={cn(
            "absolute bottom-full mb-2 bg-[#0F172A] border border-[#1E293B] rounded-lg shadow-xl w-[calc(100%-24px)] left-3 py-1.5 z-50 transition-all",
            collapsed && "w-44 left-16 bottom-3"
          )}>
            <div className="px-3 py-1.5 border-b border-[#1E293B] text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
              Profile Actions
            </div>
            <button 
              onClick={() => setUserMenuOpen(false)}
              className="w-full text-left px-3 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CircleUserRound className="w-3.5 h-3.5 text-[#2563EB]" />
              View Profile
            </button>
            <button 
              onClick={() => {
                setUserMenuOpen(false)
                api.logout()
                navigate('/login')
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#EF4444] hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer border-t border-[#1E293B]"
            >
              <LogOut className="w-3.5 h-3.5 text-[#EF4444]" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="px-6 py-2 border-t border-[#1E293B] text-[10px] text-[#64748B] font-mono select-none">
          CyberTrack v0.1.0
        </div>
      )}

    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block h-screen sticky top-0 transition-all duration-300 z-30 shrink-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer (Pure React Overlay) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Content */}
          <aside className="relative flex flex-col w-[260px] h-full shadow-2xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
