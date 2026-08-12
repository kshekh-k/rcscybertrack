import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import CyberTrackSidebar from './CyberTrackSidebar'
import CyberTrackTopbar from './CyberTrackTopbar'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#070B14] text-[#F8FAFC]">
      {/* Sidebar Component */}
      <CyberTrackSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Component */}
        <CyberTrackTopbar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#070B14]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
