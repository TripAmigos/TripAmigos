'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Loader, AlertTriangle, RefreshCw, Plane, Train, Car, Clock, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, Repeat, Building2, Star, MapPin, ExternalLink, Coffee, Check, Users, Calendar, Gift, EyeOff, Globe, Info } from 'lucide-react'
import { formatDuration } from '@/lib/duffel'
import { cityToIATA, airportToIATA, getFallbackAirports, getAirportLabel } from '@/lib/airports'
import { resolveStationToCity } from '@/lib/travel-hubs'

interface TripOptionsProps {
  trip: any
  preferences: any[]
  members: any[]
  userId: string
  transportMode: 'flight' | 'train' | 'both'
}

// =====================================================
// TYPES
// =====================================================

interface FlightOption {
  tier: string
  tierLabel: string
  offerId: string
  expiresAt: string
  airline: { name: string; iataCode: string; logo: string | null }
  slices: {
    origin: { code: string; name: string; city: string }
    destination: { code: string; name: string; city: string }
    duration: string
    segments: {
      carrier: string
      carrierCode: string
      flightNumber: string
      departingAt: string
      arrivingAt: string
      origin: string
      destination: string
      duration: string
    }[]
    stops: number
    isDirect: boolean
  }[]
  pricing: {
    total: number
    perPerson: number
    currency: string
  }
  passengers: number
}

interface TrainLeg {
  operator: string
  trainNumber: string
  departureStation: string
  arrivalStation: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  platform?: string
}

interface TrainJourney {
  id: string
  departureStation: string
  arrivalStation: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  changes: number
  legs: TrainLeg[]
  operator: string
}

interface TrainOption {
  id: string
  tier: string
  tierLabel: string
  outbound: TrainJourney
  returnJourney: TrainJourney
  ticketType: string
  ticketDescription: string
  class: 'standard' | 'first'
  pricePerPerson: number
  totalPrice: number
  currency: string
  passengers: number
  isFlexible: boolean
  refundable: boolean
  expiresAt: string
}

interface HotelOption {
  id: string
  name: string
  starRating: number
  reviewScore: number
  reviewCount: number
  reviewWord: string
  address: string
  city: string
  country: string
  photoUrl: string
  amenities: string[]
  distanceFromCentre: string
  pricePerNight: number
  totalPrice: number
  currency: string
  nights: number
  guests: number
  rooms: number
  roomType: string
  freeCancellation: boolean
  breakfastIncluded: boolean
  bookingUrl: string
  tier: 'budget' | 'mid-range' | 'premium'
  tierLabel: string
}

// A "route" groups members travelling the same way from the same place
interface TravelRoute {
  id: string
  origin: string           // Resolved city name (e.g. "London", "Madrid")
  mode: 'flight' | 'train' | 'drive'
  members: { name: string; memberId: string; isCovered: boolean; isSurprise: boolean }[]
  passengerCount: number
  // Results
  flightOptions: FlightOption[]
  trainOptions: TrainOption[]
  searching: boolean
  selectedOptionId: string | null
  // Fallback airport info
  preferredAirport?: string   // IATA of original preferred airport (e.g. 'LGW')
  usedAirport?: string        // IATA of airport actually used (e.g. 'LHR' if LGW had no flights)
  fallbackNote?: string       // Human-readable message if fallback was used
}

type WizardStep = 'intro' | 'transport' | 'hotel' | 'summary'

// =====================================================
// COMPONENT
// =====================================================

export default function TripOptions({ trip, preferences, members, userId, transportMode }: TripOptionsProps) {
  const router = useRouter()

  // Wizard
  const [step, setStep] = useState<WizardStep>('intro')
  const [booking, setBooking] = useState(false)

  // Routes (multi-origin support)
  const [routes, setRoutes] = useState<TravelRoute[]>([])
  const [routesSearching, setRoutesSearching] = useState(true)

  // Hotel state
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([])
  const [hotelsSearching, setHotelsSearching] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null)

  // UI state
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [tiebreakChoice, setTiebreakChoice] = useState<string | null>(null)

  // Timer (for flight expiry)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerStarted, setTimerStarted] = useState(false)

  const submitted = preferences.filter(p => p.is_submitted)
  const startDate = new Date(trip.date_from)
  const endDate = new Date(trip.date_to)
  const groupSize = trip.group_size || 4
  const roomSharing = trip.room_sharing || 'individual'
  const costSplit = trip.cost_split || 'even'
  const roomCount = roomSharing === 'shared' ? Math.ceil(groupSize / 2) : groupSize

  // Covered members: their costs are redistributed to everyone else
  const coveredMembers = members.filter((m: any) => m.costs_covered)
  const coveredCount = coveredMembers.length
  const payingHeadcount = groupSize - coveredCount

  // Surprise members: they're in the trip but don't vote (organiser entered their details)
  const surpriseMembers = members.filter((m: any) => m.role === 'surprise')

  // Visa awareness: extract distinct nationalities from submitted preferences
  const groupNationalities = useMemo(() => {
    const nats = submitted
      .map(p => p.nationality)
      .filter(Boolean)
      .map((n: string) => n.trim().charAt(0).toUpperCase() + n.trim().slice(1).toLowerCase())
    return [...new Set(nats)]
  }, [submitted])
  const hasMultipleNationalities = groupNationalities.length > 1

  // =====================================================
  // DESTINATION VOTING + TIE DETECTION
  // =====================================================

  const destinationVotes = useMemo(() => {
    const counts: Record<string, number> = {}
    submitted.forEach(p => {
      if (p.preferred_destinations) {
        p.preferred_destinations.forEach((d: string) => {
          counts[d] = (counts[d] || 0) + 1
        })
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [submitted])

  const tiedDestinations = useMemo(() => {
    if (destinationVotes.length < 2) return []
    const topScore = destinationVotes[0]?.[1] || 0
    const tied = destinationVotes.filter(([_, count]) => count === topScore)
    return tied.length > 1 ? tied.map(([city]) => city) : []
  }, [destinationVotes])

  const hasTie = tiedDestinations.length > 1

  const topDestination = useMemo(() => {
    if (hasTie && tiebreakChoice) return tiebreakChoice
    if (hasTie) return null
    return destinationVotes[0]?.[0] || trip.shortlisted_cities?.[0] || null
  }, [hasTie, tiebreakChoice, destinationVotes, trip.shortlisted_cities])

  const destCity = topDestination?.split(',')[0] || 'your destination'

  // =====================================================
  // BUILD ROUTES FROM MEMBER PREFERENCES
  // =====================================================

  const computedRoutes = useMemo(() => {
    const routeMap: Record<string, TravelRoute> = {}

    submitted.forEach(pref => {
      const origin = resolveStationToCity(pref.preferred_airport || 'London')
      const mode: 'flight' | 'train' | 'drive' =
        pref.transport_preference === 'train' ? 'train'
        : pref.transport_preference === 'drive' ? 'drive'
        : 'flight'
      const routeKey = `${origin}_${mode}`

      // Find the member's name from the members array
      // Match by member_id first, fall back to trip_member_id for surprise attendees (no user account)
      const member = members.find((m: any) => m.member_id === pref.member_id)
        || members.find((m: any) => m.id === pref.trip_member_id)
      const name = member?.first_name
        ? `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`
        : member?.guest_name || 'Group member'
      const isSurprise = member?.role === 'surprise'
      const isCovered = member?.costs_covered === true

      if (!routeMap[routeKey]) {
        routeMap[routeKey] = {
          id: routeKey,
          origin,
          mode,
          members: [],
          passengerCount: 0,
          flightOptions: [],
          trainOptions: [],
          // Drivers don't need search — mark as complete immediately
          searching: mode !== 'drive',
          // Drivers are auto-selected (no cost, no option to pick)
          selectedOptionId: mode === 'drive' ? 'self-arranged' : null,
        }
      }

      routeMap[routeKey].members.push({ name, memberId: pref.member_id, isCovered, isSurprise })
      routeMap[routeKey].passengerCount += 1
    })

    return Object.values(routeMap)
  }, [submitted, members])

  // =====================================================
  // SEARCH ROUTES ON MOUNT
  // =====================================================

  useEffect(() => {
    if (!topDestination || computedRoutes.length === 0) {
      setRoutesSearching(false)
      return
    }

    // Initialise routes state
    setRoutes(computedRoutes)

    const searchAllRoutes = async () => {
      const updatedRoutes = [...computedRoutes]

      // Search routes sequentially to avoid hitting Duffel rate limits
      for (let index = 0; index < updatedRoutes.length; index++) {
        const route = updatedRoutes[index]

        // Drivers arrange their own transport — skip search
        if (route.mode === 'drive') continue

        try {
          if (route.mode === 'train') {
            const res = await fetch('/api/trains/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                origin: route.origin,
                destination: topDestination,
                departureDate: trip.date_from,
                returnDate: trip.date_to,
                passengers: String(route.passengerCount),
              }),
            })
            const data = await res.json()
            updatedRoutes[index] = {
              ...updatedRoutes[index],
              trainOptions: data.options || [],
              searching: false,
            }
          } else {
            const destIATA = cityToIATA(topDestination)
            const primaryIATA = airportToIATA(route.origin)

            if (destIATA && primaryIATA) {
              // Try the preferred airport first, then fallbacks in order
              const airportsToTry = getFallbackAirports(primaryIATA)
              let foundOptions: FlightOption[] = []
              let usedIATA = primaryIATA

              for (const tryIATA of airportsToTry) {
                try {
                  const controller = new AbortController()
                  const timeout = setTimeout(() => controller.abort(), 45000)
                  const res = await fetch('/api/flights/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      origin: tryIATA,
                      destination: destIATA,
                      departureDate: trip.date_from,
                      returnDate: trip.date_to,
                      passengers: String(route.passengerCount),
                    }),
                    signal: controller.signal,
                  })
                  clearTimeout(timeout)
                  const data = await res.json()
                  if (data.options?.length > 0) {
                    foundOptions = data.options
                    usedIATA = tryIATA
                    break // Found flights, stop trying fallbacks
                  }
                } catch (err: any) {
                  if (err.name === 'AbortError') {
                    console.warn(`Flight search from ${tryIATA} timed out, trying next...`)
                  } else {
                    console.warn(`No results from ${tryIATA}, trying next fallback...`)
                  }
                }
              }

              // Build fallback note if we ended up using a different airport
              const isFallback = usedIATA !== primaryIATA && foundOptions.length > 0
              const fallbackNote = isFallback
                ? `No flights found from ${getAirportLabel(primaryIATA)} to ${destCity}, showing flights from ${getAirportLabel(usedIATA)} instead`
                : undefined

              updatedRoutes[index] = {
                ...updatedRoutes[index],
                flightOptions: foundOptions,
                searching: false,
                preferredAirport: primaryIATA,
                usedAirport: usedIATA,
                fallbackNote,
              }

              // Set timer from first flight route's expiry
              if (foundOptions.length > 0 && !timerStarted) {
                const earliestExpiry = foundOptions.reduce((min: string, opt: FlightOption) => {
                  return opt.expiresAt < min ? opt.expiresAt : min
                }, foundOptions[0].expiresAt)
                const expiryTime = new Date(earliestExpiry).getTime()
                const secondsLeft = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
                setTimeLeft(Math.min(secondsLeft, 10 * 60))
                setTimerStarted(true)
              }
            } else {
              updatedRoutes[index] = { ...updatedRoutes[index], searching: false }
            }
          }

          // Update UI progressively as each route completes
          setRoutes([...updatedRoutes])
        } catch (err) {
          console.error(`Search error for route ${route.id}:`, err)
          updatedRoutes[index] = { ...updatedRoutes[index], searching: false }
          setRoutes([...updatedRoutes])
        }
      }

      setRoutes([...updatedRoutes])
      setRoutesSearching(false)
    }

    searchAllRoutes().catch((err) => {
      console.error('Route search failed entirely:', err)
      setRoutesSearching(false)
    })
  }, [topDestination, computedRoutes, trip.date_from, trip.date_to])

  // Hotel search
  useEffect(() => {
    if (!topDestination) {
      setHotelsSearching(false)
      return
    }

    const searchHotels = async () => {
      try {
        const res = await fetch('/api/hotels/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: topDestination,
            checkIn: trip.date_from,
            checkOut: trip.date_to,
            guests: String(groupSize),
            rooms: roomCount,
          }),
        })
        const data = await res.json()
        if (data.hotels?.length > 0) {
          setHotelOptions(data.hotels)
        }
      } catch (err) {
        console.error('Hotel search error:', err)
      } finally {
        setHotelsSearching(false)
      }
    }

    searchHotels()
  }, [topDestination, trip.date_from, trip.date_to, groupSize])

  // Timer
  useEffect(() => {
    if (!timerStarted || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerStarted, timeLeft])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timerUrgent = timeLeft > 0 && timeLeft < 120
  const timerExpired = timerStarted && timeLeft <= 0

  // Route selection helpers
  const setRouteSelection = (routeId: string, optionId: string) => {
    setRoutes(prev => prev.map(r =>
      r.id === routeId ? { ...r, selectedOptionId: optionId } : r
    ))
  }

  const allRoutesSelected = routes.length > 0 && routes.every(r => r.selectedOptionId !== null)

  // Calculate transport totals (drive routes are £0)
  const transportTotal = useMemo(() => {
    return routes.reduce((sum, route) => {
      if (!route.selectedOptionId || route.mode === 'drive') return sum
      if (route.mode === 'train') {
        const opt = route.trainOptions.find(o => o.id === route.selectedOptionId)
        return sum + (opt?.totalPrice || 0)
      } else {
        const opt = route.flightOptions.find(o => o.offerId === route.selectedOptionId)
        return sum + (opt?.pricing.total || 0)
      }
    }, 0)
  }, [routes])

  const selectedHotelOption = hotelOptions.find(h => h.id === selectedHotel)

  const tierConfig: Record<string, { tag: string; tagColor: string }> = {
    'best-value': { tag: 'Option A', tagColor: 'bg-green-100 text-green-700' },
    'recommended': { tag: 'Option B', tagColor: 'bg-accent-light text-accent' },
    'premium': { tag: 'Option C', tagColor: 'bg-purple-100 text-purple-700' },
  }

  // =====================================================
  // STEP 1: INTRO
  // =====================================================

  if (step === 'intro') {
    // Tiebreaker screen
    if (hasTie && !tiebreakChoice) {
      const voteCount = destinationVotes[0]?.[1] || 0
      return (
        <div className="max-w-2xl mx-auto text-center py-12 space-y-8">
          <StepIndicator current={1} />
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-primary">It's a tie!</h1>
            <p className="text-text-secondary text-lg max-w-md mx-auto">
              {tiedDestinations.length === 2 ? (
                <><strong className="text-primary">{tiedDestinations[0].split(',')[0]}</strong> and <strong className="text-primary">{tiedDestinations[1].split(',')[0]}</strong> both got {voteCount} vote{voteCount !== 1 ? 's' : ''}.</>
              ) : (
                <>{tiedDestinations.map((d, i) => <span key={d}>{i > 0 && ', '}<strong className="text-primary">{d.split(',')[0]}</strong></span>)} all got {voteCount} vote{voteCount !== 1 ? 's' : ''} each.</>
              )}
            </p>
            <p className="text-accent font-semibold">
              As the organiser, you have the deciding vote — where are we going?
            </p>
          </div>

          <div className={`grid gap-4 max-w-lg mx-auto ${tiedDestinations.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {tiedDestinations.map(dest => {
              const cityName = dest.split(',')[0]
              return (
                <button
                  key={dest}
                  onClick={() => setTiebreakChoice(dest)}
                  className="bg-white border-2 border-border rounded-card p-6 hover:border-accent hover:shadow-lg transition-all duration-200 space-y-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-light group-hover:bg-accent flex items-center justify-center mx-auto transition-colors">
                    <MapPin size={20} className="text-accent group-hover:text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">{cityName}</h3>
                  <p className="text-xs text-text-secondary">{voteCount} vote{voteCount !== 1 ? 's' : ''}</p>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    // Normal intro
    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-8">
        <StepIndicator current={1} />

        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center mx-auto">
            <Check size={28} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-primary">
            {hasTie && tiebreakChoice ? `${tiebreakChoice.split(',')[0]} it is!` : "Your group's options are in!"}
          </h1>
          <p className="text-text-secondary text-lg max-w-md mx-auto">
            Everyone's voted. Now let's find the perfect trip to <strong className="text-primary">{destCity}</strong>.
          </p>
        </div>

        {/* Trip summary */}
        <div className="bg-bg-soft rounded-card p-6 space-y-4 text-left max-w-sm mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <MapPin size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Destination</p>
              <p className="text-sm font-semibold text-primary">{destCity}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <Calendar size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Dates</p>
              <p className="text-sm font-semibold text-primary">{format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <Users size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Group size</p>
              <p className="text-sm font-semibold text-primary">{groupSize} people</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <Building2 size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Rooms</p>
              <p className="text-sm font-semibold text-primary">
                {roomCount} room{roomCount !== 1 ? 's' : ''}
                {roomSharing === 'shared' ? ' (sharing)' : ' (own rooms)'}
              </p>
            </div>
          </div>
          {coveredCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Gift size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase font-bold">Costs covered</p>
                <p className="text-sm font-semibold text-primary">
                  {coveredMembers.map((m: any) => m.first_name || m.guest_name).join(', ')} — split across {payingHeadcount} others
                </p>
              </div>
            </div>
          )}
          {surpriseMembers.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <EyeOff size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase font-bold">Surprise attendee{surpriseMembers.length > 1 ? 's' : ''}</p>
                <p className="text-sm font-semibold text-primary">
                  {surpriseMembers.map((m: any) => m.first_name || m.guest_name).join(', ')} — included but won't see the trip
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Visa awareness banner */}
        {groupNationalities.length > 0 && (
          <div className={`rounded-card p-4 text-left max-w-sm mx-auto flex items-start gap-3 ${
            hasMultipleNationalities
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              hasMultipleNationalities ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              <Globe size={16} className={hasMultipleNationalities ? 'text-amber-600' : 'text-blue-600'} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${hasMultipleNationalities ? 'text-amber-800' : 'text-blue-800'}`}>
                {hasMultipleNationalities ? 'Mixed nationalities in your group' : 'Check visa requirements'}
              </p>
              <p className={`text-xs leading-relaxed mt-1 ${hasMultipleNationalities ? 'text-amber-700' : 'text-blue-700'}`}>
                {hasMultipleNationalities
                  ? `Your group includes ${groupNationalities.join(', ')} travellers heading to ${destCity}. Visa and entry requirements may differ — we recommend everyone checks before booking.`
                  : `Heading to ${destCity} as ${groupNationalities[0]} travellers — make sure everyone has checked entry requirements before booking.`
                }
              </p>
              <a
                href={`https://www.iatatravelcentre.com/world.php`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${
                  hasMultipleNationalities ? 'text-amber-800 hover:text-amber-900' : 'text-blue-800 hover:text-blue-900'
                }`}
              >
                Check entry requirements <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}

        {/* Routes preview */}
        {computedRoutes.length > 1 && (
          <div className="space-y-3 max-w-sm mx-auto">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Travel routes</p>
            <div className="space-y-2 text-left">
              {computedRoutes.map(route => (
                <div key={route.id} className="flex items-center gap-3 p-3 rounded-input bg-white border border-border">
                  <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
                    {route.mode === 'train' ? <Train size={12} className="text-accent" /> : route.mode === 'drive' ? <Car size={12} className="text-accent" /> : <Plane size={12} className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {route.origin} → {destCity}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {route.members.map(m => m.name.split(' ')[0]).join(', ')} · {route.mode === 'train' ? 'Train' : route.mode === 'drive' ? 'Driving' : 'Flight'}
                    </p>
                  </div>
                  {route.mode !== 'drive' && (
                    <span className="text-xs text-text-muted flex-shrink-0">{route.passengerCount} pax</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3 max-w-sm mx-auto">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Here's the plan</p>
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-3 p-3 rounded-input bg-white border border-border">
              <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <p className="text-sm text-primary font-medium">
                {computedRoutes.length > 1 ? `Choose travel for ${computedRoutes.length} routes` : 'Choose your travel'}
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-input bg-white border border-border">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-text-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <p className="text-sm text-text-secondary">Pick where to stay</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-input bg-white border border-border">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-text-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <p className="text-sm text-text-secondary">Confirm & book</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep('transport')}
          disabled={routesSearching && !hasTie}
          className="px-8 py-4 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-card font-bold text-lg inline-flex items-center gap-2 transition-colors shadow-lg"
        >
          {routesSearching ? (
            <><Loader size={20} className="animate-spin" /> Finding options...</>
          ) : (
            <>Let's go <ArrowRight size={20} /></>
          )}
        </button>
      </div>
    )
  }

  // =====================================================
  // STEP 2: TRANSPORT (MULTI-ROUTE)
  // =====================================================

  if (step === 'transport') {
    if (routesSearching) {
      return (
        <div className="max-w-4xl mx-auto text-center py-20 space-y-6">
          <StepIndicator current={2} />
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            <Plane size={24} className="absolute inset-0 m-auto text-accent" />
          </div>
          <h2 className="text-xl font-bold text-primary">Finding options for your group...</h2>
          <p className="text-text-secondary text-sm">Checking live prices for {groupSize} people travelling to {destCity}.</p>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <StepIndicator current={2} />

        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-accent uppercase tracking-wider">Step 1 of 3</p>
          <h1 className="text-3xl font-bold text-primary">Choose travel for your group</h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            {routes.length === 1
              ? `Here are 3 options that match your group's requirements for ${groupSize} people, ${routes[0].origin} → ${destCity}.`
              : `Your group has ${routes.length} routes to ${destCity}. Here are options that match each route's requirements — pick one for each.`
            }
          </p>
        </div>

        {/* Timer */}
        {timerStarted && (
          <div className={`rounded-card p-4 text-center space-y-2 ${
            timerExpired
              ? 'bg-gray-100 border border-border'
              : timerUrgent
                ? 'bg-red-50 border border-red-200'
                : 'bg-gradient-to-r from-primary to-[#0f2640] text-white'
          }`}>
            {timerExpired ? (
              <>
                <p className="text-sm font-semibold text-text-secondary">Flight prices may have changed</p>
                <button onClick={() => window.location.reload()} className="mt-1 px-4 py-1.5 bg-accent text-white rounded-input text-xs font-semibold hover:bg-accent-hover transition-colors inline-flex items-center gap-1.5">
                  <RefreshCw size={12} /> Refresh prices
                </button>
              </>
            ) : (
              <>
                <div className={`font-mono text-2xl font-bold ${timerUrgent ? 'text-red-600' : ''}`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <p className={`text-xs ${timerUrgent ? 'text-red-700' : 'text-white/70'}`}>Live prices held for you</p>
              </>
            )}
          </div>
        )}

        {/* Routes */}
        {routes.map((route, routeIndex) => {
          const hasOptions = route.flightOptions.length > 0 || route.trainOptions.length > 0
          const routeIcon = route.mode === 'train' ? <Train size={18} className="text-accent" />
            : route.mode === 'drive' ? <Car size={18} className="text-accent" />
            : <Plane size={18} className="text-accent" />
          const modeLabel = route.mode === 'drive' ? 'driving' : route.mode

          return (
            <div key={route.id} className="space-y-4">
              {/* Route header */}
              <div className="flex items-center gap-3 p-4 bg-bg-soft rounded-card">
                <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
                  {routeIcon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-primary">
                      {route.origin} → {destCity}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-accent-light text-accent">
                      {modeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {route.members.map(m => m.name.split(' ')[0]).join(', ')}
                    {route.mode !== 'drive' && (
                      <>{' · '}{route.passengerCount} passenger{route.passengerCount !== 1 ? 's' : ''}</>
                    )}
                  </p>
                </div>
                {route.selectedOptionId && (
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>

              {/* Drive route — no transport to book */}
              {route.mode === 'drive' && (
                <div className="bg-green-50 border border-green-200 rounded-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Car size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      {route.members.map(m => m.name.split(' ')[0]).join(', ')} {route.members.length === 1 ? 'is' : 'are'} driving
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Making their own way to {destCity} — no transport cost for {route.members.length === 1 ? 'this person' : 'these members'}.
                      They'll still be included in the hotel booking.
                    </p>
                  </div>
                </div>
              )}

              {/* Fallback airport notice */}
              {route.fallbackNote && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-card">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{route.fallbackNote}</p>
                </div>
              )}

              {/* Options for this route (flights / trains only) */}
              {route.mode !== 'drive' && (
                route.searching ? (
                  <div className="text-center py-6">
                    <Loader size={20} className="animate-spin text-accent mx-auto" />
                    <p className="text-xs text-text-muted mt-2">Searching...</p>
                  </div>
                ) : !hasOptions ? (
                  <div className="text-center py-6">
                    <AlertTriangle size={20} className="text-amber-500 mx-auto" />
                    <p className="text-xs text-text-secondary mt-2">No {route.mode} options found for this route.</p>
                  </div>
                ) : route.mode === 'train' ? (
                  <div className="space-y-3">
                    {route.trainOptions.map(option =>
                      renderTrainCard(option, tierConfig, route.selectedOptionId, (id) => setRouteSelection(route.id, id), expandedCard, setExpandedCard, startDate, endDate, false)
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {route.flightOptions.map(option =>
                      renderFlightCard(option, tierConfig, route.selectedOptionId, (id) => setRouteSelection(route.id, id), expandedCard, setExpandedCard, destCity, startDate, endDate, timerExpired)
                    )}
                  </div>
                )
              )}

              {/* Divider between routes */}
              {routeIndex < routes.length - 1 && (
                <div className="border-t-2 border-dashed border-border" />
              )}
            </div>
          )
        })}

        {/* Next button */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-border -mx-4 px-4 py-4 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent">
          {allRoutesSelected ? (
            <div className="space-y-3">
              {/* Selection summary */}
              <div className="bg-bg-soft rounded-card p-4 space-y-2">
                {routes.map(route => {
                  if (route.mode === 'drive') {
                    return (
                      <div key={route.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Car size={14} className="text-accent" />
                          <span className="text-text-secondary">
                            {route.members.map(m => m.name.split(' ')[0]).join(', ')} · Driving
                          </span>
                        </div>
                        <span className="font-semibold text-green-600">£0.00</span>
                      </div>
                    )
                  }

                  const opt = route.mode === 'train'
                    ? route.trainOptions.find(o => o.id === route.selectedOptionId)
                    : route.flightOptions.find(o => o.offerId === route.selectedOptionId)
                  const price = route.mode === 'train'
                    ? (opt as TrainOption)?.totalPrice || 0
                    : (opt as FlightOption)?.pricing.total || 0
                  const label = route.mode === 'train'
                    ? (opt as TrainOption)?.outbound.operator
                    : (opt as FlightOption)?.airline.name

                  return (
                    <div key={route.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {route.mode === 'train' ? <Train size={14} className="text-accent" /> : <Plane size={14} className="text-accent" />}
                        <span className="text-text-secondary">
                          {route.members.map(m => m.name.split(' ')[0]).join(', ')} · {label}
                        </span>
                      </div>
                      <span className="font-semibold text-primary">£{price.toFixed(2)}</span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-border">
                  <span className="text-primary">Transport total</span>
                  <span className="text-primary">£{transportTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('hotel')}
                disabled={timerExpired && routes.some(r => r.mode === 'flight')}
                className="w-full py-4 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-card font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                Next: choose your hotel <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-text-secondary">
                {routes.filter(r => r.selectedOptionId).length} of {routes.length} route{routes.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =====================================================
  // STEP 3: HOTELS
  // =====================================================

  if (step === 'hotel') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <StepIndicator current={3} />

        <button onClick={() => setStep('transport')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft size={14} /> Back to travel
        </button>

        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-accent uppercase tracking-wider">Step 2 of 3</p>
          <h1 className="text-3xl font-bold text-primary">Where to stay in {destCity}</h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Here are 3 hotels that match your group's requirements — {roomCount} room{roomCount !== 1 ? 's' : ''} for {groupSize} guest{groupSize !== 1 ? 's' : ''}
            {roomSharing === 'shared' ? ' (sharing)' : ''}. You'll book through Booking.com.
          </p>
        </div>

        {/* Transport confirmed banner */}
        <div className="bg-green-50 border border-green-200 rounded-card px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">
                Travel selected · {routes.length} route{routes.length !== 1 ? 's' : ''} · £{transportTotal.toFixed(2)}
              </p>
              <p className="text-xs text-green-700">
                {routes.map(r => `${r.members.map(m => m.name.split(' ')[0]).join(', ')} from ${r.origin}`).join(' · ')}
              </p>
            </div>
          </div>
          <button onClick={() => setStep('transport')} className="text-xs text-green-700 hover:text-green-900 font-medium">Change</button>
        </div>

        {/* Hotel cards */}
        {hotelsSearching ? (
          <div className="text-center py-10 space-y-3">
            <div className="relative w-14 h-14 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
              <Building2 size={18} className="absolute inset-0 m-auto text-accent" />
            </div>
            <p className="text-sm text-text-secondary">Finding hotels for your group...</p>
          </div>
        ) : hotelOptions.length > 0 ? (
          <>
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <Building2 size={12} />
              <span>Hotels via Booking.com · Prices updated just now</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {hotelOptions.map(hotel => renderHotelCard(hotel, selectedHotel, setSelectedHotel))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 space-y-3">
            <Building2 size={32} className="mx-auto text-text-muted" />
            <p className="text-sm text-text-secondary">No hotels found for this destination.</p>
          </div>
        )}

        {/* Next button */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-border -mx-4 px-4 py-4 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent">
          {selectedHotel ? (
            <div className="space-y-3">
              <div className="bg-bg-soft rounded-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{selectedHotelOption?.name}</p>
                    <p className="text-xs text-text-secondary">£{selectedHotelOption?.totalPrice.toLocaleString()} · {selectedHotelOption?.nights} nights</p>
                  </div>
                </div>
                <button onClick={() => setSelectedHotel(null)} className="text-xs text-text-muted hover:text-primary">Change</button>
              </div>
              <button
                onClick={() => setStep('summary')}
                className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-card font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                Next: review & book <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-text-secondary">Select a hotel above to continue</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =====================================================
  // STEP 4: SUMMARY & BOOK
  // =====================================================

  if (step === 'summary') {
    const grandTotal = transportTotal + (selectedHotelOption?.totalPrice || 0)

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <StepIndicator current={4} />

        <button onClick={() => setStep('hotel')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft size={14} /> Back to hotels
        </button>

        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-accent uppercase tracking-wider">Step 3 of 3</p>
          <h1 className="text-3xl font-bold text-primary">Review & book</h1>
          <p className="text-text-secondary">Here's everything for your trip to {destCity}. Let's lock it in.</p>
        </div>

        {/* Trip breakdown */}
        <div className="bg-white border border-border rounded-card overflow-hidden">
          {/* Transport routes */}
          <div className="p-5 space-y-4 border-b border-border">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Travel</p>
            {routes.map(route => {
              if (route.mode === 'drive') {
                return (
                  <div key={route.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center">
                        <Car size={16} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {route.members.map(m => m.name.split(' ')[0]).join(', ')}
                        </p>
                        <p className="text-xs text-text-secondary">
                          Driving to {destCity} · No transport cost
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-600">£0.00</p>
                  </div>
                )
              }

              const opt = route.mode === 'train'
                ? route.trainOptions.find(o => o.id === route.selectedOptionId)
                : route.flightOptions.find(o => o.offerId === route.selectedOptionId)
              const price = route.mode === 'train'
                ? (opt as TrainOption)?.totalPrice || 0
                : (opt as FlightOption)?.pricing.total || 0
              const label = route.mode === 'train'
                ? `${(opt as TrainOption)?.outbound.operator} · ${(opt as TrainOption)?.ticketType}`
                : (opt as FlightOption)?.airline.name

              return (
                <div key={route.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center">
                      {route.mode === 'train' ? <Train size={16} className="text-accent" /> : <Plane size={16} className="text-accent" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {route.members.map(m => m.name.split(' ')[0]).join(', ')}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {route.origin} → {destCity} · {label} · {route.passengerCount} pax
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">£{price.toFixed(2)}</p>
                </div>
              )
            })}
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-input">
              <Check size={12} className="text-green-600" />
              <p className="text-xs text-green-700 font-medium">Books on TripAmigos · Each member gets their confirmation emailed</p>
            </div>
          </div>

          {/* Hotel */}
          <div className="p-5 space-y-3">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Accommodation</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center">
                  <Building2 size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{selectedHotelOption?.name}</p>
                  <p className="text-xs text-text-secondary">
                    {selectedHotelOption?.rooms} room{(selectedHotelOption?.rooms || 0) > 1 ? 's' : ''} · {selectedHotelOption?.nights} nights · {selectedHotelOption?.roomType}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-primary">£{selectedHotelOption?.totalPrice.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-input">
              <ExternalLink size={12} className="text-blue-600" />
              <p className="text-xs text-blue-700 font-medium">Books on Booking.com (you'll be redirected)</p>
            </div>
          </div>
        </div>

        {/* Grand total */}
        <div className="bg-primary rounded-card p-5 text-white space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70">Total trip cost ({groupSize} people)</p>
            <p className="text-2xl font-bold">£{grandTotal.toLocaleString()}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <p className="text-sm text-white/70">
              Per paying person
              {coveredCount > 0 ? ` (${payingHeadcount} paying, ${coveredCount} covered)` : ''}
              {costSplit === 'exact' ? ' · varies by route' : ' · even split'}
            </p>
            <p className="text-lg font-bold">
              {payingHeadcount > 0
                ? costSplit === 'even'
                  ? `£${Math.round(grandTotal / payingHeadcount).toLocaleString()}`
                  : `~£${Math.round(grandTotal / payingHeadcount).toLocaleString()}`
                : '£0'
              }
            </p>
          </div>
          {coveredCount > 0 && (
            <p className="text-[11px] text-white/50 pt-1">
              {coveredMembers.map((m: any) => m.first_name || m.guest_name || 'A member').join(', ')}'s costs are split across the other {payingHeadcount} members
            </p>
          )}
          {costSplit === 'exact' && (
            <p className="text-[11px] text-white/50 pt-1">
              Each person pays their actual transport cost + £{Math.round((selectedHotelOption?.totalPrice || 0) / payingHeadcount).toLocaleString()} hotel share
            </p>
          )}
          {roomSharing === 'shared' && (
            <p className="text-[11px] text-white/50">
              {roomCount} shared room{roomCount !== 1 ? 's' : ''} for {groupSize} guests
            </p>
          )}
        </div>

        {/* Email confirmation notice */}
        <div className="bg-green-50 border border-green-200 rounded-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">Every group member gets their booking confirmation</p>
              <p className="text-xs text-green-700 leading-relaxed mt-1">
                Once you confirm, each group member will receive their flight confirmation directly to the email address they provided when joining the trip. Everyone gets their own e-ticket — no need to forward anything.
              </p>
              {coveredCount > 0 && (
                <p className="text-xs text-green-700 leading-relaxed mt-1">
                  {coveredMembers.map((m: any) => m.first_name || m.guest_name).join(', ')} will receive their e-ticket but won't get a payment link — their costs are covered by the group.
                </p>
              )}
              {surpriseMembers.length > 0 && (
                <p className="text-xs text-green-700 leading-relaxed mt-1">
                  {surpriseMembers.map((m: any) => m.first_name || m.guest_name).join(', ')} will receive their e-ticket after the trip is booked (surprise reveal).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-bg-soft rounded-card p-5 space-y-4">
          <p className="text-sm font-bold text-primary">How booking works</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium text-primary">Pay for travel</p>
                <p className="text-xs text-text-secondary">Secure payment via Stripe. All {routes.length > 1 ? `${routes.length} routes are` : 'travel is'} confirmed instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="text-sm font-medium text-primary">Everyone gets emailed</p>
                <p className="text-xs text-text-secondary">Each group member receives their flight confirmation and e-ticket via the email they signed up with.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="text-sm font-medium text-primary">Book your hotel on Booking.com</p>
                <p className="text-xs text-text-secondary">We'll redirect you to Booking.com with your dates pre-filled.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important: support routing notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800">After booking, support goes directly to providers</p>
              <p className="text-xs text-blue-700 leading-relaxed mt-1">
                TripAmigos helps your group find and book the perfect trip — but once booked, your flights and hotel are with the providers directly. Here's who to contact:
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 p-2.5 bg-white rounded-input border border-blue-100">
                  <span className="text-base mt-0.5">✈️</span>
                  <div>
                    <p className="text-xs font-semibold text-primary">Flight changes, cancellations, or issues</p>
                    <p className="text-xs text-text-secondary">Contact your airline directly. Your booking reference and airline contact details will be in the confirmation email each member receives.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-white rounded-input border border-blue-100">
                  <span className="text-base mt-0.5">🏨</span>
                  <div>
                    <p className="text-xs font-semibold text-primary">Hotel changes, cancellations, or issues</p>
                    <p className="text-xs text-text-secondary">Contact Booking.com or the hotel directly. Your Booking.com confirmation will include all the details you need.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              setBooking(true)
              try {
                // Build booking data to persist
                const flightBookings = routes
                  .filter(r => r.mode !== 'drive')
                  .map(route => {
                    const opt = route.mode === 'train'
                      ? route.trainOptions.find(o => o.id === route.selectedOptionId)
                      : route.flightOptions.find(o => o.offerId === route.selectedOptionId)
                    return {
                      routeId: route.id,
                      origin: route.origin,
                      destination: destCity,
                      mode: route.mode,
                      airline: route.mode === 'flight'
                        ? (opt as FlightOption)?.airline.name
                        : (opt as TrainOption)?.outbound.operator,
                      bookingReference: '', // populated after real Duffel call
                      passengers: route.members.map(m => m.name),
                      slices: route.mode === 'flight' ? (opt as FlightOption)?.slices : null,
                      outbound: route.mode === 'train' ? (opt as TrainOption)?.outbound : null,
                      returnJourney: route.mode === 'train' ? (opt as TrainOption)?.returnJourney : null,
                      pricingTotal: route.mode === 'train' ? (opt as TrainOption)?.totalPrice : (opt as FlightOption)?.pricing.total,
                      pricingPerPerson: route.mode === 'train' ? (opt as TrainOption)?.pricePerPerson : (opt as FlightOption)?.pricing.perPerson,
                      currency: route.mode === 'train' ? (opt as TrainOption)?.currency : (opt as FlightOption)?.pricing.currency,
                    }
                  })

                const bookingData = {
                  flights: flightBookings,
                  hotel: selectedHotelOption ? {
                    name: selectedHotelOption.name,
                    address: selectedHotelOption.address,
                    city: selectedHotelOption.city,
                    starRating: selectedHotelOption.starRating,
                    bookingReference: '',
                    checkIn: trip.date_from,
                    checkOut: trip.date_to,
                    rooms: selectedHotelOption.rooms,
                    roomType: selectedHotelOption.roomType,
                    totalPrice: selectedHotelOption.totalPrice,
                    nights: selectedHotelOption.nights,
                    currency: selectedHotelOption.currency,
                    bookingUrl: selectedHotelOption.bookingUrl,
                  } : null,
                  destination: destCity,
                  bookedAt: new Date().toISOString(),
                  totalCost: transportTotal + (selectedHotelOption?.totalPrice || 0),
                  perPerson: payingHeadcount > 0 ? Math.round((transportTotal + (selectedHotelOption?.totalPrice || 0)) / payingHeadcount) : 0,
                }

                // Save booking data + update status
                const supabase = (await import('@/lib/supabase/client')).createClient()
                await supabase
                  .from('trips')
                  .update({ status: 'booked', booking_data: bookingData })
                  .eq('id', trip.id)

                await new Promise(r => setTimeout(r, 800))

                if (selectedHotelOption?.bookingUrl) {
                  window.open(selectedHotelOption.bookingUrl, '_blank')
                }
                router.push(`/trips/${trip.id}?booked=true`)
              } catch (err) {
                console.error('Booking save error:', err)
                alert('Something went wrong saving booking data. Please try again.')
              }
              setBooking(false)
            }}
            disabled={booking}
            className="w-full py-4 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-card font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            {booking ? (
              <><Loader size={20} className="animate-spin" /> Processing payment...</>
            ) : (
              <>Pay £{transportTotal.toFixed(2)} for travel <ArrowRight size={20} /></>
            )}
          </button>
          <p className="text-[11px] text-text-muted text-center">
            Secure payment via Stripe · All group members emailed their e-tickets · Then book your hotel on Booking.com
          </p>
        </div>
      </div>
    )
  }

  return null
}

// =====================================================
// STEP INDICATOR
// =====================================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full transition-colors ${
            s < current ? 'bg-green-500' : s === current ? 'bg-accent' : 'bg-border'
          }`} />
          {i < 3 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  )
}

// =====================================================
// TRAIN CARD
// =====================================================

function renderTrainCard(
  option: TrainOption,
  tierConfig: Record<string, { tag: string; tagColor: string }>,
  selectedOption: string | null,
  setSelectedOption: (id: string) => void,
  expandedCard: string | null,
  setExpandedCard: (id: string | null) => void,
  startDate: Date,
  endDate: Date,
  timerExpired: boolean,
) {
  const config = tierConfig[option.tier] || tierConfig['best-value']
  const isSelected = selectedOption === option.id
  const isExpanded = expandedCard === option.id
  const { outbound, returnJourney } = option

  return (
    <div
      key={option.id}
      className={`relative rounded-card border-2 transition-all ${
        isSelected ? 'border-accent bg-white shadow-lg ring-2 ring-accent/20' : 'border-border bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >

      <button type="button" onClick={() => setSelectedOption(option.id)} className="w-full text-left p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${config.tagColor}`}>{config.tag}</span>
              {option.class === 'first' && <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-700">First Class</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center"><Train size={14} className="text-white" /></div>
              <h3 className="text-lg font-bold text-primary">{outbound.operator}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">{option.ticketType}</span>
              <p className="text-xs text-text-secondary">{option.ticketDescription}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">£{option.pricePerPerson}</p>
            <p className="text-xs text-text-secondary">per person</p>
            {option.refundable && <p className="text-[10px] text-green-600 font-medium mt-1">Fully refundable</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-bg-soft rounded-input p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-secondary uppercase">Outbound · {format(startDate, 'EEE d MMM')}</p>
              {outbound.changes === 0
                ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Direct</span>
                : <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">{outbound.changes} change{outbound.changes > 1 ? 's' : ''}</span>
              }
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-primary">{format(new Date(outbound.departureTime), 'HH:mm')}</p>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted px-1">{formatTrainDuration(outbound.durationMinutes)}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-sm font-bold text-primary">{format(new Date(outbound.arrivalTime), 'HH:mm')}</p>
            </div>
            <p className="text-xs text-text-secondary truncate">{outbound.departureStation} → {outbound.arrivalStation}</p>
          </div>
          <div className="bg-bg-soft rounded-input p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-secondary uppercase">Return · {format(endDate, 'EEE d MMM')}</p>
              {returnJourney.changes === 0
                ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Direct</span>
                : <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">{returnJourney.changes} change{returnJourney.changes > 1 ? 's' : ''}</span>
              }
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-primary">{format(new Date(returnJourney.departureTime), 'HH:mm')}</p>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted px-1">{formatTrainDuration(returnJourney.durationMinutes)}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-sm font-bold text-primary">{format(new Date(returnJourney.arrivalTime), 'HH:mm')}</p>
            </div>
            <p className="text-xs text-text-secondary truncate">{returnJourney.departureStation} → {returnJourney.arrivalStation}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {option.isFlexible && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1"><Repeat size={8} /> Flexible</span>}
          {option.class === 'first'
            ? <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">Extra legroom · Power · Wi-Fi</span>
            : <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">Standard · Wi-Fi · Power</span>
          }
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-sm text-text-secondary">Return for {option.passengers} {option.passengers === 1 ? 'person' : 'people'}</p>
          <p className="text-lg font-bold text-primary">£{option.totalPrice.toFixed(2)}</p>
        </div>
      </button>

      <button type="button" onClick={() => setExpandedCard(isExpanded ? null : option.id)} className="w-full px-5 py-2.5 border-t border-border text-xs text-text-secondary hover:text-primary hover:bg-bg-soft transition-colors flex items-center justify-center gap-1.5">
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {isExpanded ? 'Hide details' : 'Show details'}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {[{ label: 'Outbound', journey: outbound, date: startDate }, { label: 'Return', journey: returnJourney, date: endDate }].map(({ label, journey, date }) => (
            <div key={label} className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase">{label} — {format(date, 'EEE d MMM')} — {formatTrainDuration(journey.durationMinutes)}</p>
              {journey.legs.map((leg, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 p-3 bg-bg-soft rounded-input">
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-primary">{format(new Date(leg.departureTime), 'HH:mm')}</p>
                      <p className="text-[10px] text-text-muted">{leg.departureStation.replace(/London /, '')}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] text-text-muted">{formatTrainDuration(leg.durationMinutes)}</p>
                      <div className="w-full h-px bg-border relative my-1"><Train size={10} className="absolute right-0 -top-[5px] text-accent" /></div>
                      <p className="text-[10px] text-text-muted">{leg.trainNumber} · {leg.operator}</p>
                    </div>
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-primary">{format(new Date(leg.arrivalTime), 'HH:mm')}</p>
                      <p className="text-[10px] text-text-muted">{leg.arrivalStation.replace(/London /, '')}</p>
                    </div>
                  </div>
                  {i < journey.legs.length - 1 && (
                    <div className="flex items-center justify-center py-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Repeat size={8} /> Change at {leg.arrivalStation}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {isSelected && (
        <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
    </div>
  )
}

// =====================================================
// FLIGHT CARD
// =====================================================

function renderFlightCard(
  option: FlightOption,
  tierConfig: Record<string, { tag: string; tagColor: string }>,
  selectedOption: string | null,
  setSelectedOption: (id: string) => void,
  expandedCard: string | null,
  setExpandedCard: (id: string | null) => void,
  destCity: string,
  startDate: Date,
  endDate: Date,
  timerExpired: boolean,
) {
  const config = tierConfig[option.tier] || tierConfig['best-value']
  const isSelected = selectedOption === option.offerId
  const isExpanded = expandedCard === option.offerId
  const outbound = option.slices[0]
  const returnFlight = option.slices[1]

  return (
    <div
      key={option.offerId}
      className={`relative rounded-card border-2 transition-all ${
        isSelected ? 'border-accent bg-white shadow-lg ring-2 ring-accent/20'
          : timerExpired ? 'border-border bg-gray-50 opacity-60'
          : 'border-border bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >

      <button type="button" onClick={() => !timerExpired && setSelectedOption(option.offerId)} disabled={timerExpired} className="w-full text-left p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${config.tagColor}`}>{config.tag}</span>
            <div className="flex items-center gap-2">
              {option.airline.logo && <img src={option.airline.logo} alt={option.airline.name} className="w-6 h-6 rounded" />}
              <h3 className="text-lg font-bold text-primary">{option.airline.name}</h3>
            </div>
            <p className="text-xs text-text-secondary">{destCity} · {format(startDate, 'MMM d')} – {format(endDate, 'MMM d')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">£{Math.round(option.pricing.perPerson)}</p>
            <p className="text-xs text-text-secondary">per person</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {outbound && (
            <div className="bg-bg-soft rounded-input p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-text-secondary uppercase">Outbound</p>
                {outbound.isDirect
                  ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Direct</span>
                  : <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">{outbound.stops} stop{outbound.stops > 1 ? 's' : ''}</span>
                }
              </div>
              <p className="text-sm font-semibold text-primary">{outbound.origin.code} → {outbound.destination.code}</p>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Clock size={10} />
                <span>{formatDuration(outbound.duration)}</span>
                <span>·</span>
                <span>{format(new Date(outbound.segments[0].departingAt), 'HH:mm')}</span>
              </div>
            </div>
          )}
          {returnFlight && (
            <div className="bg-bg-soft rounded-input p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-text-secondary uppercase">Return</p>
                {returnFlight.isDirect
                  ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Direct</span>
                  : <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">{returnFlight.stops} stop{returnFlight.stops > 1 ? 's' : ''}</span>
                }
              </div>
              <p className="text-sm font-semibold text-primary">{returnFlight.origin.code} → {returnFlight.destination.code}</p>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Clock size={10} />
                <span>{formatDuration(returnFlight.duration)}</span>
                <span>·</span>
                <span>{format(new Date(returnFlight.segments[0].departingAt), 'HH:mm')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-sm text-text-secondary">Total for {option.passengers} {option.passengers === 1 ? 'person' : 'people'}</p>
          <p className="text-lg font-bold text-primary">£{option.pricing.total.toFixed(2)}</p>
        </div>
      </button>

      <button type="button" onClick={() => setExpandedCard(isExpanded ? null : option.offerId)} className="w-full px-5 py-2.5 border-t border-border text-xs text-text-secondary hover:text-primary hover:bg-bg-soft transition-colors flex items-center justify-center gap-1.5">
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {isExpanded ? 'Hide details' : 'Show details'}
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {option.slices.map((slice, si) => (
            <div key={si} className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase">{si === 0 ? 'Outbound' : 'Return'} — {formatDuration(slice.duration)}</p>
              {slice.segments.map((seg, segi) => (
                <div key={segi} className="flex items-center gap-3 p-3 bg-bg-soft rounded-input">
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-bold text-primary">{format(new Date(seg.departingAt), 'HH:mm')}</p>
                    <p className="text-[10px] text-text-muted">{seg.origin}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <p className="text-[10px] text-text-muted">{formatDuration(seg.duration)}</p>
                    <div className="w-full h-px bg-border relative my-1"><Plane size={10} className="absolute right-0 -top-[5px] text-accent" /></div>
                    <p className="text-[10px] text-text-muted">{seg.flightNumber} · {seg.carrier}</p>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-bold text-primary">{format(new Date(seg.arrivingAt), 'HH:mm')}</p>
                    <p className="text-[10px] text-text-muted">{seg.destination}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {isSelected && (
        <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
    </div>
  )
}

// =====================================================
// HOTEL CARD
// =====================================================

function renderHotelCard(
  hotel: HotelOption,
  selectedHotel: string | null,
  setSelectedHotel: (id: string | null) => void,
) {
  const hotelTierConfig: Record<string, { tagColor: string }> = {
    'budget': { tagColor: 'bg-green-100 text-green-700' },
    'mid-range': { tagColor: 'bg-accent-light text-accent' },
    'premium': { tagColor: 'bg-purple-100 text-purple-700' },
  }
  const config = hotelTierConfig[hotel.tier] || hotelTierConfig['mid-range']
  const isSelected = selectedHotel === hotel.id

  return (
    <div
      key={hotel.id}
      className={`relative rounded-card border-2 transition-all overflow-hidden ${
        isSelected ? 'border-accent bg-white shadow-lg ring-2 ring-accent/20' : 'border-border bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >

      <button type="button" onClick={() => setSelectedHotel(isSelected ? null : hotel.id)} className="w-full text-left">
        <div className="w-full h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
          <Building2 size={28} className="text-gray-400" />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            {hotel.freeCancellation && <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full">Free cancellation</span>}
            {hotel.breakfastIncluded && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5"><Coffee size={8} /> Breakfast</span>}
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${config.tagColor}`}>{hotel.tierLabel}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating }).map((_, i) => <Star key={i} size={9} className="fill-amber-400 text-amber-400" />)}
            </div>
          </div>
          <h3 className="text-base font-bold text-primary leading-tight">{hotel.name}</h3>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded">{hotel.reviewScore}</span>
            <span className="text-xs font-medium text-primary">{hotel.reviewWord}</span>
            <span className="text-[10px] text-text-muted">({hotel.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin size={11} /><span>{hotel.distanceFromCentre}</span>
          </div>
          <p className="text-xs text-text-secondary">{hotel.roomType} · {hotel.rooms} room{hotel.rooms !== 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 4).map(a => <span key={a} className="text-[9px] px-1.5 py-0.5 bg-bg-soft text-text-secondary rounded-full">{a}</span>)}
            {hotel.amenities.length > 4 && <span className="text-[9px] px-1.5 py-0.5 bg-bg-soft text-text-muted rounded-full">+{hotel.amenities.length - 4}</span>}
          </div>
          <div className="pt-2.5 border-t border-border flex items-end justify-between">
            <p className="text-[10px] text-text-muted">{hotel.nights} nights · {hotel.rooms} room{hotel.rooms !== 1 ? 's' : ''}</p>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">£{hotel.totalPrice.toLocaleString()}</p>
              <p className="text-[10px] text-text-muted">£{hotel.pricePerNight}/night</p>
            </div>
          </div>
        </div>
      </button>

      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center z-10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
    </div>
  )
}

// =====================================================
// HELPERS
// =====================================================

function formatTrainDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
