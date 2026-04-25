import { NextRequest, NextResponse } from 'next/server'
import { getOffer, calculatePricing } from '@/lib/duffel'

/**
 * GET /api/flights/offer?id=off_xxx
 * Re-fetches a single offer to confirm current price before booking
 */
export async function GET(request: NextRequest) {
  try {
    const offerId = request.nextUrl.searchParams.get('id')

    if (!offerId) {
      return NextResponse.json(
        { error: 'Missing offer ID' },
        { status: 400 }
      )
    }

    const offer = await getOffer(offerId)

    const passengerCount = offer.passengers?.length || 1
    const duffelTotal = parseFloat(offer.total_amount)
    const pricing = calculatePricing(duffelTotal, passengerCount)

    // Check if offer has expired
    const isExpired = new Date(offer.expires_at) < new Date()

    return NextResponse.json({
      offerId: offer.id,
      expiresAt: offer.expires_at,
      isExpired,
      pricing: {
        total: pricing.displayTotal,
        perPerson: pricing.perPerson,
        currency: offer.total_currency,
      },
      passengers: offer.passengers,
    })
  } catch (error: any) {
    console.error('Get offer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get offer' },
      { status: 500 }
    )
  }
}
