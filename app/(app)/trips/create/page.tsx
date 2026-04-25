'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader, X, Plus, Search, Gift, EyeOff, ChevronDown } from 'lucide-react'
import { Region, regionLabels, regionIcons, searchDestinations } from '@/lib/destinations'
import { searchTravelHubs, getHubLabel, TravelHub } from '@/lib/travel-hubs'

type Step = 'basics' | 'attendees_preferences'
type TripMode = 'collaborative' | 'organiser_decides'

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

const TRIP_TYPE_OPTIONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'weekend', label: 'Weekend getaway' },
  { value: 'stag', label: 'Stag do' },
  { value: 'hen', label: 'Hen do' },
  { value: 'golf', label: 'Golf trip' },
  { value: 'birthday', label: 'Birthday trip' },
  { value: 'work', label: 'Work trip' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'other', label: 'Other' },
]

const TRIP_TYPE_PRESETS: Record<string, string[]> = {
  stag: ['Prague, Czech Republic', 'Budapest, Hungary', 'Amsterdam, Netherlands', 'Benidorm, Spain', 'Dublin, Ireland'],
  hen: ['Marbella, Spain', 'Lisbon, Portugal', 'Barcelona, Spain', 'Mykonos, Greece', 'Dublin, Ireland'],
  golf: ['Algarve, Portugal', 'Marbella, Spain', 'Antalya, Turkey', 'Edinburgh, Scotland', 'Vilamoura, Portugal'],
  birthday: ['Barcelona, Spain', 'Amsterdam, Netherlands', 'Paris, France', 'Lisbon, Portugal', 'Rome, Italy'],
  adventure: ['Reykjavik, Iceland', 'Marrakech, Morocco', 'Dubrovnik, Croatia', 'Lisbon, Portugal', 'Split, Croatia'],
  weekend: ['Amsterdam, Netherlands', 'Paris, France', 'Brussels, Belgium', 'Dublin, Ireland', 'Barcelona, Spain'],
}

const TRIP_TYPE_EMOJIS: Record<string, string> = {
  stag: '🎉',
  hen: '👑',
  golf: '⛳',
  birthday: '🎂',
  adventure: '🧗',
  weekend: '✈️',
}

const MUST_HAVE_OPTIONS = [
  'Swimming pool', 'Wi-Fi', 'Near the beach', 'Air conditioning', 'Gym / fitness',
  'Kitchen / self-catering', 'Parking', 'Pet-friendly', 'Wheelchair accessible',
  'Balcony / terrace', 'City centre location', 'Nightlife nearby', 'Family-friendly',
  'Spa / wellness', 'All-inclusive', 'Late checkout', 'Airport transfer',
  'Breakfast included', 'Sea view', 'Private bathroom',
]

const DEALBREAKER_OPTIONS = [
  'No hostels', 'No red-eye flights', 'No long layovers',
  'No budget airlines', 'No overnight travel', 'No early morning departures',
  'No more than 1 stop', 'No smoking accommodation', 'No party hostels',
  'Not too remote', 'No self-catering only', 'No ground floor rooms',
  'No shared bathrooms', 'No accommodation without reviews', 'No buses',
]

interface Attendee {
  id: string
  firstName: string
  lastName: string
  email: string
  costsCovered: boolean
  role: 'attendee' | 'surprise'
  preferredAirport?: string
}

export default function CreateTripPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('basics')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1: Trip Basics
  const [tripName, setTripName] = useState('')
  const [groupSize, setGroupSize] = useState('4')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tripType, setTripType] = useState('vacation')
  const [paymentMethod, setPaymentMethod] = useState<'organiser_pays' | 'individual_pays' | ''>('')
  const [roomSharing, setRoomSharing] = useState<'shared' | 'individual' | ''>('')
  const [costSplit, setCostSplit] = useState<'even' | 'exact' | ''>('')
  const [tripMode, setTripMode] = useState<TripMode>('collaborative')
  const [destinationScope, setDestinationScope] = useState<Region>('anywhere')
  const [shortlistInput, setShortlistInput] = useState('')
  const [shortlistedCities, setShortlistedCities] = useState<string[]>([])
  const [showShortlistDropdown, setShowShortlistDropdown] = useState(false)
  const [destinationsSkipped, setDestinationsSkipped] = useState(false)

  // Step 2: Attendees & Preferences
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('')
  const [newAttendeeFirstName, setNewAttendeeFirstName] = useState('')
  const [newAttendeeLastName, setNewAttendeeLastName] = useState('')
  const [passportConfirmed, setPassportConfirmed] = useState(false)

  // Preferences
  const [nationality, setNationality] = useState('')
  const [nationalitySearch, setNationalitySearch] = useState('')
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false)
  const [destinationVotes, setDestinationVotes] = useState<string[]>([])
  const [transportPreference, setTransportPreference] = useState('')
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false)
  const [flightTimePreference, setFlightTimePreference] = useState('')
  const [preferredAirport, setPreferredAirport] = useState('')
  const [hubSearchInput, setHubSearchInput] = useState('')
  const [showHubDropdown, setShowHubDropdown] = useState(false)
  const [accommodationType, setAccommodationType] = useState('')
  const [accommodationRating, setAccommodationRating] = useState('')
  const [budgetTier, setBudgetTier] = useState<'budget' | 'mid' | 'bougie' | 'blowout' | ''>('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [showCustomBudget, setShowCustomBudget] = useState(false)
  const [mustHaves, setMustHaves] = useState<string[]>([])
  const [dealbreakers, setDealbreakers] = useState<string[]>([])
  const [showMustHaveDropdown, setShowMustHaveDropdown] = useState(false)
  const [showDealbreakerDropdown, setShowDealbreakerDropdown] = useState(false)

  const filteredNationalities = useMemo(() => {
    if (!nationalitySearch) return NATIONALITIES.slice(0, 30)
    const q = nationalitySearch.toLowerCase()
    return NATIONALITIES.filter(n => n.toLowerCase().includes(q)).slice(0, 30)
  }, [nationalitySearch])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const handleToggleDestinationVote = (city: string) => {
    if (destinationVotes.includes(city)) {
      setDestinationVotes(destinationVotes.filter(d => d !== city))
    } else if (destinationVotes.length < 3) {
      setDestinationVotes([...destinationVotes, city])
    }
  }

  const handleAddAttendee = () => {
    setError('')
    if (!newAttendeeEmail || !newAttendeeFirstName || !newAttendeeLastName) {
      setError('Please enter first name, last name, and email')
      return
    }
    if (attendees.find((a) => a.email === newAttendeeEmail)) {
      setError('This email is already added')
      return
    }

    const attendee: Attendee = {
      id: Date.now().toString(),
      email: newAttendeeEmail,
      firstName: newAttendeeFirstName,
      lastName: newAttendeeLastName,
      costsCovered: false,
      role: 'attendee',
    }

    setAttendees([...attendees, attendee])
    setNewAttendeeEmail('')
    setNewAttendeeFirstName('')
    setNewAttendeeLastName('')
  }

  const handleRemoveAttendee = (id: string) => {
    setAttendees(attendees.filter((a) => a.id !== id))
  }

  const handleApplyPreset = () => {
    const preset = TRIP_TYPE_PRESETS[tripType]
    if (preset) {
      setShortlistedCities(preset)
      setShortlistInput('')
      setShowShortlistDropdown(false)
    }
  }

  const handleBudgetTierChange = (tier: 'budget' | 'mid' | 'bougie' | 'blowout') => {
    setBudgetTier(tier)
    setShowCustomBudget(false)

    const tierRanges = {
      budget: { min: '0', max: '500' },
      mid: { min: '500', max: '1000' },
      bougie: { min: '1000', max: '2000' },
      blowout: { min: '2000', max: '' },
    }

    const range = tierRanges[tier]
    setBudgetMin(range.min)
    setBudgetMax(range.max)
  }

  const handleNextStep = () => {
    setError('')

    if (step === 'basics') {
      if (!tripName || !startDate || !endDate) {
        setError('Please fill in all required fields')
        return
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (new Date(startDate) < today) {
        setError('Start date can\'t be in the past')
        return
      }
      if (new Date(endDate) < today) {
        setError('End date can\'t be in the past')
        return
      }
      if (new Date(startDate) >= new Date(endDate)) {
        setError('End date must be after start date')
        return
      }
      if (!paymentMethod) {
        setError('Please choose a payment method')
        return
      }
      if (tripMode === 'collaborative' && !destinationsSkipped && shortlistedCities.length < 3) {
        setError('Please shortlist at least 3 destinations or choose "Let attendees decide"')
        return
      }
      setStep('attendees_preferences')
    }
  }

  const handleBackStep = () => {
    setError('')
    if (step === 'attendees_preferences') {
      setStep('basics')
    }
  }

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      // Create trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: tripName,
          organiser_id: user.id,
          group_size: parseInt(groupSize),
          date_from: startDate,
          date_to: endDate,
          trip_types: tripType ? [tripType] : [],
          payment_method: paymentMethod,
          room_sharing: roomSharing || 'individual',
          cost_split: costSplit || 'even',
          destination_scope: destinationScope,
          shortlisted_cities: destinationsSkipped ? [] : shortlistedCities,
          trip_mode: tripMode,
          status: tripMode === 'organiser_decides' ? 'organiser_planning' : 'collecting',
        })
        .select()
        .single()

      if (tripError) {
        setError(tripError.message)
        setLoading(false)
        return
      }

      // Add organiser as trip member
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        member_id: user.id,
        role: 'organiser',
        invite_status: 'accepted',
      })

      // Add attendees
      const attendeeInserts = attendees.map((attendee) => ({
        trip_id: trip.id,
        invite_email: attendee.email,
        first_name: attendee.firstName,
        last_name: attendee.lastName,
        role: attendee.role as string,
        invite_status: attendee.role === 'surprise' ? 'accepted' as const : 'pending' as const,
        costs_covered: attendee.costsCovered,
        preferred_airport: attendee.preferredAirport || null,
      }))

      if (attendeeInserts.length > 0) {
        await supabase.from('trip_members').insert(attendeeInserts)
      }

      // Save organiser's preferences
      const { data: tripMember } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', trip.id)
        .eq('member_id', user.id)
        .single()

      if (tripMember) {
        await supabase.from('member_preferences').insert({
          trip_id: trip.id,
          member_id: user.id,
          trip_member_id: tripMember.id,
          nationality: nationality || null,
          preferred_airport: preferredAirport || null,
          budget_min: budgetMin ? parseInt(budgetMin) : null,
          budget_max: budgetMax ? parseInt(budgetMax) : null,
          preferred_destinations: destinationVotes.length > 0 ? destinationVotes : null,
          accommodation_type: accommodationType || null,
          accommodation_rating_min: accommodationRating ? parseInt(accommodationRating) : null,
          transport_preference: transportPreference || null,
          direct_flights_only: directFlightsOnly,
          flight_time_preference: flightTimePreference || null,
          dealbreakers: dealbreakers.length > 0 ? dealbreakers : null,
          must_haves: mustHaves.length > 0 ? mustHaves : null,
          is_submitted: true,
          submitted_at: new Date().toISOString(),
        })
      }

      // For surprise attendees, auto-create their preferences
      const surpriseAttendees = attendees.filter(a => a.role === 'surprise')
      if (surpriseAttendees.length > 0) {
        const { data: surpriseMembers } = await supabase
          .from('trip_members')
          .select('id, invite_email, preferred_airport')
          .eq('trip_id', trip.id)
          .eq('role', 'surprise')

        if (surpriseMembers) {
          const surprisePrefs = surpriseMembers.map(sm => {
            const matchingAttendee = surpriseAttendees.find(a => a.email === sm.invite_email)
            return {
              trip_id: trip.id,
              member_id: null,
              trip_member_id: sm.id,
              preferred_airport: matchingAttendee?.preferredAirport || sm.preferred_airport || null,
              transport_preference: transportPreference || 'flight',
              is_submitted: true,
              submitted_at: new Date().toISOString(),
            }
          })
          await supabase.from('member_preferences').insert(surprisePrefs)
        }
      }

      router.push(`/trips/${trip.id}/created`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const stepLabels = {
    basics: 'Trip basics',
    attendees_preferences: 'Attendees & preferences',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            Create a new trip
          </h1>
          <p className="text-text-secondary">
            Step {step === 'basics' ? 1 : 2} of 2: {stepLabels[step]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          <div
            className={`h-1 flex-1 rounded-full ${
              step === 'basics' ? 'bg-accent' : 'bg-success'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${
              step === 'attendees_preferences' ? 'bg-accent' : 'bg-border'
            }`}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6">
          {step === 'basics' && (
            <div className="space-y-5">
              {/* Trip Name */}
              <div>
                <label htmlFor="trip-name" className="block text-sm font-medium text-primary mb-2">
                  Trip name
                </label>
                <input
                  id="trip-name"
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="e.g., Barcelona Spring Break"
                  className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                />
              </div>

              {/* Group Size & Trip Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="group-size" className="block text-sm font-medium text-primary mb-2">
                    Group size
                  </label>
                  <input
                    id="group-size"
                    type="number"
                    min="2"
                    max="50"
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary"
                  />
                </div>

                <div>
                  <label htmlFor="trip-type" className="block text-sm font-medium text-primary mb-2">
                    Trip type
                  </label>
                  <select
                    id="trip-type"
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary"
                  >
                    {TRIP_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-primary mb-2">
                    Start date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary"
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-primary mb-2">
                    End date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  How would you like to handle payment?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('organiser_pays')}
                    className={`relative p-4 rounded-card border-2 text-left transition-all ${
                      paymentMethod === 'organiser_pays'
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-700 mb-2">
                      Fastest to book
                    </span>
                    <div className="text-sm font-bold text-primary mb-2">One card</div>
                    <p className="text-sm font-semibold text-primary mb-1">I'll collect and pay</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      You collect the money from your crew and pay for everything with one card. Quickest way to lock in the booking.
                    </p>
                    {paymentMethod === 'organiser_pays' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('individual_pays')}
                    className={`relative p-4 rounded-card border-2 text-left transition-all ${
                      paymentMethod === 'individual_pays'
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-100 text-blue-700 mb-2">
                      Most popular
                    </span>
                    <div className="text-sm font-bold text-primary mb-2">Split</div>
                    <p className="text-sm font-semibold text-primary mb-1">Everyone pays their share</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      We'll send payment links to each person. Everyone pays for their own share before the trip is booked.
                    </p>
                    {paymentMethod === 'individual_pays' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                </div>

                {paymentMethod && (
                  <div className={`mt-3 px-4 py-3 rounded-input text-xs leading-relaxed ${
                    paymentMethod === 'organiser_pays'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {paymentMethod === 'organiser_pays' ? (
                      <>You'll pay the full amount at checkout. We recommend collecting money from your group via bank transfer or Monzo before booking.</>
                    ) : (
                      <>Once options are ready, each attendee gets a secure payment link. The trip is only booked once everyone has paid.</>
                    )}
                  </div>
                )}
              </div>

              {/* Cost Split — only if individual pays */}
              {paymentMethod === 'individual_pays' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    How should the cost be split?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCostSplit('even')}
                      className={`relative p-4 rounded-card border-2 text-left transition-all ${
                        costSplit === 'even'
                          ? 'border-accent bg-accent-light'
                          : 'border-border hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="text-sm font-semibold text-primary mb-1">Even split</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Total trip cost divided equally between everyone, regardless of individual flight prices.
                      </p>
                      {costSplit === 'even' && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCostSplit('exact')}
                      className={`relative p-4 rounded-card border-2 text-left transition-all ${
                        costSplit === 'exact'
                          ? 'border-accent bg-accent-light'
                          : 'border-border hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="text-sm font-semibold text-primary mb-1">Pay what you owe</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Each person pays their actual travel cost plus an equal share of the hotel.
                      </p>
                      {costSplit === 'exact' && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  </div>

                  {costSplit && (
                    <div className="mt-3 px-4 py-3 rounded-input text-xs leading-relaxed bg-bg-soft text-text-secondary border border-border">
                      {costSplit === 'even' ? (
                        <>Everyone pays the same amount. Works best when your group is travelling from similar distances and the price difference is small.</>
                      ) : (
                        <>People flying from further away will pay more for their transport. Hotel costs are always split equally across the group.</>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Room Sharing */}
              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  Room sharing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoomSharing('shared')}
                    className={`relative p-4 rounded-card border-2 text-left transition-all ${
                      roomSharing === 'shared'
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary mb-1">Happy to share</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Book fewer rooms — people will pair up and share. Keeps the cost down.
                    </p>
                    {roomSharing === 'shared' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoomSharing('individual')}
                    className={`relative p-4 rounded-card border-2 text-left transition-all ${
                      roomSharing === 'individual'
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary mb-1">Own rooms</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Everyone gets their own room. More private, slightly higher cost per person.
                    </p>
                    {roomSharing === 'individual' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                </div>

                {roomSharing && (
                  <div className="mt-3 px-4 py-3 rounded-input text-xs leading-relaxed bg-bg-soft text-text-secondary border border-border">
                    {roomSharing === 'shared' ? (
                      <>We'll search for {Math.ceil(parseInt(groupSize) / 2)} room{Math.ceil(parseInt(groupSize) / 2) !== 1 ? 's' : ''} for {groupSize} people. The hotel cost will be split evenly across the group.</>
                    ) : (
                      <>We'll search for {groupSize} room{parseInt(groupSize) !== 1 ? 's' : ''} — one per person. Each person's share includes their own room.</>
                    )}
                  </div>
                )}
              </div>

              {/* Trip Mode */}
              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  How do you want to plan this trip?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTripMode('collaborative')}
                    className={`relative p-4 rounded-card border-2 text-left transition-all ${
                      tripMode === 'collaborative'
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-100 text-blue-700 mb-2">
                      Recommended
                    </span>
                    <p className="text-sm font-semibold text-primary mb-1">Group votes</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Attendees vote on destinations, share their preferences, and you find the best match for everyone.
                    </p>
                    {tripMode === 'collaborative' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTripMode('organiser_decides')}
                    className={`relative p-4 rounded-card border-2 text-left transition-all ${
                      tripMode === 'organiser_decides'
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary mb-1">I'll decide everything</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      You pick the destination, dates, budget and hotel. Attendees just provide their travel details.
                    </p>
                    {tripMode === 'organiser_decides' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                </div>

                {tripMode === 'organiser_decides' && (
                  <div className="mt-3 px-4 py-3 rounded-input text-xs leading-relaxed bg-amber-50 text-amber-800 border border-amber-200">
                    Attendees will still be asked for their passport name, nationality and departure airport — but they won't vote on destinations.
                  </div>
                )}
              </div>

              {/* Destinations — only for collaborative mode */}
              {tripMode === 'collaborative' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-primary">
                    Shortlist destinations for your group
                  </label>

                  {!destinationsSkipped && (
                    <>
                      {/* Preset buttons */}
                      {TRIP_TYPE_PRESETS[tripType] && (
                        <div>
                          <button
                            type="button"
                            onClick={handleApplyPreset}
                            className="w-full p-3 rounded-card border border-border bg-white hover:bg-bg-soft transition-colors text-sm font-medium text-primary text-left"
                          >
                            {TRIP_TYPE_EMOJIS[tripType]} Popular {tripType} destinations
                          </button>
                          <p className="text-xs text-text-muted mt-2">Click to auto-fill {tripType} hotspots. You can still add or remove destinations.</p>
                        </div>
                      )}

                      {/* Destination Scope */}
                      <div>
                        <label className="block text-sm font-medium text-primary mb-3">
                          Where should we look?
                        </label>
                        <p className="text-xs text-text-secondary mb-3">
                          This narrows down the options your group can choose from
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(Object.keys(regionLabels) as Region[]).map((region) => (
                            <button
                              key={region}
                              type="button"
                              onClick={() => setDestinationScope(region)}
                              className={`relative p-3 rounded-card border-2 text-center transition-all ${
                                destinationScope === region
                                  ? 'border-accent bg-accent-light'
                                  : 'border-border hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="text-lg mb-1">{regionIcons[region]}</div>
                              <p className="text-xs font-medium text-primary">{regionLabels[region]}</p>
                              {destinationScope === region && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shortlisted Cities */}
                      <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                          Shortlist 3–5 destinations for your group to vote on
                        </label>
                        <p className="text-xs text-text-secondary mb-3">
                          Your crew will pick their favourites from this list — guaranteed overlap
                        </p>
                        <div className="relative">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                              type="text"
                              value={shortlistInput}
                              onChange={(e) => {
                                setShortlistInput(e.target.value)
                                setShowShortlistDropdown(true)
                              }}
                              onFocus={() => setShowShortlistDropdown(true)}
                              placeholder="Search cities to add..."
                              disabled={shortlistedCities.length >= 5}
                              className="w-full pl-10 pr-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted disabled:opacity-50"
                            />
                          </div>

                          {showShortlistDropdown && shortlistedCities.length < 5 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-card shadow-lg max-h-48 overflow-y-auto">
                              {searchDestinations(shortlistInput, destinationScope)
                                .filter((d) => !shortlistedCities.includes(`${d.city}, ${d.country}`))
                                .map((dest) => (
                                  <button
                                    key={`${dest.city}-${dest.country}`}
                                    type="button"
                                    onClick={() => {
                                      const label = `${dest.city}, ${dest.country}`
                                      setShortlistedCities([...shortlistedCities, label])
                                      setShortlistInput('')
                                      setShowShortlistDropdown(false)
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-bg-soft transition-colors border-b border-border last:border-b-0"
                                  >
                                    <p className="text-sm font-medium text-primary">{dest.city}</p>
                                    <p className="text-xs text-text-secondary">{dest.country}</p>
                                  </button>
                                ))}
                              {searchDestinations(shortlistInput, destinationScope)
                                .filter((d) => !shortlistedCities.includes(`${d.city}, ${d.country}`))
                                .length === 0 && (
                                <div className="px-4 py-3 text-sm text-text-muted">
                                  No matching destinations found
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {shortlistedCities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {shortlistedCities.map((city, i) => (
                              <span
                                key={city}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light text-accent rounded-full text-sm font-medium"
                              >
                                <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                {city}
                                <button type="button" onClick={() => setShortlistedCities(shortlistedCities.filter(c => c !== city))} className="hover:text-red-600 ml-0.5">
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-text-muted mt-2">
                          {shortlistedCities.length}/5 selected · {shortlistedCities.length < 3 ? `Add ${3 - shortlistedCities.length} more` : 'Looking good!'}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-muted font-medium">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Let attendees decide */}
                  <button
                    type="button"
                    onClick={() => setDestinationsSkipped(!destinationsSkipped)}
                    className={`w-full p-4 rounded-card border-2 text-left transition-all ${
                      destinationsSkipped
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary mb-1">Let attendees decide</p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Skip the shortlist — your attendees will suggest destinations when they submit their preferences.
                    </p>
                    {destinationsSkipped && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'attendees_preferences' && (
            <div className="space-y-6">
              {/* Section A: Add your crew */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary">Add your crew</h3>

                {/* Passport confirmation */}
                <label className="flex items-start gap-3 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-input">
                  <input
                    type="checkbox"
                    checked={passportConfirmed}
                    onChange={(e) => setPassportConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-amber-800 font-medium leading-relaxed">
                    I confirm that the names I enter for each attendee match their passport exactly
                  </span>
                </label>

                {/* Attendee form */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="attendee-first-name" className="block text-sm font-medium text-primary mb-2">
                        First name
                      </label>
                      <input
                        id="attendee-first-name"
                        type="text"
                        value={newAttendeeFirstName}
                        onChange={(e) => setNewAttendeeFirstName(e.target.value)}
                        placeholder="e.g., John"
                        className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                      />
                    </div>
                    <div>
                      <label htmlFor="attendee-last-name" className="block text-sm font-medium text-primary mb-2">
                        Last name
                      </label>
                      <input
                        id="attendee-last-name"
                        type="text"
                        value={newAttendeeLastName}
                        onChange={(e) => setNewAttendeeLastName(e.target.value)}
                        placeholder="e.g., Smith"
                        className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="attendee-email" className="block text-sm font-medium text-primary mb-2">
                      Email
                    </label>
                    <input
                      id="attendee-email"
                      type="email"
                      value={newAttendeeEmail}
                      onChange={(e) => setNewAttendeeEmail(e.target.value)}
                      placeholder="john@example.com"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddAttendee()
                        }
                      }}
                      className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAttendee}
                    className="w-full py-2 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add attendee
                  </button>
                </div>

                {/* Attendee List */}
                {attendees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">
                      Attendees ({attendees.length})
                    </p>
                    <div className="space-y-3">
                      {attendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="px-4 py-3 bg-bg-soft rounded-card border border-border space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-primary">{attendee.firstName} {attendee.lastName}</p>
                                {attendee.role === 'surprise' && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-700">Surprise</span>
                                )}
                                {attendee.costsCovered && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700">Costs covered</span>
                                )}
                              </div>
                              <p className="text-xs text-text-secondary">{attendee.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttendee(attendee.id)}
                              className="p-1 hover:bg-white rounded transition-colors"
                            >
                              <X size={18} className="text-text-secondary hover:text-red-600" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setAttendees(attendees.map(a =>
                                a.id === attendee.id ? { ...a, costsCovered: !a.costsCovered } : a
                              ))}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                attendee.costsCovered
                                  ? 'bg-green-50 border-green-300 text-green-700'
                                  : 'bg-white border-border text-text-secondary hover:border-green-300'
                              }`}
                            >
                              <Gift size={12} />
                              {attendee.costsCovered ? 'Costs covered' : 'Cover their costs'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setAttendees(attendees.map(a =>
                                a.id === attendee.id ? { ...a, role: a.role === 'surprise' ? 'attendee' : 'surprise' } : a
                              ))}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                attendee.role === 'surprise'
                                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                                  : 'bg-white border-border text-text-secondary hover:border-purple-300'
                              }`}
                            >
                              <EyeOff size={12} />
                              {attendee.role === 'surprise' ? 'Surprise attendee' : 'Make surprise'}
                            </button>
                          </div>

                          {attendee.role === 'surprise' && (
                            <div className="pt-2 border-t border-border">
                              <label className="block text-xs font-medium text-purple-700 mb-1.5">
                                Their departure airport (you're entering on their behalf)
                              </label>
                              <input
                                type="text"
                                value={attendee.preferredAirport || ''}
                                onChange={(e) => setAttendees(attendees.map(a =>
                                  a.id === attendee.id ? { ...a, preferredAirport: e.target.value } : a
                                ))}
                                placeholder="e.g., London Heathrow, Manchester..."
                                className="w-full px-3 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm"
                              />
                              <p className="text-[11px] text-purple-600 mt-1">
                                This person won't receive an invite or see the trip — it's a surprise! You'll enter their travel details.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section B: Your preferences */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-primary">Your preferences</h3>
                <p className="text-sm text-text-secondary">
                  Tell us your preferences for this trip. Your attendees will be asked the same questions — the more detail you give, the better we can match everyone.
                </p>

                {/* Nationality */}
                <div className="relative">
                  <label htmlFor="nationality" className="block text-sm font-medium text-primary mb-2">
                    Nationality
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowNationalityDropdown(!showNationalityDropdown); setNationalitySearch('') }}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-left flex items-center justify-between gap-2"
                  >
                    <span className={nationality ? 'text-primary' : 'text-text-muted'}>
                      {nationality || 'Select your nationality'}
                    </span>
                    <ChevronDown size={16} className={`text-text-secondary transition-transform ${showNationalityDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showNationalityDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowNationalityDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-card shadow-lg max-h-64 overflow-hidden">
                        <div className="p-2 border-b border-border">
                          <div className="flex items-center gap-2 px-2 py-1 bg-bg-soft rounded-input">
                            <Search size={14} className="text-text-muted" />
                            <input
                              type="text"
                              value={nationalitySearch}
                              onChange={(e) => setNationalitySearch(e.target.value)}
                              placeholder="Search..."
                              autoFocus
                              className="flex-1 bg-transparent text-sm text-primary placeholder-text-muted outline-none"
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {filteredNationalities.length === 0 ? (
                            <p className="p-3 text-sm text-text-muted text-center">No results</p>
                          ) : (
                            filteredNationalities.map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => { setNationality(n); setShowNationalityDropdown(false) }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-bg-soft transition-colors ${
                                  nationality === n ? 'bg-accent-light text-accent font-medium' : 'text-primary'
                                }`}
                              >
                                {n}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-text-muted mt-1">Helps us check visa requirements for your group</p>
                </div>

                {/* Vote on destinations — only if collaborative and not skipped */}
                {tripMode === 'collaborative' && !destinationsSkipped && shortlistedCities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Vote for your top destinations
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    Pick up to 3 favourites from the shortlist — tap to select
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {shortlistedCities.map((city, i) => {
                      const isVoted = destinationVotes.includes(city)
                      const voteRank = destinationVotes.indexOf(city) + 1

                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleToggleDestinationVote(city)}
                          className={`relative flex items-center gap-3 p-4 rounded-card border-2 text-left transition-all ${
                            isVoted
                              ? 'border-accent bg-accent-light'
                              : destinationVotes.length >= 3
                                ? 'border-border bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-border hover:border-gray-300 bg-white'
                          }`}
                          disabled={!isVoted && destinationVotes.length >= 3}
                        >
                          {isVoted ? (
                            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                              #{voteRank}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-border bg-white flex items-center justify-center shrink-0">
                              <span className="text-xs text-text-muted">{i + 1}</span>
                            </div>
                          )}
                          <div>
                            <p className={`text-sm font-semibold ${isVoted ? 'text-accent' : 'text-primary'}`}>
                              {city.split(', ')[0]}
                            </p>
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
                  <p className="text-xs text-text-muted mt-2">
                    {destinationVotes.length}/3 selected{destinationVotes.length === 0 ? ' — tap your favourites' : ''}
                  </p>
                </div>
                )}

                {/* Transport Preference */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    How do you want to get there?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'flight', label: 'Fly' },
                      { value: 'train', label: 'Train' },
                      { value: 'drive', label: 'Drive' },
                      { value: 'no_preference', label: 'Any' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setTransportPreference(option.value)
                          setHubSearchInput('')
                          setPreferredAirport('')
                        }}
                        className={`p-3 rounded-card border-2 text-center transition-all ${
                          transportPreference === option.value
                            ? 'border-accent bg-accent-light'
                            : 'border-border hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className="text-sm font-medium text-primary">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flight preferences */}
                {(transportPreference === 'flight' || transportPreference === 'no_preference') && (
                  <div className="space-y-4 p-4 bg-bg-soft rounded-card border border-border">
                    <p className="text-sm font-medium text-primary">Flight preferences</p>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">
                        Preferred flight time
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { value: 'early_morning', label: 'Early morning', sub: 'Before 8am' },
                          { value: 'morning', label: 'Morning', sub: '8am – 12pm' },
                          { value: 'afternoon', label: 'Afternoon', sub: '12pm – 6pm' },
                          { value: 'evening', label: 'Evening', sub: 'After 6pm' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFlightTimePreference(option.value)}
                            className={`p-2 rounded-input border-2 text-center transition-all ${
                              flightTimePreference === option.value
                                ? 'border-accent bg-accent-light'
                                : 'border-border hover:border-gray-300 bg-white'
                            }`}
                          >
                            <p className="text-xs font-medium text-primary">{option.label}</p>
                            <p className="text-[10px] text-text-secondary">{option.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setDirectFlightsOnly(!directFlightsOnly)}
                        className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                          directFlightsOnly ? 'bg-accent justify-end' : 'bg-border justify-start'
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Direct flights only</p>
                        <p className="text-xs text-text-secondary">Skip options with layovers</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Departure Location */}
                <div className="relative">
                  <label htmlFor="airport" className="block text-sm font-medium text-primary mb-2">
                    {transportPreference === 'train'
                      ? 'Where will you depart from?'
                      : transportPreference === 'drive'
                        ? 'Where will you depart from?'
                        : 'Your nearest airport'
                    }
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      id="airport"
                      type="text"
                      value={hubSearchInput}
                      onChange={(e) => {
                        setHubSearchInput(e.target.value)
                        setShowHubDropdown(true)
                        if (!e.target.value.trim()) setPreferredAirport('')
                      }}
                      onFocus={() => setShowHubDropdown(true)}
                      placeholder={
                        transportPreference === 'train'
                          ? 'Search cities e.g. London, Manchester...'
                          : 'Search airports e.g. Heathrow, Manchester...'
                      }
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                      autoComplete="off"
                    />
                    {hubSearchInput && (
                      <button
                        type="button"
                        onClick={() => { setHubSearchInput(''); setPreferredAirport(''); setShowHubDropdown(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {showHubDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-card shadow-lg max-h-64 overflow-y-auto">
                      {(() => {
                        const mode = transportPreference === 'train' ? 'train' as const
                          : transportPreference === 'flight' ? 'flight' as const
                          : 'any' as const
                        const results = searchTravelHubs(hubSearchInput, mode)

                        if (results.length === 0) {
                          return (
                            <div className="px-4 py-3 text-sm text-text-muted">
                              No {transportPreference === 'train' ? 'stations' : 'airports'} found for "{hubSearchInput}"
                            </div>
                          )
                        }

                        return results.map((hub) => (
                          <button
                            key={`${hub.city}-${hub.country}`}
                            type="button"
                            onClick={() => {
                              setPreferredAirport(hub.city)
                              setHubSearchInput(getHubLabel(hub, mode))
                              setShowHubDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-bg-soft transition-colors flex items-center justify-between gap-2 border-b border-border last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-primary">{hub.city}</p>
                              <p className="text-xs text-text-secondary">
                                {mode === 'train' && hub.stationName
                                  ? hub.stationName
                                  : hub.airportName
                                    ? `${hub.airportName}${hub.airportCode ? ` (${hub.airportCode})` : ''}`
                                    : hub.country
                                }
                              </p>
                            </div>
                            <span className="text-[10px] text-text-muted uppercase">{hub.country}</span>
                          </button>
                        ))
                      })()}
                    </div>
                  )}
                </div>

                {showHubDropdown && (
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowHubDropdown(false)}
                  />
                )}

                {/* Accommodation Type */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    What type of accommodation do you prefer?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'hotel', label: 'Hotel' },
                      { value: 'apartment', label: 'Apartment' },
                      { value: 'villa', label: 'Villa' },
                      { value: 'hostel', label: 'Hostel' },
                      { value: 'resort', label: 'Resort' },
                      { value: 'no_preference', label: 'No preference' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAccommodationType(option.value)}
                        className={`relative p-3 rounded-card border-2 text-center transition-all ${
                          accommodationType === option.value
                            ? 'border-accent bg-accent-light'
                            : 'border-border hover:border-gray-300 bg-white'
                        }`}
                      >
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

                {/* Accommodation Rating */}
                {accommodationType && accommodationType !== 'hostel' && accommodationType !== 'no_preference' && (
                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">
                      Minimum star rating
                    </label>
                    <div className="flex gap-2">
                      {['3', '4', '5'].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setAccommodationRating(stars)}
                          className={`flex-1 py-2 rounded-input border-2 text-sm font-medium transition-all ${
                            accommodationRating === stars
                              ? 'border-accent bg-accent-light text-accent'
                              : 'border-border hover:border-gray-300 text-primary'
                          }`}
                        >
                          {stars}+ star{parseInt(stars) > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    Your budget per person
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {[
                      { tier: 'budget', label: 'Budget', sub: '£0–500pp' },
                      { tier: 'mid', label: 'Mid-range', sub: '£500–1,000pp' },
                      { tier: 'bougie', label: 'Bougie', sub: '£1,000–2,000pp' },
                      { tier: 'blowout', label: 'Blow-out', sub: '£2,000+pp' },
                    ].map((option) => (
                      <button
                        key={option.tier}
                        type="button"
                        onClick={() => handleBudgetTierChange(option.tier as 'budget' | 'mid' | 'bougie' | 'blowout')}
                        className={`p-2 rounded-input border-2 text-center transition-all ${
                          budgetTier === option.tier
                            ? 'border-accent bg-accent-light'
                            : 'border-border hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className="text-xs font-medium text-primary">{option.label}</p>
                        <p className="text-[10px] text-text-secondary">{option.sub}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCustomBudget(!showCustomBudget)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Set custom range
                  </button>

                  {showCustomBudget && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        placeholder="Min (£)"
                        className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                      />
                      <input
                        type="number"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        placeholder="Max (£)"
                        className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted"
                      />
                    </div>
                  )}
                  <p className="text-xs text-text-muted mt-2">Total budget per person including flights and accommodation</p>
                </div>

                {/* Must-haves */}
                <div className="relative">
                  <label className="block text-sm font-medium text-primary mb-2">
                    Must-haves for this trip
                  </label>
                  {mustHaves.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {mustHaves.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                        >
                          {item}
                          <button type="button" onClick={() => setMustHaves(mustHaves.filter(m => m !== item))} className="hover:text-red-600">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowMustHaveDropdown(!showMustHaveDropdown); setShowDealbreakerDropdown(false) }}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-left text-text-muted hover:border-gray-300 transition-colors flex items-center justify-between"
                  >
                    <span>{mustHaves.length > 0 ? 'Add more...' : 'Select must-haves...'}</span>
                    <Plus size={16} />
                  </button>
                  {showMustHaveDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMustHaveDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-card shadow-lg max-h-56 overflow-y-auto">
                        {MUST_HAVE_OPTIONS.filter(opt => !mustHaves.includes(opt)).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => { setMustHaves([...mustHaves, opt]); setShowMustHaveDropdown(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-green-50 transition-colors border-b border-border last:border-0"
                          >
                            {opt}
                          </button>
                        ))}
                        {MUST_HAVE_OPTIONS.filter(opt => !mustHaves.includes(opt)).length === 0 && (
                          <div className="px-4 py-3 text-sm text-text-muted">All options selected</div>
                        )}
                      </div>
                    </>
                  )}
                  <p className="text-xs text-text-muted mt-1">Things you absolutely need</p>
                </div>

                {/* Dealbreakers */}
                <div className="relative">
                  <label className="block text-sm font-medium text-primary mb-2">
                    Dealbreakers
                  </label>
                  {dealbreakers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dealbreakers.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                        >
                          {item}
                          <button type="button" onClick={() => setDealbreakers(dealbreakers.filter(d => d !== item))} className="hover:text-red-600">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowDealbreakerDropdown(!showDealbreakerDropdown); setShowMustHaveDropdown(false) }}
                    className="w-full px-4 py-2 border border-border rounded-input bg-white text-left text-text-muted hover:border-gray-300 transition-colors flex items-center justify-between"
                  >
                    <span>{dealbreakers.length > 0 ? 'Add more...' : 'Select dealbreakers...'}</span>
                    <Plus size={16} />
                  </button>
                  {showDealbreakerDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDealbreakerDropdown(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-card shadow-lg max-h-56 overflow-y-auto">
                        {DEALBREAKER_OPTIONS.filter(opt => !dealbreakers.includes(opt)).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => { setDealbreakers([...dealbreakers, opt]); setShowDealbreakerDropdown(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-red-50 transition-colors border-b border-border last:border-0"
                          >
                            {opt}
                          </button>
                        ))}
                        {DEALBREAKER_OPTIONS.filter(opt => !dealbreakers.includes(opt)).length === 0 && (
                          <div className="px-4 py-3 text-sm text-text-muted">All options selected</div>
                        )}
                      </div>
                    </>
                  )}
                  <p className="text-xs text-text-muted mt-1">Things that would rule out an option entirely</p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            {step !== 'basics' && (
              <button
                type="button"
                onClick={handleBackStep}
                className="flex-1 py-2 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
              >
                Back
              </button>
            )}

            {step !== 'attendees_preferences' ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white rounded-input font-medium transition-colors"
              >
                Next step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateTrip}
                disabled={loading || !tripName}
                className="flex-1 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-input font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating trip...
                  </>
                ) : (
                  'Create trip'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
