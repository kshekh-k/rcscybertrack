import { Dialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { KeyRound, Mail, ArrowRight, X } from 'lucide-react'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="relative flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-1 -right-1 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Top Icon Badge */}
        <div className="size-14 rounded bg-blue-500/10 dark:bg-blue-400/15 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-4">
          <KeyRound className="size-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Password Reset Request
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          For network security compliance, self-service password reset is disabled for administrator accounts.
        </p>

        {/* Steps Box */}
        <div className="w-full mt-5 p-4 rounded-md bg-slate-100 dark:bg-slate-950/70 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="size-7 rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-sm font-bold">
              1
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-400">
              Contact your organization's system administrator or IT security department.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-7 rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-sm font-bold">
              2
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-400">
              Provide your account username or registered email ID for identity verification.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-7 rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-sm font-bold">
              3
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-400">
              Your administrator will issue a secure temporary access token to unlock your account.
            </p>
          </div>
        </div>

        {/* Support Alert Box */}
        <div className="w-full mt-3 p-3 rounded bg-blue-500/5 flex items-center justify-between text-xs text-blue-500 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <Mail className="size-4 shrink-0" />
            <span className="font-medium">Need administrator assistance?</span>
          </div>
          <a
            href="mailto:support@rcscybertrack.internal"
            className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 flex items-center gap-0.5"
          >
            Email Support <ArrowRight className="size-3" />
          </a>
        </div>

        {/* Action Button */}
        <div className="w-full mt-6">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full text-sm font-semibold py-2.5"
          >
            Got it, thanks
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
