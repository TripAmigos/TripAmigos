export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getOffer, createOrder, calculatePricing } from '@/lib/duffel'

/**
 * GET /api/checkout/success?session_id=xxx&trip_id=xxx
 * Called after successful Stripe payment
 * Creates the Duffel order and finalises the booking
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const tripId = searchParams.get('trip_id')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!sessionId || !tripId) {
    return NextResponse.redirect(`${siteUrl}/dashboard?error=missing_params`)
  }

  try {
    // Verify the Stripe session is paid
    const session = await getStripe().checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(`${siteUrl}/trips/${tripId}/options?payment=failed`)
    }

    // Verify trip ID matches
    if (session.metadata?.tripId !== tripId) {
      return NextResponse.redirect(`${siteUrl}/dashboard?error=mismatch`)
    }

    const supabase = await createClient()

    // Fetch the pending booking data we stored earlier
    const { data: trip } = await supabase
      .from('trips')
      .select('id, booking_data')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.redirect(`${siteUrl}/dashboard?error=trip_not_found`)
    }

    const bookingData = (trip as any).booking_data

    // If already processed (user refreshed the success page), just redirect
    if (bookingData?.status === 'booked') {
      return NextResponse.redirect(`${siteUrl}/trips/${tripId}/booked`)
    }

    const offerIds: string[] = bookingData?.offerIds || []
    const passengers: any[] = bookingData?.passengers || []

    // Create Duffel orders for each flight offer
    const flightBookings = [...(bookingData?.flights || [])]
    const errors: string[] = []

    for (let i = 0; i < offerIds.length; i++) {
      try {
        const offerId = offerIds[i]

        // Re-fetch offer to confirm it's still valid
        const offer = await getOffer(offerId)

        if (new Date(offer.expires_at) < new Date()) {
          errors.push(`Offer ${i + 1} expired — contact support for a refund`)
          continue
        }

        // Create the Duffel order
        const order = await createOrder(
          offerId,
          passengers,
          offer.total_amount,
          offer.total_currency
        )

        // Update flight booking with the real reference
        if (flightBookings[i]) {
          flightBookings[i].bookingReference = order.booking_reference || order.id
          flightBookings[i].duffelOrderId = order.id
          flightBookings[i].orderStatus = order.status || 'confirmed'
        }
      } catch (err: any) {
        console.error(`Duffel order ${i} failed:`, err)
        errors.push(`Flight ${i + 1}: ${err.message}`)
      }
    }

    // Update trip with final booking data
    const finalBookingData = {
      ...bookingData,
      flights: flightBookings,
      status: errors.length > 0 ? 'partial' : 'booked',
      stripeSessionId: sessionId,
      stripePaymentStatus: 'paid',
      errors: errors.length > 0 ? errors : undefined,
      bookedAt: new Date().toISOString(),
      // Remove temporary fields
      offerIds: undefined,
      passengers: undefined,
    }

    await supabase
      .from('trips')
      .update({
        status: 'booked',
        booking_data: finalBookingData,
      })
      .eq('id', tripId)

    // Redirect to the dedicated post-booking page
    const hotelUrl = finalBookingData.hotel?.bookingUrl
    const params = new URLSearchParams()
    if (errors.length > 0) params.set('warnings', 'true')
    if (hotelUrl) params.set('hotel_url', encodeURIComponent(hotelUrl))

    const qs = params.toString()
    return NextResponse.redirect(`${siteUrl}/trips/${tripId}/booked${qs ? `?${qs}` : ''}`)
  } catch (error: any) {
    console.error('Post-payment processing error:', error)
    // Payment was taken but booking failed — needs manual resolution
    return NextResponse.redirect(
      `${siteUrl}/trips/${tripId}?payment=success&booking=failed`
    )
  }
}
