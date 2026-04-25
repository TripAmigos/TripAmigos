import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TripOptions from './trip-options'

export default async function TripOptionsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, status, group_size,
      trip_types, payment_method, room_sharing, cost_split, destination_scope, shortlisted_cities, organiser_id,
      trip_members ( id, member_id, invite_status, role, invite_email, first_name, last_name, guest_name, costs_covered, preferred_airport )
    `)
    .eq('id', params.id)
    .single()

  if (!trip) notFound()

  // Get transport preferences from members
  const { data: allPreferences } = await supabase
    .from('member_preferences')
    .select('transport_preference')
    .eq('trip_id', params.id)
    .eq('is_submitted', true)

  // Determine overall transport mode: if majority voted train, search trains
  const transportVotes = (allPreferences || []).map(p => p.transport_preference).filter(Boolean)
  const trainVotes = transportVotes.filter(v => v === 'train').length
  const flightVotes = transportVotes.filter(v => v === 'flight').length
  const transportMode = trainVotes > flightVotes ? 'train' : trainVotes === flightVotes && trainVotes > 0 ? 'both' : 'flight'

  const { data: preferences } = await supabase
    .from('member_preferences')
    .select('*')
    .eq('trip_id', params.id)

  return (
    <TripOptions
      trip={trip}
      preferences={preferences || []}
      members={trip.trip_members || []}
      userId={user.id}
      transportMode={transportMode}
    />
  )
}
