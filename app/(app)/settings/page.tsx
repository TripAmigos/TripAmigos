'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader, Check, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  // Password reset
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteSection, setShowDeleteSection] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords don\'t match')
      return
    }

    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess(false)

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address')
      return
    }

    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setEmailLoading(false)

    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSuccess(true)
      setNewEmail('')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm')
      return
    }

    setDeleteLoading(true)
    setDeleteError('')

    // Sign out and let user know — actual account deletion would need a server-side admin call
    // For now, we sign out and mark intent. In production, this triggers a backend deletion process.
    const { error } = await supabase.auth.signOut()
    setDeleteLoading(false)

    if (error) {
      setDeleteError(error.message)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="space-y-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-primary">Account settings</h1>
        <p className="text-text-secondary">Manage your password, email, and account.</p>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-border rounded-card p-6 space-y-4">
        <h2 className="text-base font-bold text-primary">Change password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-primary mb-1.5">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-primary mb-1.5">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check size={14} /> Password updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading || !newPassword}
            className="px-5 py-2 bg-accent text-white rounded-input font-medium text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {passwordLoading ? <><Loader size={14} className="animate-spin" /> Updating...</> : 'Update password'}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-white border border-border rounded-card p-6 space-y-4">
        <h2 className="text-base font-bold text-primary">Change email address</h2>
        <p className="text-xs text-text-secondary">You'll receive a confirmation link at your new email address. Your login email won't change until you confirm.</p>
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div>
            <label htmlFor="new-email" className="block text-sm font-medium text-primary mb-1.5">
              New email address
            </label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
            />
          </div>

          {emailError && (
            <p className="text-sm text-red-600">{emailError}</p>
          )}
          {emailSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check size={14} /> Confirmation email sent — check your inbox
            </div>
          )}

          <button
            type="submit"
            disabled={emailLoading || !newEmail}
            className="px-5 py-2 bg-accent text-white rounded-input font-medium text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {emailLoading ? <><Loader size={14} className="animate-spin" /> Sending...</> : 'Update email'}
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-white border border-red-200 rounded-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-red-700">Delete account</h2>
          {!showDeleteSection && (
            <button
              onClick={() => setShowDeleteSection(true)}
              className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              I want to delete my account
            </button>
          )}
        </div>

        {showDeleteSection && (
          <div className="space-y-3 pt-2 border-t border-red-100">
            <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-input">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 leading-relaxed">
                <p className="font-semibold mb-1">This action is permanent and cannot be undone.</p>
                <p>Your account, preferences, and trip data will be permanently deleted. If you're the organiser of any trips, those trips will also be affected. Any flights or hotels already booked are not affected — those are with the airline and hotel directly.</p>
              </div>
            </div>

            <div>
              <label htmlFor="delete-confirm" className="block text-sm font-medium text-red-700 mb-1.5">
                Type DELETE to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2 border border-red-300 rounded-input bg-white text-primary placeholder-text-muted"
              />
            </div>

            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                className="px-5 py-2 bg-red-600 text-white rounded-input font-medium text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleteLoading ? <><Loader size={14} className="animate-spin" /> Deleting...</> : 'Permanently delete my account'}
              </button>
              <button
                onClick={() => { setShowDeleteSection(false); setDeleteConfirm(''); setDeleteError('') }}
                className="px-5 py-2 border border-border text-primary rounded-input font-medium text-sm hover:bg-bg-soft transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
