'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader, X, Plus, Search, Gift, EyeOff, ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react'
import { Region, regionLabels, regionIcons, searchDestinations } from '@/lib/destinations'
import { searchTravelHubs, getHubLabel, TravelHub } from '@/lib/travel-hubs'

type WizardStep = 1 | 2 | 3 | 4

const TRIP_TYPE_OPTIONS = [
  { value: 'vacation', label: 'Vacation', emoji: '🌴' },
  { value: 'weekend', label: 'Weekend getaway', emoji: '✈️' },
  { value: 'stag', label: 'Stag do', emoji: '🎉' },
  { value: 'hen', label: 'Hen do', emoji: '👑' },
  { value: 'golf', label: 'Golf trip', emoji: '⛳' },
  { value: 'birthday', label: 'Birthday trip', emoji: '🎂' },
  { value: 'work', label: 'Work trip', emoji: '💼' },
  { value: 'adventure', label: 'Adventure', emoji: '🧗' },
  { value: 'other', label: 'Other', emoji: '🗺️' },
]

const TRIP_TYPE_PRESETS: Record<string, string[]> = {
  stag: ['Prague, Czech Republic', 'Budapest, Hungary', 'Amsterdam, Netherlands', 'Benidorm, Spain', 'Dublin, Ireland'],
  hen: ['Marbella, Spain', 'Lisbon, Portugal', 'Barcelona, Spain', 'Mykonos, Greece', 'Dublin, Ireland'],
  golf: ['Algarve, Portugal', 'Marbella, Spain', 'Antalya, Turkey', 'Edinburgh, Scotland', 'Vilamoura, Portugal'],
  birthday: ['Barcelona, Spain', 'Amsterdam, Netherlands', 'Paris, France', 'Lisbon, Portugal', 'Rome, Italy'],
  adventure: ['Reykjavik, Iceland', 'Marrakech, Morocco', 'Dubrovnik, Croatia', 'Lisbon, Portugal', 'Split, Croatia'],
  weekend: ['Amsterdam, Netherlands', 'Paris, France', 'Brussels, Belgium', 'Dublin, Ireland', 'Barcelona, Spain'],
}

interface Attendee {
  id: string
  firstName: string
  lastName: string
  email: string
  costsCovered: boolean
  role: 'attendee' | 'surprise'
  preferredAirport?: string
}

// ═══════════════════════════════════════════════════════
// CACTUS MASCOT
// ═══════════════════════════════════════════════════════

function CactusMascot({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cactus-mascot.svg" alt="TripAmigos mascot" width={60} height={80} className="w-[60px] h-auto" />
      </div>
      <div className="relative bg-white border border-border rounded-card p-3 shadow-sm mt-2 flex-1">
        <div className="absolute -left-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-border" />
        <div className="absolute -left-[6px] top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white" />
        <p className="text-sm text-primary leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP MESSAGES
// ═══════════════════════════════════════════════════════

const MASCOT_MESSAGES: Record<WizardStep, string> = {
  1: "Hola! Let's get this trip started. What are we calling it, how many amigos are coming, and what kind of trip is it?",
  2: "Nice! Now let's nail down the dates and sort out how you're paying and sleeping.",
  3: "Where are we headed? Pick some destinations for your group to vote on — or let them surprise you!",
  4: "Last step! Add your crew so we can send them invites. You can always add more later.",
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function CreateTripPage() {
  const router = useRouter()
  const supabase = createClient()
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1: The basics
  const [tripName, setTripName] = useState('')
  const [groupSize, setGroupSize] = useState('4')
  const [tripType, setTripType] = useState('')

  // Step 2: Dates, payment, rooms
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'organiser_pays' | 'individual_pays' | ''>('')
  const [roomSharing, setRoomSharing] = useState<'shared' | 'individual' | ''>('')
  const [customRoomCount, setCustomRoomCount] = useState('')
  const [bedPreference, setBedPreference] = useState<'no_preference' | 'double' | 'twin' | 'single'>('no_preference')

  // Step 3: Destinations
  const [tripMode, setTripMode] = useState<'collaborative' | 'organiser_decides'>('collaborative')
  const [destinationScope, setDestinationScope] = useState<Region>('anywhere')
  const [shortlistInput, setShortlistInput] = useState('')
  const [shortlistedCities, setShortlistedCities] = useState<string[]>([])
  const [showShortlistDropdown, setShowShortlistDropdown] = useState(false)
  const [destinationsSkipped, setDestinationsSkipped] = useState(false)
  const [presetsApplied, setPresetsApplied] = useState(false)

  // Step 4: Attendees
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('')
  const [newAttendeeFirstName, setNewAttendeeFirstName] = useState('')
  const [newAttendeeLastName, setNewAttendeeLastName] = useState('')
  const [passportConfirmed, setPassportConfirmed] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [wizardStep])

  // ─── Helpers ────────────────────────────────────────

  const handleApplyPreset = () => {
    if (presetsApplied) {
      setShortlistedCities([])
      setPresetsApplied(false)
      return
    }
    const preset = TRIP_TYPE_PRESETS[tripType]
    if (preset) {
      setShortlistedCities(preset)
      setShortlistInput('')
      setShowShortlistDropdown(false)
      setPresetsApplied(true)
      setDestinationsSkipped(false)
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

    setAttendees([...attendees, {
      id: Date.now().toString(),
      email: newAttendeeEmail,
      firstName: newAttendeeFirstName,
      lastName: newAttendeeLastName,
      costsCovered: false,
      role: 'attendee',
    }])
    setNewAttendeeEmail('')
    setNewAttendeeFirstName('')
    setNewAttendeeLastName('')
  }

  // ─── Validation ─────────────────────────────────────

  const validateStep = (step: WizardStep): boolean => {
    setError('')
    switch (step) {
      case 1:
        if (!tripName.trim()) { setError('Give your trip a name'); return false }
        if (!tripType) { setError('Pick a trip type'); return false }
        return true
      case 2:
        if (!startDate || !endDate) { setError('Please set your dates'); return false }
        const today = new Date(); today.setHours(0,0,0,0)
        if (new Date(startDate) < today) { setError("Start date can't be in the past"); return false }
        if (new Date(endDate) <= new Date(startDate)) { setError('End date must be after start date'); return false }
        if (!paymentMethod) { setError('Please choose a payment method'); return false }
        return true
      case 3:
        if (tripMode === 'collaborative' && !destinationsSkipped && shortlistedCities.length < 3) {
          setError('Please shortlist at least 3 destinations or choose "Let attendees decide"')
          return false
        }
        return true
      case 4:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(wizardStep)) {
      setWizardStep((wizardStep + 1) as WizardStep)
    }
  }

  const handleBack = () => {
    setError('')
    setWizardStep((wizardStep - 1) as WizardStep)
  }

  // ─── Create trip ────────────────────────────────────

  const handleCreateTrip = async () => {
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('You must be logged in'); setLoading(false); return }

      const { data: trip, error: tripError } = await (supabase as any)
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
          cost_split: 'even',
          destination_scope: destinationScope,
          shortlisted_cities: destinationsSkipped ? [] : shortlistedCities,
          trip_mode: tripMode,
          status: tripMode === 'organiser_decides' ? 'organiser_planning' : 'collecting',
        })
        .select()
        .single()

      if (tripError) { setError(tripError.message); setLoading(false); return }

      // Add organiser as trip member
      await (supabase as any).from('trip_members').insert({
        trip_id: trip.id,
        member_id: user.id,
        role: 'organiser',
        invite_status: 'accepted',
      })

      // Add attendees
      if (attendees.length > 0) {
        await (supabase as any).from('trip_members').insert(
          attendees.map((a) => ({
            trip_id: trip.id,
            invite_email: a.email,
            first_name: a.firstName,
            last_name: a.lastName,
            role: a.role as string,
            invite_status: a.role === 'surprise' ? 'accepted' : 'pending',
            costs_covered: a.costsCovered,
            preferred_airport: a.preferredAirport || null,
          }))
        )
      }

      router.push(`/trips/${trip.id}/created`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  const stepTitles = ['The basics', 'Dates & logistics', 'Destinations', 'Your crew']

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s < wizardStep ? 'bg-sage text-white'
              : s === wizardStep ? 'bg-accent text-white'
              : 'bg-border text-text-muted'
            }`}>
              {s < wizardStep ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : s}
            </div>
            {s < 4 && (
              <div className={`w-8 h-0.5 ${s < wizardStep ? 'bg-sage' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <p className="text-center text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
        Step {wizardStep} of 4 — {stepTitles[wizardStep - 1]}
      </p>

      {/* Mascot */}
      <div className="mb-6">
        <CactusMascot message={MASCOT_MESSAGES[wizardStep]} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* ═══════════ STEP 1: The basics ═══════════ */}
      {wizardStep === 1 && (
        <div className="space-y-5">
          {/* Trip name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">What should we call this trip?</label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. Jake's Stag Do, Summer 2026"
              className="w-full px-4 py-3 border border-border rounded-card bg-white text-primary placeholder-text-muted text-base"
              autoFocus
            />
          </div>

          {/* Group size */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">How many people are going?</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setGroupSize(String(Math.max(2, parseInt(groupSize) - 1)))}
                className="w-10 h-10 rounded-full border-2 border-border text-primary font-bold hover:bg-bg-soft transition-colors flex items-center justify-center">-</button>
              <span className="text-2xl font-bold text-primary w-12 text-center">{groupSize}</span>
              <button type="button" onClick={() => setGroupSize(String(Math.min(50, parseInt(groupSize) + 1)))}
                className="w-10 h-10 rounded-full border-2 border-border text-primary font-bold hover:bg-bg-soft transition-colors flex items-center justify-center">+</button>
              <span className="text-sm text-text-secondary ml-2">people (including you)</span>
            </div>
          </div>

          {/* Trip type */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">What kind of trip is it?</label>
            <div className="grid grid-cols-3 gap-2">
              {TRIP_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTripType(option.value)}
                  className={`relative p-3 rounded-card border-2 text-center transition-all ${
                    tripType === option.value
                      ? 'border-accent bg-accent-light'
                      : 'border-border hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-xl mb-1">{option.emoji}</div>
                  <p className="text-xs font-medium text-primary">{option.label}</p>
                  {tripType === option.value && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 2: Dates & logistics ═══════════ */}
      {wizardStep === 2 && (
        <div className="space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-card bg-white text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-card bg-white text-primary" />
            </div>
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">How are you handling payment?</label>
            <div className="space-y-2">
              {[
                { value: 'organiser_pays', title: 'One card', desc: "You collect the money and pay for everything. Quickest way to lock in the booking." },
                { value: 'individual_pays', title: 'Split', desc: "Everyone gets a payment link and pays their own share before booking." },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value as any)}
                  className={`w-full relative p-4 rounded-card border-2 text-left transition-all ${
                    paymentMethod === opt.value ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="text-sm font-semibold text-primary">{opt.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
                  {paymentMethod === opt.value && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Room sharing */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">Room sharing</label>
            <div className="space-y-2">
              {[
                { value: 'shared', title: 'Happy to share', desc: 'Fewer rooms, lower cost. People pair up.' },
                { value: 'individual', title: 'Own rooms', desc: 'Everyone gets their own room.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRoomSharing(opt.value as any)}
                  className={`w-full relative p-4 rounded-card border-2 text-left transition-all ${
                    roomSharing === opt.value ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="text-sm font-semibold text-primary">{opt.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
                  {roomSharing === opt.value && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {roomSharing === 'shared' && (
              <div className="mt-3 p-4 bg-bg-soft rounded-card border border-border space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Number of rooms</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max={parseInt(groupSize)}
                      value={customRoomCount || Math.ceil(parseInt(groupSize) / 2)}
                      onChange={(e) => setCustomRoomCount(e.target.value)}
                      className="w-20 px-3 py-1.5 border border-border rounded-input bg-white text-primary text-sm" />
                    <span className="text-xs text-text-muted">for {groupSize} people</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Bed preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'no_preference', label: 'No pref' },
                      { value: 'double', label: 'Double' },
                      { value: 'twin', label: 'Twin' },
                      { value: 'single', label: 'Single' },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setBedPreference(opt.value as any)}
                        className={`p-2 rounded-input border-2 text-center transition-all text-xs ${
                          bedPreference === opt.value ? 'border-accent bg-accent-light text-accent font-medium' : 'border-border hover:border-gray-300 text-primary'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ STEP 3: Destinations ═══════════ */}
      {wizardStep === 3 && (
        <div className="space-y-5">
          {/* Trip mode */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">How do you want to plan?</label>
            <div className="space-y-2">
              <button type="button" onClick={() => setTripMode('collaborative')}
                className={`w-full relative p-4 rounded-card border-2 text-left transition-all ${
                  tripMode === 'collaborative' ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-primary">Group votes</p>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sage-light text-sage-dark">Recommended</span>
                </div>
                <p className="text-xs text-text-secondary">Your crew votes on destinations — you book based on the results.</p>
                {tripMode === 'collaborative' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
              <button type="button" onClick={() => setTripMode('organiser_decides')}
                className={`w-full relative p-4 rounded-card border-2 text-left transition-all ${
                  tripMode === 'organiser_decides' ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                }`}>
                <p className="text-sm font-semibold text-primary">I&apos;ll decide everything</p>
                <p className="text-xs text-text-secondary">You pick the destination. Attendees just provide their travel details.</p>
                {tripMode === 'organiser_decides' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Destination shortlist — collaborative mode */}
          {tripMode === 'collaborative' && !destinationsSkipped && (
            <div className="space-y-4">
              {/* Presets */}
              {TRIP_TYPE_PRESETS[tripType] && (
                <button type="button" onClick={handleApplyPreset}
                  className={`w-full relative p-4 rounded-card border-2 text-left transition-all ${
                    presetsApplied ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      presetsApplied ? 'bg-accent border-accent' : 'border-gray-300'
                    }`}>
                      {presetsApplied && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">Popular {tripType} destinations</p>
                      <p className="text-xs text-text-secondary mt-0.5">Auto-fill curated hotspots — you can still edit</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Selected cities */}
              {shortlistedCities.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {shortlistedCities.map((city, i) => (
                      <span key={city} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light text-accent rounded-full text-sm font-medium">
                        <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        {city}
                        <button type="button" onClick={() => {
                          const updated = shortlistedCities.filter(c => c !== city)
                          setShortlistedCities(updated)
                          if (updated.length === 0) setPresetsApplied(false)
                        }} className="hover:text-red-600 ml-0.5"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {shortlistedCities.length}/5 selected {shortlistedCities.length < 3 ? `· Add ${3 - shortlistedCities.length} more` : '· Looking good!'}
                  </p>
                </div>
              )}

              {/* Search */}
              {!presetsApplied && (
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-primary mb-2">Where should we look?</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(Object.keys(regionLabels) as Region[]).slice(0, 8).map((region) => (
                        <button key={region} type="button" onClick={() => setDestinationScope(region)}
                          className={`p-2 rounded-card border-2 text-center transition-all ${
                            destinationScope === region ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                          }`}>
                          <div className="text-base">{regionIcons[region]}</div>
                          <p className="text-[10px] font-medium text-primary mt-0.5">{regionLabels[region]}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" value={shortlistInput}
                        onChange={(e) => { setShortlistInput(e.target.value); setShowShortlistDropdown(true) }}
                        onFocus={() => setShowShortlistDropdown(true)}
                        placeholder="Search cities to add..."
                        disabled={shortlistedCities.length >= 5}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-card bg-white text-primary placeholder-text-muted disabled:opacity-50" />
                    </div>
                    {showShortlistDropdown && shortlistedCities.length < 5 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-card shadow-lg max-h-48 overflow-y-auto">
                        {searchDestinations(shortlistInput, destinationScope)
                          .filter((d) => !shortlistedCities.includes(`${d.city}, ${d.country}`))
                          .map((dest) => (
                            <button key={`${dest.city}-${dest.country}`} type="button"
                              onClick={() => {
                                setShortlistedCities([...shortlistedCities, `${dest.city}, ${dest.country}`])
                                setShortlistInput('')
                                setShowShortlistDropdown(false)
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-bg-soft transition-colors border-b border-border last:border-b-0">
                              <p className="text-sm font-medium text-primary">{dest.city}</p>
                              <p className="text-xs text-text-secondary">{dest.country}</p>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {presetsApplied && shortlistedCities.length < 5 && (
                <button type="button" onClick={() => setPresetsApplied(false)}
                  className="text-sm text-accent font-medium hover:underline">
                  + Add your own destinations
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          {tripMode === 'collaborative' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button type="button" onClick={() => setDestinationsSkipped(!destinationsSkipped)}
                className={`w-full p-4 rounded-card border-2 text-left transition-all ${
                  destinationsSkipped ? 'border-accent bg-accent-light' : 'border-border hover:border-gray-300 bg-white'
                }`}>
                <p className="text-sm font-semibold text-primary">Let attendees decide</p>
                <p className="text-xs text-text-secondary mt-0.5">Skip the shortlist — your crew will suggest destinations.</p>
              </button>
            </>
          )}
        </div>
      )}

      {/* ═══════════ STEP 4: Your crew ═══════════ */}
      {wizardStep === 4 && (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary">
            You said this is a group of {groupSize}. Add the other {Math.max(parseInt(groupSize) - 1, 1)} {parseInt(groupSize) - 1 === 1 ? 'person' : 'people'} below.
            {attendees.length > 0 && (
              <span className="font-medium text-primary"> ({attendees.length} of {parseInt(groupSize) - 1} added)</span>
            )}
          </p>

          {/* Passport confirmation */}
          <label className="flex items-start gap-3 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-card">
            <input type="checkbox" checked={passportConfirmed} onChange={(e) => setPassportConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-accent focus:ring-accent" />
            <span className="text-xs text-amber-800 font-medium leading-relaxed">
              I confirm that the names I enter match each person&apos;s passport exactly
            </span>
          </label>

          {/* Add attendee form */}
          <div className="space-y-3 p-4 bg-white border border-border rounded-card">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={newAttendeeFirstName} onChange={(e) => setNewAttendeeFirstName(e.target.value)}
                placeholder="First name" className="w-full px-3 py-2.5 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm" />
              <input type="text" value={newAttendeeLastName} onChange={(e) => setNewAttendeeLastName(e.target.value)}
                placeholder="Last name" className="w-full px-3 py-2.5 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm" />
            </div>
            <input type="email" value={newAttendeeEmail} onChange={(e) => setNewAttendeeEmail(e.target.value)}
              placeholder="Email address"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAttendee() } }}
              className="w-full px-3 py-2.5 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm" />
            <button type="button" onClick={handleAddAttendee}
              className="w-full py-2.5 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors flex items-center justify-center gap-2 text-sm">
              <Plus size={16} /> Add attendee
            </button>
          </div>

          {/* Attendee list */}
          {attendees.length > 0 && (
            <div className="space-y-2">
              {attendees.map((attendee) => (
                <div key={attendee.id} className="px-4 py-3 bg-white rounded-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-primary">{attendee.firstName} {attendee.lastName}</p>
                        {attendee.role === 'surprise' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-700">Surprise</span>
                        )}
                        {attendee.costsCovered && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700">Covered</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">{attendee.email}</p>
                    </div>
                    <button type="button" onClick={() => setAttendees(attendees.filter(a => a.id !== attendee.id))}
                      className="p-1 hover:bg-bg-soft rounded transition-colors">
                      <X size={16} className="text-text-muted hover:text-red-600" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setAttendees(attendees.map(a =>
                      a.id === attendee.id ? { ...a, costsCovered: !a.costsCovered } : a
                    ))}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        attendee.costsCovered ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-border text-text-secondary hover:border-green-300'
                      }`}>
                      <Gift size={11} /> {attendee.costsCovered ? 'Costs covered' : 'Cover costs'}
                    </button>
                    <button type="button" onClick={() => setAttendees(attendees.map(a =>
                      a.id === attendee.id ? { ...a, role: a.role === 'surprise' ? 'attendee' : 'surprise' } : a
                    ))}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        attendee.role === 'surprise' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-white border-border text-text-secondary hover:border-purple-300'
                      }`}>
                      <EyeOff size={11} /> {attendee.role === 'surprise' ? 'Surprise' : 'Make surprise'}
                    </button>
                  </div>

                  {attendee.role === 'surprise' && (
                    <div className="pt-2 border-t border-border">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Their departure airport</label>
                      <input type="text" value={attendee.preferredAirport || ''}
                        onChange={(e) => setAttendees(attendees.map(a =>
                          a.id === attendee.id ? { ...a, preferredAirport: e.target.value } : a
                        ))}
                        placeholder="e.g. London Heathrow"
                        className="w-full px-3 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm" />
                      <p className="text-[11px] text-purple-600 mt-1">This person won&apos;t see the trip — it&apos;s a surprise!</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-text-muted text-center">
            You can always add more people after creating the trip
          </p>
        </div>
      )}

      {/* ═══════════ Navigation buttons ═══════════ */}
      <div className="flex gap-3 mt-8">
        {wizardStep > 1 && (
          <button type="button" onClick={handleBack}
            className="flex-1 py-3 border border-border text-primary rounded-card font-medium hover:bg-bg-soft transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back
          </button>
        )}

        {wizardStep < 4 ? (
          <button type="button" onClick={handleNext}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white rounded-card font-semibold transition-colors flex items-center justify-center gap-2">
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={handleCreateTrip} disabled={loading}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-card font-semibold transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader size={18} className="animate-spin" /> Creating trip...</> : 'Create trip'}
          </button>
        )}
      </div>
    </div>
  )
}
