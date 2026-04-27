/**
 * Duffel API client for TripAmigos
 * Handles flight search, offer retrieval, and booking
 *
 * Docs: https://duffel.com/docs/api/v2
 * Test mode: uses Duffel test token (prefix duffel_test_)
 */

const DUFFEL_API_URL = 'https://api.duffel.com'
const DUFFEL_TOKEN = process.env.DUFFEL_API_TOKEN || ''

// Markup: 4% baked into displayed flight prices
export const MARKUP_PERCENTAGE = 0.04

interface DuffelHeaders {
  'Authorization': string
  'Content-Type': string
  'Duffel-Version': string
  'Accept': string
}

function getHeaders(): DuffelHeaders {
  if (!DUFFEL_TOKEN) {
    throw new Error('DUFFEL_API_TOKEN is not set in environment variables')
  }
  return {
    'Authorization': `Bearer ${DUFFEL_TOKEN}`,
    'Content-Type': 'application/json',
    'Duffel-Version': 'v2',
    'Accept': 'application/json',
  }
}

// =====================================================
// TYPES
// =====================================================

export interface FlightSearchParams {
  origin: string          // IATA code e.g. 'LHR'
  destination: string     // IATA code e.g. 'BCN'
  departureDate: string   // YYYY-MM-DD
  returnDate: string      // YYYY-MM-DD
  passengers: number      // number of adult passengers
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
}

export interface DuffelOffer {
  id: string
  total_amount: string
  total_currency: string
  base_amount: string
  base_currency: string
  tax_amount: string
  tax_currency: string
  expires_at: string
  owner: { iata_code: string; name: string; logo_symbol_url: string }
  slices: DuffelSlice[]
  passengers: any[]
}

export interface DuffelSlice {
  id: string
  origin: { iata_code: string; name: string; city_name: string }
  destination: { iata_code: string; name: string; city_name: string }
  duration: string
  segments: DuffelSegment[]
}

export interface DuffelSegment {
  id: string
  origin: { iata_code: string; name: string }
  destination: { iata_code: string; name: string }
  departing_at: string
  arriving_at: string
  operating_carrier: { iata_code: string; name: string; logo_symbol_url: string }
  marketing_carrier: { iata_code: string; name: string }
  operating_carrier_flight_number: string
  duration: string
  stops: number
}

export interface PassengerDetails {
  id: string   // from the offer's passenger list
  title: string
  given_name: string
  family_name: string
  born_on: string   // YYYY-MM-DD
  gender: 'm' | 'f'
  email: string
  phone_number: string
}

// =====================================================
// SEARCH FLIGHTS
// Creates an offer request and returns available offers
// =====================================================

export async function searchFlights(params: FlightSearchParams): Promise<{
  offers: DuffelOffer[]
  offerRequestId: string
}> {
  // Build passengers array (all adults for now)
  const passengers = Array.from({ length: params.passengers }, () => ({
    type: 'adult',
  }))

  const body = {
    data: {
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        },
        {
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
        },
      ],
      passengers,
      cabin_class: params.cabinClass || 'economy',
      return_offers: true,
      max_connections: 1,
    },
  }

  const response = await fetch(`${DUFFEL_API_URL}/air/offer_requests`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(
      `Duffel search failed: ${response.status} ${error?.errors?.[0]?.message || response.statusText}`
    )
  }

  const result = await response.json()

  return {
    offers: result.data.offers || [],
    offerRequestId: result.data.id,
  }
}

// =====================================================
// GET SINGLE OFFER (fresh price before booking)
// =====================================================

export async function getOffer(offerId: string): Promise<DuffelOffer> {
  const response = await fetch(`${DUFFEL_API_URL}/air/offers/${offerId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(
      `Duffel get offer failed: ${response.status} ${error?.errors?.[0]?.message || response.statusText}`
    )
  }

  const result = await response.json()
  return result.data
}

// =====================================================
// CREATE ORDER (book the flight)
// =====================================================

export async function createOrder(
  offerId: string,
  passengers: PassengerDetails[],
  totalAmount: string,
  totalCurrency: string
): Promise<any> {
  const body = {
    data: {
      type: 'instant',
      selected_offers: [offerId],
      passengers: passengers.map(p => ({
        id: p.id,
        title: p.title,
        given_name: p.given_name,
        family_name: p.family_name,
        born_on: p.born_on,
        gender: p.gender,
        email: p.email,
        phone_number: p.phone_number,
      })),
      payments: [
        {
          type: 'balance',
          currency: totalCurrency,
          amount: totalAmount,
        },
      ],
    },
  }

  const response = await fetch(`${DUFFEL_API_URL}/air/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(
      `Duffel booking failed: ${response.status} ${error?.errors?.[0]?.message || response.statusText}`
    )
  }

  const result = await response.json()
  return result.data
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Format a Duffel duration string (e.g. "PT2H30M") to human readable
 */
export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const hours = match[1] ? parseInt(match[1]) : 0
  const mins = match[2] ? parseInt(match[2]) : 0
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Check if an offer has only direct flights (no stops/connections)
 */
export function isDirectFlight(offer: DuffelOffer): boolean {
  return offer.slices.every(slice => slice.segments.length === 1)
}

/**
 * Get the operating airline name from an offer
 */
export function getAirlineName(offer: DuffelOffer): string {
  return offer.owner?.name || offer.slices[0]?.segments[0]?.operating_carrier?.name || 'Airline'
}

/**
 * Get airline logo URL
 */
export function getAirlineLogo(offer: DuffelOffer): string | null {
  return offer.owner?.logo_symbol_url || null
}

/**
 * Apply 4% markup to Duffel's base price
 * This is baked into the displayed price — the customer never sees a separate fee
 */
export function applyMarkup(duffelTotal: number): number {
  return Math.round(duffelTotal * (1 + MARKUP_PERCENTAGE) * 100) / 100
}

/**
 * Calculate total pricing with markup applied
 */
export function calculatePricing(duffelTotal: number, passengers: number): {
  displayTotal: number
  perPerson: number
  markup: number
} {
  const displayTotal = applyMarkup(duffelTotal)
  const markup = Math.round((displayTotal - duffelTotal) * 100) / 100
  return {
    displayTotal,
    perPerson: Math.round((displayTotal / passengers) * 100) / 100,
    markup,
  }
}

/**
 * Sort and categorise offers into 3 tiers: best value, recommended, premium
 */
export function categoriseOffers(offers: DuffelOffer[], passengers: number): {
  bestValue: DuffelOffer | null
  recommended: DuffelOffer | null
  premium: DuffelOffer | null
} {
  if (offers.length === 0) {
    return { bestValue: null, recommended: null, premium: null }
  }

  // Sort by price ascending
  const sorted = [...offers].sort(
    (a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount)
  )

  // Prefer direct flights for recommended
  const directFlights = sorted.filter(isDirectFlight)

  // Best value: cheapest flight
  const bestValue = sorted[0]

  // Recommended: cheapest direct flight, or if none, the one in the middle
  const recommended =
    directFlights.length > 0
      ? directFlights[0]
      : sorted[Math.floor(sorted.length / 3)] || sorted[0]

  // Premium: cheapest direct flight with shortest duration, or most expensive third
  const premiumPool = directFlights.length > 2 ? directFlights : sorted
  const premiumIndex = Math.min(
    Math.floor(premiumPool.length * 0.66),
    premiumPool.length - 1
  )
  const premium = premiumPool[premiumIndex] || sorted[sorted.length - 1]

  // Make sure we don't return the same offer twice
  const usedIds = new Set<string>()
  const pick = (offer: DuffelOffer | null, fallbacks: DuffelOffer[]): DuffelOffer | null => {
    if (offer && !usedIds.has(offer.id)) {
      usedIds.add(offer.id)
      return offer
    }
    for (const fb of fallbacks) {
      if (!usedIds.has(fb.id)) {
        usedIds.add(fb.id)
        return fb
      }
    }
    return null
  }

  return {
    bestValue: pick(bestValue, sorted),
    recommended: pick(recommended, directFlights.length > 0 ? directFlights : sorted),
    premium: pick(premium, [...sorted].reverse()),
    _usedIds: usedIds,
    _sorted: sorted,
  }
}

export function getExtraOffers(
  offers: DuffelOffer[],
  usedIds: Set<string>,
  sorted: DuffelOffer[],
  count: number = 3,
): DuffelOffer[] {
  return sorted
    .filter(o => !usedIds.has(o.id))
    .slice(0, count)
}
