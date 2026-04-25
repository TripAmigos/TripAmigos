'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Loader, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)
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

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail size={28} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Check your email</h1>
              <p className="text-text-secondary text-sm">
                We've sent a password reset link to <strong className="text-primary">{email}</strong>. Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-text-muted">
                Didn't receive it? Check your spam folder, or try again in a minute.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover font-medium"
              >
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-primary">Forgot your password?</h1>
                <p className="text-text-secondary text-sm">
                  Enter your email and we'll send you a link to reset it.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-input px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    required
                    autoFocus
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-input font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <><Loader size={18} className="animate-spin" /> Sending...</>
                  ) : (
                    'Send reset link'
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
