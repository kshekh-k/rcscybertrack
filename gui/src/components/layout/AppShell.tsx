import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import CyberTrackSidebar from './CyberTrackSidebar'
import CyberTrackTopbar from './CyberTrackTopbar'
import { ThemeProvider } from '../../lib/theme'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-(--background) text-(--foreground) transition-colors">
        {/* Sidebar */}
        <CyberTrackSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <CyberTrackTopbar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-(--background)">
            <div className="w-full space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
