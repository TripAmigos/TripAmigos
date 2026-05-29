import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BookedFlow from './booked-flow'

export default async function BookedPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { hotel_url?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, status, group_size,
      organiser_id, booking_data, shortlisted_cities,
      trip_members ( id, member_id, invite_status, role, first_name, last_name, guest_name, invite_email )
    `)
    .eq('id', params.id)
    .single()

  if (!trip) notFound()

  // Get organiser name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const organiserName = (profile as any)?.full_name || user.email?.split('@')[0] || 'You'

  return (
    <BookedFlow
      trip={trip}
      userId={user.id}
      organiserName={organiserName}
      hotelUrl={searchParams.hotel_url ? decodeURIComponent(searchParams.hotel_url) : null}
    />
  )
}
