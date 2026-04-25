import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SubmitPreferences from './submit-preferences'

export default async function SubmitPreferencesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch trip with shortlisted cities
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, trip_types, group_size,
      destination_scope, shortlisted_cities, organiser_id
    `)
    .eq('id', params.id)
    .single()

  if (!trip) notFound()

  // Get this user's trip_member record
  const { data: tripMember } = await supabase
    .from('trip_members')
    .select('id, role, invite_status')
    .eq('trip_id', params.id)
    .eq('member_id', user.id)
    .single()

  if (!tripMember) notFound()

  // Check if already submitted
  const { data: existingPref } = await supabase
    .from('member_preferences')
    .select('id, is_submitted')
    .eq('trip_id', params.id)
    .eq('member_id', user.id)
    .single()

  return (
    <SubmitPreferences
      trip={trip}
      tripMemberId={tripMember.id}
      userId={user.id}
      alreadySubmitted={existingPref?.is_submitted || false}
    />
  )
}
