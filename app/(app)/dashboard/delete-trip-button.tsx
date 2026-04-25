'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, X, Loader } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function DeleteTripButton({ tripId, tripName }: { tripId: string; tripName: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)

    const supabase = createClient()

    try {
      // Delete related tables in parallel first, then the trip itself
      await Promise.all([
        supabase.from('member_preferences').delete().eq('trip_id', tripId),
        supabase.from('trip_expenses').delete().eq('trip_id', tripId),
        supabase.from('trip_members').delete().eq('trip_id', tripId),
      ])

      const { error } = await supabase.from('trips').delete().eq('id', tripId)

      if (error) {
        console.error('Failed to delete trip:', error)
        setDeleting(false)
        setShowConfirm(false)
        return
      }

      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      console.error('Delete error:', err)
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  const openConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(true)
  }

  const closeConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }

  return (
    <>
      <button
        onClick={openConfirm}
        className="absolute top-4 right-4 z-10 p-2 rounded-input text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete trip"
      >
        <Trash2 size={16} />
      </button>

      {showConfirm && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeConfirm}
        >
          <div
            className="bg-white rounded-card p-6 max-w-sm w-full mx-4 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-primary">Delete &ldquo;{tripName}&rdquo;?</p>
                <p className="text-sm text-text-secondary mt-1">
                  This will remove the trip, all member preferences, and expenses. This can&apos;t be undone.
                </p>
              </div>
              <button onClick={closeConfirm} className="p-1 text-text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-input hover:bg-bg-soft transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-input hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                {deleting ? (
                  <><Loader size={14} className="animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 size={14} /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
