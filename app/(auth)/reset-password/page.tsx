'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Loader, Check, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setDone(true)
      setLoading(false)

      // Redirect to dashboard after a moment
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card p-8 space-y-6">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check size={28} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Password updated</h1>
              <p className="text-text-secondary text-sm">
                Your password has been reset successfully. Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-primary">Set a new password</h1>
                <p className="text-text-secondary text-sm">
                  Choose a new password for your TripAmigos account.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-input px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    disabled={loading}
                    required
                    autoFocus
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-primary mb-2">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    disabled={loading}
                    required
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-input font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <><Loader size={18} className="animate-spin" /> Updating...</>
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary font-medium"
                >
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
