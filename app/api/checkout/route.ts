export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/checkout
 * Creates a Stripe Checkout Session for flight booking
 *
 * Body: {
 *   tripId: string,
 *   bookingData: { flights, hotel, destination, totalCost, perPerson },
 *   offerIds: string[],   // Duffel offer IDs to book after payment
 *   passengers: [{ id, title, given_name, family_name, born_on, gender, email, phone_number }],
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { tripId, bookingData, offerIds, passengers } = await request.json()

    if (!tripId || !bookingData || !offerIds || offerIds.length === 0 || !passengers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user is the organiser
    const { data: trip } = await supabase
      .from('trips')
      .select('id, name, organiser_id')
      .eq('id', tripId)
      .single()

    if (!trip || (trip as any).organiser_id !== user.id) {
      return NextResponse.json({ error: 'Only the organiser can book' }, { status: 403 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Flight cost in pence (Stripe uses smallest currency unit)
    const flightTotalPence = Math.round(bookingData.totalCost * 100)

    // Store pending booking data in metadata (Stripe limit: 500 chars per value)
    // We'll store the full data in Supabase and reference it
    const { data: pendingBooking, error: dbError } = await supabase
      .from('trips')
      .update({
        booking_data: {
          ...bookingData,
          status: 'pending_payment',
          offerIds,
          passengers,
          bookedAt: new Date().toISOString(),
        },
      })
      .eq('id', tripId)
      .select()
      .single()

    if (dbError) {
      console.error('Failed to save pending booking:', dbError)
      return NextResponse.json({ error: 'Failed to prepare booking' }, { status: 500 })
    }

    // Build line items for Stripe Checkout
    const lineItems: any[] = []

    // Add flight line items — one per route
    bookingData.flights.forEach((flight: any) => {
      const passengerCount = flight.passengers?.length || 1
      lineItems.push({
        price_data: {
          currency: (flight.currency || 'GBP').toLowerCase(),
          product_data: {
            name: `Flights: ${flight.origin} → ${flight.destination}`,
            description: `${flight.airline} · ${passengerCount} passenger${passengerCount !== 1 ? 's' : ''} · Return`,
          },
          unit_amount: Math.round((flight.pricingTotal || 0) * 100),
        },
        quantity: 1,
      })
    })

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}&trip_id=${tripId}`,
      cancel_url: `${siteUrl}/trips/${tripId}/options?payment=cancelled`,
      metadata: {
        tripId,
        userId: user.id,
      },
      customer_email: user.email || undefined,
      payment_intent_data: {
        metadata: {
          tripId,
          userId: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
