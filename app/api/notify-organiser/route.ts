export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAllPreferencesInEmail } from '@/lib/resend'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { tripId } = await request.json()

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }

    // Fetch trip
    const { data: trip, error: tripError } = await (supabase
      .from('trips') as any)
      .select('id, name, date_from, date_to, organiser_id, shortlisted_cities, status')
      .eq('id', tripId)
      .single()

    if (!trip || tripError) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Don't send if already booked
    if (trip.status === 'booked') {
      return NextResponse.json({ sent: false, reason: 'Trip already booked' })
    }

    // Count members (excluding organiser) and submitted preferences
    const { data: members } = await (supabase
      .from('trip_members') as any)
      .select('id, member_id, invite_status')
      .eq('trip_id', tripId)

    if (!members) {
      return NextResponse.json({ error: 'No members found' }, { status: 404 })
    }

    const invitedMembers = members.filter(m => m.member_id !== trip.organiser_id)
    const totalInvited = invitedMembers.length

    const { count: submittedCount } = await (supabase
      .from('member_preferences') as any)
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('is_submitted', true)

    // Only send when ALL invited members have submitted
    if ((submittedCount || 0) < totalInvited) {
      return NextResponse.json({ sent: false, reason: 'Not all members have submitted yet' })
    }

    // Get organiser details
    const { data: organiserProfile } = await (supabase
      .from('profiles') as any)
      .select('full_name, email')
      .eq('id', trip.organiser_id)
      .single()

    // Get organiser's auth email as fallback
    const { data: { user: organiserAuth } } = await supabase.auth.admin.getUserById(trip.organiser_id)
    const organiserEmail = organiserProfile?.email || organiserAuth?.email

    if (!organiserEmail) {
      return NextResponse.json({ error: 'Could not find organiser email' }, { status: 404 })
    }

    const organiserName = (organiserProfile as any)?.full_name || 'there'
    const destination = (trip as any).shortlisted_cities?.[0]?.split(',')?.[0] || ''

    await sendAllPreferencesInEmail({
      to: organiserEmail,
      organiserName,
      tripName: trip.name,
      dateFrom: format(new Date(trip.date_from), 'MMM d'),
      dateTo: format(new Date(trip.date_to), 'MMM d, yyyy'),
      destination,
      memberCount: totalInvited,
      tripId: trip.id,
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('Error sending organiser notification:', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
