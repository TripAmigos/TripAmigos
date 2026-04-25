'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, X, Loader } from 'lucide-react'

export default function DeleteTripButton({ tripId, tripName }: { tripId: string; tripName: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)

    const supabase = createClient()

    // Delete in order: preferences → members → trip
    await supabase.from('member_preferences').delete().eq('trip_id', tripId)
    await supabase.from('trip_members').delete().eq('trip_id', tripId)
    const { error } = await supabase.from('trips').delete().eq('id', tripId)

    if (error) {
      console.error('Failed to delete trip:', error)
      setDeleting(false)
      return
    }

    router.refresh()
  }

  if (showConfirm) {
    return (
      <div
        className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-card flex flex-col items-center justify-center p-6 space-y-3"
        onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
      >
        <p className="text-sm font-semibold text-primary text-center">Delete "{tripName}"?</p>
        <p className="text-xs text-text-secondary text-center">This will remove the trip and all preferences. This can't be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(false) }}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-input hover:bg-bg-soft transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-input hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {deleting ? <><Loader size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true) }}
      className="absolute top-4 right-4 z-10 p-2 rounded-input text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
      title="Delete trip"
    >
      <Trash2 size={16} />
    </button>
  )
}
