import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TripDashboard from './trip-dashboard'

export default async function TripDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch trip with members
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, description, date_from, date_to, status,
      trip_types, payment_method, room_sharing, cost_split, group_size, organiser_id, destination_scope, shortlisted_cities, booking_data,
      trip_members ( id, member_id, invite_status, role, invite_email, invite_token, guest_name, first_name, last_name, costs_covered, preferred_airport, invite_sent_at )
    `)
    .eq('id', params.id)
    .single()

  if (!trip) {
    notFound()
  }

  // Fetch all preferences for this trip
  const { data: preferences } = await supabase
    .from('member_preferences')
    .select('*')
    .eq('trip_id', params.id)

  // Get the user's display name from profile or auth metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.user_metadata?.full_name || user.email || 'You'

  return (
    <TripDashboard
      trip={trip}
      members={trip.trip_members || []}
      preferences={preferences || []}
      userId={user.id}
      userName={userName}
    />
  )
}
