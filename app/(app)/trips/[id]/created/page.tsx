import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TripCreatedSuccess from './trip-created-success'

export default async function TripCreatedPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch trip with members (including invite tokens)
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, trip_types, group_size,
      organiser_id, shortlisted_cities,
      trip_members ( id, invite_email, invite_token, invite_status, role, member_id )
    `)
    .eq('id', params.id)
    .single()

  if (!trip || trip.organiser_id !== user.id) {
    notFound()
  }

  // Get pending invites (attendees who haven't accepted yet)
  const pendingInvites = (trip.trip_members || []).filter(
    (m: any) => m.role === 'attendee' && m.invite_token
  )

  return (
    <TripCreatedSuccess
      trip={trip}
      pendingInvites={pendingInvites}
    />
  )
}
