import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import InviteLanding from './invite-landing'

export default async function InvitePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = await createClient()

  // Look up the invite by token
  const { data: invite, error: inviteError } = await supabase
    .from('trip_members')
    .select(`
      id, invite_email, invite_status, role, trip_id
    `)
    .eq('invite_token', params.token)
    .single()

  if (!invite) {
    console.error('Invite lookup failed:', inviteError)
    notFound()
  }

  // Fetch the trip separately (avoids foreign key join issues)
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, trip_types, group_size,
      destination_scope, shortlisted_cities, organiser_id
    `)
    .eq('id', invite.trip_id)
    .single()

  if (!trip) {
    console.error('Trip lookup failed:', tripError)
    notFound()
  }

  // Fetch organiser name
  const { data: organiser } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', trip.organiser_id)
    .single()

  const tripWithOrganiser = { ...trip, profiles: organiser }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <InviteLanding
      invite={invite}
      trip={tripWithOrganiser as any}
      token={params.token}
      currentUser={user}
    />
  )
}
