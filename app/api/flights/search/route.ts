export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { searchFlights, categoriseOffers, calculatePricing } from '@/lib/duffel'

// Retry wrapper for rate-limited Duffel calls
async function searchWithRetry(
  params: Parameters<typeof searchFlights>[0],
  maxRetries = 3
): ReturnType<typeof searchFlights> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await searchFlights(params)
    } catch (err: any) {
      const isRateLimit = err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit')
      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000
        console.warn(`Duffel rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, departureDate, returnDate, passengers, cabinClass } = body

    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate || !passengers) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, departureDate, returnDate, passengers' },
        { status: 400 }
      )
    }

    // If dates are in the past, shift them forward to make the search work
    // (common during demos when trip was created with old test dates)
    let searchDepartureDate = departureDate
    let searchReturnDate = returnDate
    let datesAdjusted = false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const depDate = new Date(departureDate)

    if (depDate < today) {
      // Shift both dates forward by the same amount — preserving the trip length
      const tripLengthMs = new Date(returnDate).getTime() - depDate.getTime()
      const newDep = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from today
      const newRet = new Date(newDep.getTime() + tripLengthMs)
      searchDepartureDate = newDep.toISOString().split('T')[0]
      searchReturnDate = newRet.toISOString().split('T')[0]
      datesAdjusted = true
      console.log(`Dates adjusted: ${departureDate}→${searchDepartureDate}, ${returnDate}→${searchReturnDate}`)
    }

    // Search Duffel (with automatic retry on rate limit)
    const { offers, offerRequestId } = await searchWithRetry({
      origin,
      destination,
      departureDate: searchDepartureDate,
      returnDate: searchReturnDate,
      passengers: parseInt(passengers),
      cabinClass: cabinClass || 'economy',
    })

    // Categorise into 3 tiers
    const categorised = categoriseOffers(offers, parseInt(passengers))

    // Build response with pricing breakdowns
    const formatOption = (offer: any, tier: string, tierLabel: string) => {
      if (!offer) return null

      const duffelTotal = parseFloat(offer.total_amount)
      const pricing = calculatePricing(duffelTotal, parseInt(passengers))

      return {
        tier,
        tierLabel,
        offerId: offer.id,
        expiresAt: offer.expires_at,
        airline: {
          name: offer.owner?.name || 'Airline',
          iataCode: offer.owner?.iata_code || '',
          logo: offer.owner?.logo_symbol_url || null,
        },
        slices: offer.slices.map((slice: any) => ({
          origin: {
            code: slice.origin.iata_code,
            name: slice.origin.name,
            city: slice.origin.city_name,
          },
          destination: {
            code: slice.destination.iata_code,
            name: slice.destination.name,
            city: slice.destination.city_name,
          },
          duration: slice.duration,
          segments: slice.segments.map((seg: any) => ({
            carrier: seg.operating_carrier?.name || seg.marketing_carrier?.name,
            carrierCode: seg.operating_carrier?.iata_code,
            flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.operating_carrier_flight_number || ''}`,
            departingAt: seg.departing_at,
            arrivingAt: seg.arriving_at,
            origin: seg.origin.iata_code,
            destination: seg.destination.iata_code,
            duration: seg.duration,
          })),
          stops: slice.segments.length - 1,
          isDirect: slice.segments.length === 1,
        })),
        pricing: {
          total: pricing.displayTotal,
          perPerson: pricing.perPerson,
          currency: offer.total_currency,
        },
        passengers: parseInt(passengers),
      }
    }

    const options = [
      formatOption(categorised.bestValue, 'best-value', 'Best value'),
      formatOption(categorised.recommended, 'recommended', 'Recommended'),
      formatOption(categorised.premium, 'premium', 'Premium'),
    ].filter(Boolean)

    return NextResponse.json({
      options,
      offerRequestId,
      totalOffers: offers.length,
      ...(datesAdjusted && { datesAdjusted: true }),
    })
  } catch (error: any) {
    console.error('Flight search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search flights' },
      { status: 500 }
    )
  }
}
