import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { LockKeyhole, Eye, EyeOff, User } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { useBrand } from '../../lib/brand'
import { ForgotPasswordModal } from './ForgotPasswordModal'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const infoMessage = (location.state as { message?: string })?.message

  const { brand, getLogoLight, getLogoDark } = useBrand()

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
    <div className="relative">
      {/* Header & Logo */}
      <div className="flex flex-col items-start mb-6">
        <img
          src={getLogoLight()}
          alt={`${brand.brandName} Logo`}
          className="h-12 w-auto mb-5 block dark:hidden object-contain"
        />
        <img
          src={getLogoDark()}
          alt={`${brand.brandName} Logo`}
          className="h-12 w-auto mb-5 hidden dark:block object-contain"
        />

        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Sign in to continue to {brand.brandName}
        </p>
      </div>

      {infoMessage && (
        <div className="bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-sm rounded p-3.5 mb-5 font-medium">
          {infoMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 text-red-700 dark:text-red-400 text-sm rounded p-3.5 mb-5 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          icon={<User className="size-4 text-slate-400 dark:text-slate-500" />}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          placeholder="admin"
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

        {/* Remember Me & Forgot Password line */}
        <div className="flex items-center justify-between text-sm pt-1">
          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onChange={setRememberMe}
          />
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          className="w-full text-sm font-semibold py-3 gap-2 mt-2"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </Button>
      </form>

      {/* Footer Navigation Link */}
      <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            Create Account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  )
}
