import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Firewall from '../pages/Firewall'
import Network from '../pages/Network'
import Devices from '../pages/Devices'
import Audit from '../pages/Audit'
import Settings from '../pages/Settings'
import Users from '../pages/Users'
import Alerts from '../pages/Alerts'
import Vpn from '../pages/Vpn'
import Sdwan from '../pages/Sdwan'
import Analytics from '../pages/Analytics'
import { api } from '../lib/api'

// Simple Route Protection wrapper
function ProtectedRoute() {
  if (!api.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <Dashboard />
          },
          {
            path: 'firewall',
            element: <Firewall />
          },
          {
            path: 'network',
            element: <Network />
          },
          {
            path: 'devices',
            element: <Devices />
          },
          {
            path: 'audit',
            element: <Audit />
          },
          {
            path: 'users',
            element: <Users />
          },
          {
            path: 'alerts',
            element: <Alerts />
          },
          {
            path: 'vpn',
            element: <Vpn />
          },
          {
            path: 'sdwan',
            element: <Sdwan />
          },
          {
            path: 'analytics',
            element: <Analytics />
          },
          {
            path: 'settings',
            element: <Settings />
          },
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />
          }
        ]
      }
    ]
  }
])

