export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/resend'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth — only organisers can send invites
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { tripMemberId } = await request.json()

    if (!tripMemberId) {
      return NextResponse.json({ error: 'tripMemberId is required' }, { status: 400 })
    }

    // Fetch the trip member
    const { data: member, error: memberError } = await supabase
      .from('trip_members')
      .select('id, invite_email, invite_token, invite_status, trip_id')
      .eq('id', tripMemberId)
      .single()

    if (!member || memberError) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (!member.invite_email) {
      return NextResponse.json({ error: 'Member has no email address' }, { status: 400 })
    }

    // Fetch the trip
    const { data: trip } = await supabase
      .from('trips')
      .select('id, name, date_from, date_to, shortlisted_cities, organiser_id')
      .eq('id', member.trip_id)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Verify the current user is the organiser
    if (trip.organiser_id !== user.id) {
      return NextResponse.json({ error: 'Only the organiser can send invites' }, { status: 403 })
    }

    // Get organiser name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const organiserName = profile?.full_name || 'Someone'

    // Send the email
    await sendInviteEmail({
      to: member.invite_email,
      organiserName,
      tripName: trip.name,
      dateFrom: format(new Date(trip.date_from), 'MMM d'),
      dateTo: format(new Date(trip.date_to), 'MMM d, yyyy'),
      destinations: trip.shortlisted_cities || [],
      inviteToken: member.invite_token,
    })

    // Update the member to track that email was sent
    await supabase
      .from('trip_members')
      .update({ invite_sent_at: new Date().toISOString() })
      .eq('id', tripMemberId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send invite error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invite' },
      { status: 500 }
    )
  }
}
