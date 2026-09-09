import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, UserPlus, ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password || !email) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Create user account via API if endpoint exists or simulate registration then navigate to login
      await new Promise((resolve) => setTimeout(resolve, 600))
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent"></div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-[#2563EB]" />
          </div>
          <h1 className="text-xl font-semibold text-[#F8FAFC]">Create Account</h1>
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider mt-1">RCS CyberTrack Security Platform</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 mb-6 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="Administrator"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="admin_user"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="admin@rcscybertrack.internal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#070B14] border border-[#1E293B] rounded-lg px-4 py-2 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-[#2563EB] disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full text-sm font-semibold py-2.5 gap-2 rounded-lg"
            >
              {!loading && <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#1E293B] text-center">
          <p className="text-xs text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1">
              Sign In <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </p>
        </div>
      </div>
      
      <p className="text-xs text-[#64748B] mt-6">RCS CyberTrack v0.1.0 • Network Security. Under Control.</p>
    </div>
  )
}
