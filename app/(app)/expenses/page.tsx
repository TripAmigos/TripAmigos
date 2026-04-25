import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Receipt, MapPin, Calendar } from 'lucide-react'

export default async function ExpensesPickerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all trips the user is part of (as organiser or member)
  const { data: organisedTrips } = await supabase
    .from('trips')
    .select('id, name, date_from, date_to, status')
    .eq('organiser_id', user.id)
    .order('date_from', { ascending: false })

  const { data: memberTrips } = await supabase
    .from('trip_members')
    .select(`
      trips ( id, name, date_from, date_to, status )
    `)
    .eq('member_id', user.id)
    .eq('invite_status', 'accepted')

  // Combine and deduplicate
  const allTrips = [
    ...(organisedTrips || []),
    ...(memberTrips || []).map((m: any) => m.trips).filter(Boolean),
  ]
  const trips = allTrips.filter((trip, index, self) =>
    index === self.findIndex((t: any) => t.id === trip.id)
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-input hover:bg-bg-soft transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Track expenses</h1>
          <p className="text-sm text-text-secondary">Pick a trip to log and split expenses</p>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-border rounded-card p-8 text-center space-y-3">
          <Receipt size={40} className="text-text-muted mx-auto" />
          <h3 className="text-lg font-bold text-primary">No trips yet</h3>
          <p className="text-sm text-text-secondary">
            Create a trip first, then come back here to track expenses.
          </p>
          <Link
            href="/trips/create"
            className="inline-block px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-input font-medium transition-colors"
          >
            Create a trip
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map((trip: any) => {
            const startDate = new Date(trip.date_from)
            const endDate = new Date(trip.date_to)
            const isPast = endDate < new Date()

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}/expenses`}
                className="bg-white border border-border rounded-card p-4 flex items-center gap-4 hover:border-accent hover:shadow-sm transition-all group"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  isPast ? 'bg-gray-100' : 'bg-accent-light'
                }`}>
                  <Receipt size={20} className={isPast ? 'text-gray-500' : 'text-accent'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                    {trip.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                    {trip.status === 'booked' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Booked</span>
                    )}
                    {isPast && (
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">Past</span>
                    )}
                  </p>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
