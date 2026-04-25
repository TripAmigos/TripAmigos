export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOffer, createOrder, calculatePricing } from '@/lib/duffel'

/**
 * POST /api/flights/book
 * Confirms the offer price, then creates a Duffel order
 *
 * Body: {
 *   offerId: string,
 *   passengers: [{ id, title, given_name, family_name, born_on, gender, email, phone_number }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { offerId, passengers } = body

    if (!offerId || !passengers || passengers.length === 0) {
      return NextResponse.json(
        { error: 'Missing offerId or passengers' },
        { status: 400 }
      )
    }

    // Step 1: Re-fetch the offer to get the latest price
    const offer = await getOffer(offerId)

    // Step 2: Check if offer has expired
    if (new Date(offer.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This offer has expired. Please search again for updated prices.', code: 'OFFER_EXPIRED' },
        { status: 409 }
      )
    }

    // Step 3: Create the order
    const order = await createOrder(
      offerId,
      passengers,
      offer.total_amount,
      offer.total_currency
    )

    // Step 4: Calculate final pricing for the response
    const duffelTotal = parseFloat(offer.total_amount)
    const pricing = calculatePricing(duffelTotal, passengers.length)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        bookingReference: order.booking_reference,
        status: order.status || 'confirmed',
        airline: offer.owner?.name,
        slices: order.slices,
      },
      pricing: {
        total: pricing.displayTotal,
        perPerson: pricing.perPerson,
        currency: offer.total_currency,
      },
    })
  } catch (error: any) {
    console.error('Booking error:', error)

    // Handle known error types
    if (error.message?.includes('expired')) {
      return NextResponse.json(
        { error: 'This offer has expired. Please search again.', code: 'OFFER_EXPIRED' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
