import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, LockKeyhole } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useBrand } from '../../lib/brand'

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const { brand, getLogoLight, getLogoDark } = useBrand()

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
      await new Promise((resolve) => setTimeout(resolve, 600))
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Header & Logo */}
      <div className="flex flex-col items-start mb-5">
        <img
          src={getLogoLight()}
          alt={`${brand.brandName} Logo`}
          className="h-12 w-auto mb-4 block dark:hidden object-contain"
        />
        <img
          src={getLogoDark()}
          alt={`${brand.brandName} Logo`}
          className="h-12 w-auto mb-4 hidden dark:block object-contain"
        />

        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Get started with {brand.brandName}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/5 text-red-700 dark:text-red-400 text-sm rounded p-3 mb-4 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Name"
          icon={<User className="size-4 text-slate-400 dark:text-slate-500" />}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          placeholder="Administrator"
        />

        <Input
          label="Username"
          icon={<User className="size-4 text-slate-400 dark:text-slate-500" />}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          placeholder="admin_user"
        />

        <Input
          label="Email Address"
          icon={<Mail className="size-4 text-slate-400 dark:text-slate-500" />}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="admin@rcscybertrack.internal"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          icon={<LockKeyhole className="size-4 text-slate-400 dark:text-slate-500" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="••••••••"
        />

        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          icon={<LockKeyhole className="size-4 text-slate-400 dark:text-slate-500" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 cursor-pointer"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          placeholder="••••••••"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full text-sm font-semibold py-3 gap-2 mt-2"
          >

            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>

      {/* Footer Navigation Link */}
      <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
