import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ShieldCheck, LockKeyhole, UserPlus } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const infoMessage = (location.state as { message?: string })?.message

  useEffect(() => {
    // If already logged in, skip login
    if (api.isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Username and password are required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-[#2563EB]" />
          </div>
          <h1 className="text-xl font-semibold text-[#F8FAFC]">RCS CyberTrack</h1>
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider mt-1">Security Platform</p>
        </div>

        {infoMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg p-3 mb-6 font-semibold">
            {infoMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 mb-6 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full text-sm font-semibold py-2.5 gap-2 rounded-lg"
          >
            {!loading && <LockKeyhole className="w-4 h-4" />}
            {loading ? 'Authenticating...' : 'Authenticate'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#1E293B] text-center">
          <p className="text-xs text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1">
              Create Account <UserPlus className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </p>
        </div>
      </div>
      
      <p className="text-xs text-[#64748B] mt-8">RCS CyberTrack v0.1.0 • Network Security. Under Control.</p>
    </div>
  )
}
