'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Loader, X, Plus, MapPin, AlertCircle, Clock, Search, ChevronDown } from 'lucide-react'
import { allAirports } from '@/lib/airports'

interface InviteLandingProps {
  invite: any
  trip: any
  token: string
  currentUser: any
}

// Common nationalities for dropdown
const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan', 'Argentine',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi',
  'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian',
  'Bosnian', 'Brazilian', 'British', 'Bruneian', 'Bulgarian', 'Burkinabe', 'Burmese',
  'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African',
  'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese', 'Costa Rican',
  'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch',
  'East Timorese', 'Ecuadorean', 'Egyptian', 'Emirati', 'English', 'Equatorial Guinean',
  'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Filipino', 'Finnish', 'French',
  'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Grenadian',
  'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian', 'Icelandic',
  'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian',
  'Jamaican', 'Japanese', 'Jordanian', 'Kazakh', 'Kenyan', 'Kuwaiti', 'Kyrgyz', 'Laotian',
  'Latvian', 'Lebanese', 'Liberian', 'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian',
  'Malagasy', 'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Mauritanian',
  'Mauritian', 'Mexican', 'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin', 'Moroccan',
  'Mozambican', 'Namibian', 'Nepalese', 'New Zealand', 'Nicaraguan', 'Nigerian', 'North Korean',
  'Northern Irish', 'Norwegian', 'Omani', 'Pakistani', 'Panamanian', 'Papua New Guinean',
  'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian',
  'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan', 'Saudi', 'Scottish', 'Senegalese',
  'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian',
  'Solomon Islander', 'Somali', 'South African', 'South Korean', 'Spanish', 'Sri Lankan',
  'Sudanese', 'Surinamese', 'Swazi', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik',
  'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian', 'Tunisian', 'Turkish',
  'Turkmen', 'Tuvaluan', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbek', 'Venezuelan',
  'Vietnamese', 'Welsh', 'Yemeni', 'Zambian', 'Zimbabwean',
]

// Common must-haves and dealbreakers for quick selection
const COMMON_MUST_HAVES = ['Pool', 'Wi-Fi', 'Near the beach', 'Air conditioning', 'Balcony', 'Kitchen', 'Gym', 'Parking', 'City centre', 'Sea view', 'Breakfast included', 'Pet friendly']

// Searchable dropdown component
function SearchableDropdown({ value, onChange, options, placeholder, label }: {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string; sublabel?: string }[]
  placeholder: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return options.slice(0, 50)
    const s = search.toLowerCase()
    return options.filter(o =>
      o.label.toLowerCase().includes(s) ||
      o.value.toLowerCase().includes(s) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(s))
    ).slice(0, 50)
  }, [search, options])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 border border-border rounded-input bg-white text-left flex items-center justify-between gap-2"
      >
        <span className={selectedOption ? 'text-primary' : 'text-text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-card shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1 bg-bg-soft rounded-input">
              <Search size={14} className="text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-primary placeholder-text-muted outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-text-muted text-center">No results</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setOpen(false); setSearch('') }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-bg-soft transition-colors flex items-center justify-between ${
                    value === option.value ? 'bg-accent-light text-accent font-medium' : 'text-primary'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.sublabel && <span className="text-xs text-text-secondary">{option.sublabel}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Detect currency symbol from browser locale
function getCurrencySymbol(): string {
  try {
    const locale = navigator.language || 'en-GB'
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''

    // US/Canada
    if (locale.startsWith('en-US') || locale.startsWith('en-CA') || tz.startsWith('America/')) return '$'
    // Europe (non-UK)
    if (['de', 'fr', 'es', 'it', 'nl', 'pt', 'fi', 'el', 'ie', 'at', 'be', 'sk', 'si', 'ee', 'lv', 'lt', 'mt', 'cy', 'lu'].some(l => locale.startsWith(l)) ||
        tz.startsWith('Europe/') && !tz.includes('London')) return '€'
    // UK / fallback
    return '£'
  } catch {
    return '£'
  }
}

export default function InviteLanding({ invite, trip, token, currentUser }: InviteLandingProps) {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'landing' | 'signup' | 'login' | 'guest' | 'preferences' | 'submitted'>('landing')
  const [email, setEmail] = useState(invite.invite_email || '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [guestFirstName, setGuestFirstName] = useState('')
  const [guestLastName, setGuestLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)

  // Preference state
  const [nationality, setNationality] = useState('')
  const [preferredAirport, setPreferredAirport] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [destinationVotes, setDestinationVotes] = useState<string[]>([])
  const [accommodationType, setAccommodationType] = useState('')
  const [accommodationRating, setAccommodationRating] = useState('')
  const [transportPreference, setTransportPreference] = useState('')
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false)
  const [flightTimePreferences, setFlightTimePreferences] = useState<string[]>([])
  const toggleFlightTime = (value: string) => {
    setFlightTimePreferences(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value)
      if (prev.length >= 2) return [prev[1], value]
      return [...prev, value]
    })
  }
  const [mustHaves, setMustHaves] = useState<string[]>([])

  // Opt-out: attendee can skip flights or hotel
  const [needsFlights, setNeedsFlights] = useState(true)
  const [needsHotel, setNeedsHotel] = useState(true)

  // Passport name confirmation
  const [passportConfirmed, setPassportConfirmed] = useState(false)

  const currencySymbol = useMemo(() => getCurrencySymbol(), [])

  const startDate = new Date(trip.date_from)
  const endDate = new Date(trip.date_to)
  const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const organiserName = trip.profiles?.full_name || 'Someone'
  const firstName = invite.invite_email?.split('@')[0] || 'there'

  const alreadyAccepted = invite.invite_status === 'accepted'

  // Scroll to top when mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [mode])

  // Airport dropdown options
  const airportOptions = useMemo(() =>
    allAirports.map(a => ({
      value: `${a.city} (${a.iata})`,
      label: `${a.city} — ${a.name}`,
      sublabel: `${a.country} · ${a.iata}`,
    }))
  , [])

  // Nationality dropdown options
  const nationalityOptions = useMemo(() =>
    NATIONALITIES.map(n => ({ value: n, label: n }))
  , [])

  const handleToggleDestinationVote = (city: string) => {
    if (destinationVotes.includes(city)) {
      setDestinationVotes(destinationVotes.filter(d => d !== city))
    } else if (destinationVotes.length < 3) {
      setDestinationVotes([...destinationVotes, city])
    }
  }

  // Accept invite for a logged-in user
  const handleAcceptInvite = async (userId: string) => {
    setAccepting(true)
    const { error: updateError } = await supabase
      .from('trip_members')
      .update({
        member_id: userId,
        invite_status: 'accepted',
      })
      .eq('invite_token', token)

    if (updateError) {
      setError(updateError.message)
      setAccepting(false)
      return
    }

    router.push(`/trips/${trip.id}/submit`)
    router.refresh()
  }

  const handleLoggedInAccept = async () => {
    if (!currentUser) return
    await handleAcceptInvite(currentUser.id)
  }

  // Sign up then accept
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
      })
      await handleAcceptInvite(data.user.id)
    }
    setLoading(false)
  }

  // Login then accept
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await handleAcceptInvite(data.user.id)
    }
    setLoading(false)
  }

  const guestFullName = `${guestFirstName.trim()} ${guestLastName.trim()}`.trim()

  // Guest continues — just sets name and shows preferences
  const handleGuestContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      setError('Please enter your first and last name')
      return
    }
    setError('')
    setMode('preferences')
  }

  // Submit guest preferences via RPC (no auth required)
  const handleGuestSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const { error: rpcError } = await supabase.rpc('submit_guest_preferences', {
        p_token: token,
        p_guest_name: guestFullName,
        p_first_name: guestFirstName.trim(),
        p_last_name: guestLastName.trim(),
        p_nationality: nationality || null,
        p_preferred_airport: preferredAirport || null,
        p_budget_min: budgetMin ? parseInt(budgetMin) : null,
        p_budget_max: budgetMax ? parseInt(budgetMax) : null,
        p_preferred_destinations: destinationVotes.length > 0 ? destinationVotes : null,
        p_accommodation_type: accommodationType || null,
        p_accommodation_rating_min: accommodationRating ? parseInt(accommodationRating) : null,
        p_transport_preference: transportPreference || null,
        p_direct_flights_only: directFlightsOnly,
        p_flight_time_preference: flightTimePreferences.length > 0 ? JSON.stringify(flightTimePreferences) : null,
        p_dealbreakers: null,
        p_must_haves: mustHaves.length > 0 ? mustHaves : null,
      })

      if (rpcError) {
        setError(rpcError.message)
        setLoading(false)
        return
      }

      // Fire-and-forget: notify organiser if all preferences are now in
      fetch('/api/notify-organiser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id }),
      }).catch(() => {})

      setMode('submitted')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  // Already accepted — redirect options
  if (alreadyAccepted && currentUser) {
    return (
      <div className="min-h-screen bg-bg-soft flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-card p-8 text-center space-y-4 shadow-sm border border-border">
          <p className="text-3xl font-bold text-green-600">✓</p>
          <h1 className="text-xl font-bold text-primary">You've already accepted this invite</h1>
          <p className="text-sm text-text-secondary">Head to your dashboard to submit your preferences or check the trip status.</p>
          <button
            onClick={() => router.push(`/trips/${trip.id}/submit`)}
            className="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-input font-semibold transition-colors"
          >
            Submit my preferences
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  // Submitted view — nudge to create account
  if (mode === 'submitted') {
    return (
      <div className="min-h-screen bg-bg-soft flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-white rounded-card p-8 text-center space-y-5 shadow-sm border border-border">
            <div className="space-y-2">
              <p className="text-5xl font-bold text-green-600">✓</p>
              <h1 className="text-2xl font-bold text-primary">Nice one, {guestFirstName}!</h1>
              <p className="text-text-secondary">
                Your preferences for <strong className="text-primary">{trip.name}</strong> have been submitted.
              </p>
            </div>

            {/* Account creation — strong nudge */}
            <div className="bg-accent-light border border-accent/20 rounded-card p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-base font-bold text-primary">Don't miss out on the planning</p>
                <p className="text-sm text-text-secondary">Create an account in under 30 seconds to keep an eye on how the trip planning is progressing.</p>
              </div>
              <div className="space-y-2.5 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm text-primary">See live charts on how the group is voting</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm text-primary">Get notified the moment the trip is booked</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm text-primary">View your flight details, hotel and booking refs</p>
                </div>
              </div>
              <button
                onClick={() => setMode('signup')}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-input font-bold text-base transition-colors"
              >
                Create my free account →
              </button>
              <p className="text-xs text-text-muted text-center">Takes less than 30 seconds. No card needed.</p>
            </div>
          </div>
          <p className="text-xs text-text-muted text-center">TripAmigos · Group trips, sorted</p>
        </div>
      </div>
    )
  }

  // Guest preference form (inline on the invite page)
  if (mode === 'preferences') {
    return (
      <div className="min-h-screen bg-bg-soft p-4">
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          {/* Header — punchy and personal */}
          <div className="bg-white border border-border rounded-card p-6 space-y-3">
            <h1 className="text-2xl font-bold text-primary">
              Hey {guestFirstName}! Help shape this trip.
            </h1>
            <p className="text-text-secondary text-sm">
              Choose your preferences below and hit submit — {organiserName} will use everyone's answers to find the best flights and hotels.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-input">
              <Clock size={14} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 font-medium">
                Try to submit within 24 hours — don't be the one holding up the group!
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-6">
            {/* Nationality */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">Nationality</label>
              <SearchableDropdown
                value={nationality}
                onChange={setNationality}
                options={nationalityOptions}
                placeholder="Select your nationality"
              />
              <p className="text-xs text-text-muted">Helps check visa requirements for the group</p>
            </div>

            {/* What do you need booked? */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">What do you need us to book for you?</label>
              <p className="text-xs text-text-secondary">Untick anything you'll sort out yourself</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-input border transition-all hover:bg-bg-soft"
                  style={{ borderColor: needsFlights ? '#2563eb' : undefined, backgroundColor: needsFlights ? '#eff6ff' : undefined }}>
                  <input type="checkbox" checked={needsFlights} onChange={(e) => setNeedsFlights(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent" />
                  <div>
                    <p className="text-sm font-medium text-primary">Book my flights</p>
                    <p className="text-xs text-text-secondary">Include me in the group flight booking</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-input border transition-all hover:bg-bg-soft"
                  style={{ borderColor: needsHotel ? '#2563eb' : undefined, backgroundColor: needsHotel ? '#eff6ff' : undefined }}>
                  <input type="checkbox" checked={needsHotel} onChange={(e) => setNeedsHotel(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent" />
                  <div>
                    <p className="text-sm font-medium text-primary">Book my hotel</p>
                    <p className="text-xs text-text-secondary">Include me in the group accommodation</p>
                  </div>
                </label>
              </div>
              {(!needsFlights || !needsHotel) && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-input">
                  <p className="text-xs text-amber-800">
                    {!needsFlights && !needsHotel
                      ? "You've opted out of both — you'll just need to get yourself there and find your own stay."
                      : !needsFlights
                        ? "You'll need to arrange your own travel. We'll still book your hotel with the group."
                        : "You'll need to find your own accommodation. We'll still book your flights with the group."
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Passport name confirmation */}
            <div className="bg-white border border-border rounded-card p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={passportConfirmed} onChange={(e) => setPassportConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent" />
                <span className="text-xs text-text-secondary font-medium leading-relaxed">
                  I confirm that the name I've given matches my passport exactly
                </span>
              </label>
            </div>

            {/* Vote on destinations */}
            {trip.shortlisted_cities && trip.shortlisted_cities.length > 0 && (
              <div className="bg-white border border-border rounded-card p-5 space-y-3">
                <label className="block text-sm font-medium text-primary">Vote for your top destinations</label>
                <p className="text-xs text-text-secondary">Pick up to 3 favourites — tap to select</p>
                <div className="grid grid-cols-1 gap-2">
                  {trip.shortlisted_cities.map((city: string, i: number) => {
                    const isVoted = destinationVotes.includes(city)
                    const voteRank = destinationVotes.indexOf(city) + 1
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleToggleDestinationVote(city)}
                        className={`relative flex items-center gap-3 p-4 rounded-card border-2 text-left transition-all ${
                          isVoted ? 'border-accent bg-accent-light' : destinationVotes.length >= 3 ? 'border-border bg-gray-50 opacity-50 cursor-not-allowed' : 'border-border hover:border-gray-300 bg-white'
                        }`}
                        disabled={!isVoted && destinationVotes.length >= 3}
                      >
                        {isVoted ? (
                          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">#{voteRank}</div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-border bg-white flex items-center justify-center shrink-0"><span className="text-xs text-text-muted">{i + 1}</span></div>
                        )}
                        <div>
                          <p className={`text-sm font-semibold ${isVoted ? 'text-accent' : 'text-primary'}`}>{city.split(', ')[0]}</p>
                          <p className="text-xs text-text-secondary">{city.split(', ')[1]}</p>
                        </div>
                        {isVoted && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-text-muted">{destinationVotes.length}/3 selected</p>
              </div>
            )}

            {/* Airport — searchable dropdown */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">Your nearest airport</label>
              <SearchableDropdown
                value={preferredAirport}
                onChange={setPreferredAirport}
                options={airportOptions}
                placeholder="Search for your airport"
              />
            </div>

            {/* Accommodation */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">What type of accommodation do you prefer?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { value: 'hotel', label: 'Hotel' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'villa', label: 'Villa' },
                  { value: 'hostel', label: 'Hostel' },
                  { value: 'resort', label: 'Resort' },
                  { value: 'no_preference', label: 'No preference' },
                ].map((option) => (
                  <button key={option.value} type="button" onClick={() => setAccommodationType(option.value)}
                    className={`relative p-3 rounded-card border-2 text-center transition-all ${accommodationType === option.value ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'}`}>
                    <p className="text-sm font-medium text-primary">{option.label}</p>
                    {accommodationType === option.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Star rating */}
            {accommodationType && accommodationType !== 'hostel' && accommodationType !== 'no_preference' && (
              <div className="bg-white border border-border rounded-card p-5 space-y-3">
                <label className="block text-sm font-medium text-primary">Minimum star rating</label>
                <div className="flex gap-2">
                  {['3', '4', '5'].map((stars) => (
                    <button key={stars} type="button" onClick={() => setAccommodationRating(stars)}
                      className={`flex-1 py-2 rounded-input border-2 text-sm font-medium transition-all ${accommodationRating === stars ? 'border-accent bg-accent-light text-accent' : 'border-border hover:border-gray-300 text-primary'}`}>
                      {stars}+ stars
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Transport */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">How do you want to get there?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'flight', label: 'Fly' },
                  { value: 'train', label: 'Train' },
                  { value: 'drive', label: 'Drive' },
                  { value: 'no_preference', label: 'Any' },
                ].map((option) => (
                  <button key={option.value} type="button" onClick={() => setTransportPreference(option.value)}
                    className={`p-3 rounded-card border-2 text-center transition-all ${transportPreference === option.value ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'}`}>
                    <p className="text-sm font-medium text-primary">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Flight prefs */}
            {(transportPreference === 'flight' || transportPreference === 'no_preference') && (
              <div className="bg-white border border-border rounded-card p-5 space-y-4">
                <p className="text-sm font-medium text-primary">Flight preferences</p>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Preferred flight times <span className="text-text-muted font-normal">(pick up to 2)</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'early_morning', label: 'Early morning', sub: 'Before 8am' },
                      { value: 'morning', label: 'Morning', sub: '8am – 12pm' },
                      { value: 'afternoon', label: 'Afternoon', sub: '12pm – 6pm' },
                      { value: 'evening', label: 'Evening', sub: 'After 6pm' },
                    ].map((option) => (
                      <button key={option.value} type="button" onClick={() => toggleFlightTime(option.value)}
                        className={`p-2 rounded-input border-2 text-center transition-all ${flightTimePreferences.includes(option.value) ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'}`}>
                        <p className="text-xs font-medium text-primary">{option.label}</p>
                        <p className="text-[10px] text-text-secondary">{option.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setDirectFlightsOnly(!directFlightsOnly)}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center ${directFlightsOnly ? 'bg-accent justify-end' : 'bg-border justify-start'}`}>
                    <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">Direct flights only</p>
                    <p className="text-xs text-text-secondary">Skip options with layovers</p>
                  </div>
                </label>
              </div>
            )}

            {/* Budget — with currency symbol */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">Your budget per person</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">{currencySymbol}</span>
                  <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="Min"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">{currencySymbol}</span>
                  <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Max"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
                </div>
              </div>
              <p className="text-xs text-text-muted">Total per person including flights and accommodation</p>
            </div>

            {/* Must-haves — selectable chips */}
            <div className="bg-white border border-border rounded-card p-5 space-y-3">
              <label className="block text-sm font-medium text-primary">Must-haves</label>
              <p className="text-xs text-text-secondary">Tap to select — pick as many as you like</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_MUST_HAVES.map((item) => {
                  const selected = mustHaves.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selected ? setMustHaves(mustHaves.filter(m => m !== item)) : setMustHaves([...mustHaves, item])}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        selected
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-white border-border text-text-secondary hover:border-green-300'
                      }`}
                    >
                      {selected && '✓ '}{item}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleGuestSubmit}
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-card font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              {loading ? <><Loader size={20} className="animate-spin" /> Submitting...</> : 'Submit my preferences →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-soft flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Invite card */}
        <div className="bg-white rounded-card p-8 text-center space-y-5 shadow-sm border border-border">
          <div className="space-y-2">
            <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mx-auto"><MapPin size={24} className="text-accent" /></div>
            <h1 className="text-2xl font-bold text-primary">You're invited!</h1>
            <p className="text-text-secondary">
              <strong className="text-primary">{organiserName}</strong> has invited you on a trip
            </p>
          </div>

          {/* Trip info card */}
          <div className="bg-bg-soft rounded-card p-4 text-left space-y-3">
            <h2 className="text-lg font-bold text-primary">{trip.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase">When</p>
                <p className="text-sm font-medium text-primary">
                  {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-text-secondary">{daysCount} days</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase">Group size</p>
                <p className="text-sm font-medium text-primary">{trip.group_size} people</p>
              </div>
            </div>
            {trip.shortlisted_cities && trip.shortlisted_cities.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase mb-1">Possible destinations</p>
                <div className="flex flex-wrap gap-1.5">
                  {trip.shortlisted_cities.map((city: string) => (
                    <span key={city} className="px-2 py-0.5 bg-accent-light text-accent rounded-full text-xs font-medium">
                      {city.split(',')[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-input px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Landing mode — choose action */}
          {mode === 'landing' && (
            <div className="space-y-3">
              {currentUser ? (
                <>
                  <p className="text-sm text-text-secondary">
                    You're signed in as <strong className="text-primary">{currentUser.email}</strong>
                  </p>
                  <button
                    onClick={handleLoggedInAccept}
                    disabled={accepting}
                    className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-input font-bold text-base flex items-center justify-center gap-2 transition-colors"
                  >
                    {accepting ? (
                      <><Loader size={18} className="animate-spin" /> Accepting...</>
                    ) : (
                      'Accept invite & choose my preferences'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-secondary">Join the trip and tell everyone what you're after</p>
                  <button
                    onClick={() => setMode('guest')}
                    className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-input font-bold transition-colors"
                  >
                    Continue as guest
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-text-muted">or</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMode('signup')}
                    className="w-full py-2 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors text-sm"
                  >
                    Create an account
                  </button>
                  <button
                    onClick={() => setMode('login')}
                    className="w-full text-xs text-text-secondary hover:text-primary transition-colors"
                  >
                    I already have an account
                  </button>
                </>
              )}
            </div>
          )}

          {/* Guest name form */}
          {mode === 'guest' && (
            <form onSubmit={handleGuestContinue} className="space-y-3 text-left">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">First name</label>
                <input
                  type="text"
                  value={guestFirstName}
                  onChange={(e) => setGuestFirstName(e.target.value)}
                  placeholder="e.g. John"
                  required
                  autoFocus
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Last name</label>
                <input
                  type="text"
                  value={guestLastName}
                  onChange={(e) => setGuestLastName(e.target.value)}
                  placeholder="e.g. Smith"
                  required
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-input">
                <AlertCircle size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">Enter your name as it appears on your passport — this is the name that will go on your flight booking.</p>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-input font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Let's go →
              </button>
              <button type="button" onClick={() => setMode('landing')} className="w-full text-sm text-text-secondary hover:text-primary transition-colors">
                ← Back
              </button>
            </form>
          )}

          {/* Signup form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3 text-left">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Full name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Smith" required className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-input font-bold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader size={18} className="animate-spin" /> Creating account...</> : 'Create account & join trip'}
              </button>
              <button type="button" onClick={() => setMode('landing')} className="w-full text-sm text-text-secondary hover:text-primary transition-colors">
                ← Back
              </button>
            </form>
          )}

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-input font-bold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader size={18} className="animate-spin" /> Signing in...</> : 'Sign in & join trip'}
              </button>
              <button type="button" onClick={() => setMode('landing')} className="w-full text-sm text-text-secondary hover:text-primary transition-colors">
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-text-muted text-center">
          TripAmigos · Group trips, sorted
        </p>
      </div>
    </div>
  )
}
