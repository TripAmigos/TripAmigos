'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader, X, Plus } from 'lucide-react'
import { format } from 'date-fns'

interface SubmitPreferencesProps {
  trip: any
  tripMemberId: string
  userId: string
  alreadySubmitted: boolean
}

export default function SubmitPreferences({ trip, tripMemberId, userId, alreadySubmitted }: SubmitPreferencesProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(alreadySubmitted)

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
  const [mustHavesInput, setMustHavesInput] = useState('')
  const [mustHaves, setMustHaves] = useState<string[]>([])

  const handleToggleDestinationVote = (city: string) => {
    if (destinationVotes.includes(city)) {
      setDestinationVotes(destinationVotes.filter(d => d !== city))
    } else if (destinationVotes.length < 3) {
      setDestinationVotes([...destinationVotes, city])
    }
  }


  const handleAddMustHave = () => {
    const val = mustHavesInput.trim()
    if (val && !mustHaves.includes(val)) setMustHaves([...mustHaves, val])
    setMustHavesInput('')
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const { error: insertError } = await supabase.from('member_preferences').insert({
        trip_id: trip.id,
        member_id: userId,
        trip_member_id: tripMemberId,
        nationality: nationality || null,
        preferred_airport: preferredAirport || null,
        budget_min: budgetMin ? parseInt(budgetMin) : null,
        budget_max: budgetMax ? parseInt(budgetMax) : null,
        preferred_destinations: destinationVotes.length > 0 ? destinationVotes : null,
        accommodation_type: accommodationType || null,
        accommodation_rating_min: accommodationRating ? parseInt(accommodationRating) : null,
        transport_preference: transportPreference || null,
        direct_flights_only: directFlightsOnly,
        flight_time_preference: flightTimePreferences.length > 0 ? JSON.stringify(flightTimePreferences) : null,
        dealbreakers: null,
        must_haves: mustHaves.length > 0 ? mustHaves : null,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const startDate = new Date(trip.date_from)
  const endDate = new Date(trip.date_to)

  // Already submitted view
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="space-y-3">
          <p className="text-5xl font-bold text-green-600">✓</p>
          <h1 className="text-2xl font-bold text-primary">Preferences submitted!</h1>
          <p className="text-text-secondary">
            Nice one. We've got your choices for <strong className="text-primary">{trip.name}</strong>. Once everyone else has submitted, the organiser will pick the best option and book everything.
          </p>
        </div>
        <div className="bg-bg-soft rounded-card p-4 space-y-2 text-left">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">What happens next</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0 mt-0.5">1</span>
              <p className="text-sm text-primary">We wait for the rest of the group to submit their preferences</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0 mt-0.5">2</span>
              <p className="text-sm text-primary">The organiser reviews the options that match everyone</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0 mt-0.5">3</span>
              <p className="text-sm text-primary">They book and you'll get a confirmation with all the details</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-input font-semibold transition-colors"
        >
          Go to my dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-accent uppercase tracking-wider">You're in!</p>
        <h1 className="text-3xl font-bold text-primary">Choose your preferences</h1>
        <p className="text-text-secondary">
          Tell us what you want from <strong className="text-primary">{trip.name}</strong> ({format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}). The organiser will use everyone's answers to find the best options.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-6">
        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Nationality</label>
          <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. British, American, French" className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
          <p className="text-xs text-text-muted mt-1">Helps us check visa requirements</p>
        </div>

        {/* Vote on destinations */}
        {trip.shortlisted_cities && trip.shortlisted_cities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Vote for your top destinations</label>
            <p className="text-xs text-text-secondary mb-3">Pick up to 3 favourites — tap to select</p>
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
            <p className="text-xs text-text-muted mt-2">{destinationVotes.length}/3 selected</p>
          </div>
        )}

        {/* Airport */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Your nearest airport</label>
          <input type="text" value={preferredAirport} onChange={(e) => setPreferredAirport(e.target.value)} placeholder="e.g. Heathrow, Manchester, Edinburgh" className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
        </div>

        {/* Accommodation */}
        <div>
          <label className="block text-sm font-medium text-primary mb-3">What type of accommodation do you prefer?</label>
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
          <div>
            <label className="block text-sm font-medium text-primary mb-3">Minimum star rating</label>
            <div className="flex gap-2">
              {['3', '4', '5'].map((stars) => (
                <button key={stars} type="button" onClick={() => setAccommodationRating(stars)}
                  className={`flex-1 py-2 rounded-input border-2 text-sm font-medium transition-all ${accommodationRating === stars ? 'border-accent bg-accent-light text-accent' : 'border-border hover:border-gray-300 text-primary'}`}>
                  {stars}+ star{parseInt(stars) > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transport */}
        <div>
          <label className="block text-sm font-medium text-primary mb-3">How do you want to get there?</label>
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
          <div className="space-y-4 p-4 bg-bg-soft rounded-card border border-border">
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

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Your budget per person</label>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="Min (£)" className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
            <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Max (£)" className="w-full px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
          </div>
          <p className="text-xs text-text-muted mt-1">Total per person including flights and accommodation</p>
        </div>

        {/* Must-haves */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Must-haves</label>
          <div className="flex gap-2">
            <input type="text" value={mustHavesInput} onChange={(e) => setMustHavesInput(e.target.value)} placeholder="e.g. Pool, Wi-Fi, Near the beach"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMustHave() } }}
              className="flex-1 px-4 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted" />
            <button type="button" onClick={handleAddMustHave} className="px-4 py-2 border border-border rounded-input hover:bg-bg-soft transition-colors"><Plus size={18} /></button>
          </div>
          {mustHaves.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {mustHaves.map((item) => (
                <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  {item}<button type="button" onClick={() => setMustHaves(mustHaves.filter(m => m !== item))} className="hover:text-red-600"><X size={14} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-70 text-white rounded-card font-bold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <><Loader size={20} className="animate-spin" /> Submitting...</> : 'Submit my preferences'}
        </button>
      </div>
    </div>
  )
}
