'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Loader, Check, X } from 'lucide-react'
import { allAirports } from '@/lib/airports'

type Step = 'account' | 'profile' | 'preferences'

const passwordStrength = (password: string) => {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('account')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Account step
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Profile step
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Preferences step
  const [preferredAirport, setPreferredAirport] = useState('')

  const strength = passwordStrength(password)
  const strengthColor = strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-yellow-500' : 'bg-green-500'
  const strengthText = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : 'Strong'

  const handleNextStep = () => {
    setError('')
    if (step === 'account') {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      setStep('profile')
    } else if (step === 'profile') {
      if (!fullName) {
        setError('Please enter your name')
        return
      }
      setStep('preferences')
    }
  }

  const handleBackStep = () => {
    setError('')
    if (step === 'profile') {
      setStep('account')
    } else if (step === 'preferences') {
      setStep('profile')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // If user was created, update profile and preferences
      if (authData.user) {
        // Update user profile
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            phone,
            preferred_airport: preferredAirport || null,
          },
        })

        // Save airport to profiles table if provided
        if (preferredAirport) {
          await (supabase.from('profiles') as any)
            .upsert({
              id: authData.user.id,
              preferred_airport: preferredAirport,
            }, { onConflict: 'id' })
        }

        // Show success message and redirect
        setLoading(false)
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo size="md" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-primary">Create your account</h1>
            <p className="text-text-secondary text-sm">
              Step {step === 'account' ? '1' : step === 'profile' ? '2' : '3'} of 3
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            <div
              className={`h-1 flex-1 rounded-full ${
                step === 'account' ? 'bg-accent' : 'bg-success'
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                step === 'preferences' ? 'bg-accent' : step === 'profile' ? 'bg-accent' : 'bg-border'
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                step === 'preferences' ? 'bg-accent' : 'bg-border'
              }`}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-input px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          {step === 'account' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep() }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i < strength ? strengthColor : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-secondary">
                      Strength: <span className="font-medium">{strengthText}</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-primary mb-2">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {password === confirmPassword ? (
                      <>
                        <Check size={16} className="text-success" />
                        <span className="text-success">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X size={16} className="text-red-500" />
                        <span className="text-red-500">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!email || !password || !confirmPassword}
                className="w-full py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-input font-medium transition-colors"
              >
                Next step
              </button>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep() }} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-primary mb-2">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="flex-1 py-2 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!fullName}
                  className="flex-1 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-input font-medium transition-colors"
                >
                  Next step
                </button>
              </div>
            </form>
          )}

          {step === 'preferences' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <p className="text-sm text-text-secondary">
                Nearly there! This helps us find the best flights for your trips. You can skip this and add it later.
              </p>

              <div>
                <label htmlFor="airport" className="block text-sm font-medium text-primary mb-2">
                  Your nearest airport
                </label>
                <select
                  id="airport"
                  value={preferredAirport}
                  onChange={(e) => setPreferredAirport(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary"
                >
                  <option value="">Select an airport...</option>
                  {allAirports.map((a) => (
                    <option key={a.iata} value={a.iata}>
                      {a.city} — {a.name} ({a.iata})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="flex-1 py-2 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-input font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="w-full text-sm text-text-secondary hover:text-primary transition-colors"
              >
                Skip for now
              </button>

              <p className="text-xs text-text-secondary text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}

          {/* Login Link */}
          <div className="text-center text-sm">
            <span className="text-text-secondary">Already have an account? </span>
            <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
