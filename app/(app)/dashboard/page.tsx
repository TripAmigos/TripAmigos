import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { Users, Calendar, MapPin, CheckCircle, Clock, ArrowRight, Plane, Building2, Receipt, Plus } from 'lucide-react'
import DeleteTripButton from './delete-trip-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user's trips (as organiser)
  const { data: organisedTrips } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, status, organiser_id, group_size, booking_data,
      trip_members ( id, invite_status, role, member_id )
    `)
    .eq('organiser_id', user.id)
    .order('date_from', { ascending: false })

  // Fetch trips where user is a member (attendee)
  const { data: memberTrips } = await supabase
    .from('trip_members')
    .select(`
      trip_id, invite_status, role, member_id,
      trips ( id, name, date_from, date_to, status, organiser_id, group_size,
        trip_members ( id, invite_status, role, member_id )
      )
    `)
    .eq('member_id', user.id)

  // Fetch user's submitted preferences
  const { data: userPreferences } = await supabase
    .from('member_preferences')
    .select('trip_id, is_submitted')
    .eq('member_id', user.id)

  const submittedTripIds = new Set(
    (userPreferences || []).filter(p => p.is_submitted).map(p => p.trip_id)
  )

  // Combine and deduplicate
  const allTrips = [
    ...(organisedTrips || []),
    ...(memberTrips || []).map((m: any) => m.trips).filter(Boolean),
  ]
  const trips = allTrips.filter((trip, index, self) =>
    index === self.findIndex((t) => t.id === trip.id)
  )

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'

  if (!trips || trips.length === 0) {
    return (
      <div className="space-y-8">
        {/* Cactus welcome — no trips */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 animate-idle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cactus-mascot.svg" alt="TripAmigos mascot" width={70} height={93} className="w-[70px] h-auto" />
          </div>
          <div className="relative bg-white border border-border rounded-card p-4 shadow-sm mt-2 flex-1">
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-border" />
            <div className="absolute -left-[6px] top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white" />
            <p className="text-base font-semibold text-primary">Hola, {firstName}!</p>
            <p className="text-sm text-text-secondary mt-1">
              No trips yet — but that&apos;s about to change. Create your first trip and I&apos;ll help you get everyone sorted.
            </p>
          </div>
        </div>

        <div className="bg-accent-light border border-accent border-opacity-20 rounded-card p-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            Ready to plan a trip?
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Create a new trip, invite your friends, and start collecting their preferences.
          </p>
          <Link
            href="/trips/create"
            className="inline-block px-6 py-3 bg-accent text-white rounded-input font-medium hover:bg-accent-hover transition-colors"
          >
            Create your first trip
          </Link>
        </div>
      </div>
    )
  }

  // Split trips by role
  const organisedList = trips.filter(t => t.organiser_id === user.id)
  const attendeeList = trips.filter(t => t.organiser_id !== user.id)

  return (
    <div className="space-y-8">
      {/* Cactus greeting — contextual */}
      {(() => {
        const pendingPrefs = attendeeList.filter(t => !submittedTripIds.has(t.id)).length
        const bookedTrips = trips.filter(t => t.status === 'booked').length
        const collectingTrips = organisedList.filter(t => t.status === 'collecting').length
        const allResponded = organisedList.filter(t => {
          const total = t.trip_members?.length || 0
          const accepted = t.trip_members?.filter((m: any) => m.invite_status === 'accepted').length || 0
          return total > 0 && accepted === total
        })

        let message = `Hola, ${firstName}! You've got ${trips.length} trip${trips.length !== 1 ? 's' : ''} on the go.`

        if (pendingPrefs > 0) {
          message = `Hey ${firstName}! ${pendingPrefs} trip${pendingPrefs !== 1 ? 's need' : ' needs'} your preferences — don't be the one holding up the group!`
        } else if (allResponded.length > 0) {
          message = `${firstName}! The votes are in for ${allResponded[0].name} — time to pick the best options and book!`
        } else if (bookedTrips > 0 && collectingTrips > 0) {
          message = `${firstName}! ${bookedTrips} trip${bookedTrips !== 1 ? 's' : ''} booked, ${collectingTrips} still collecting votes. Looking busy!`
        } else if (bookedTrips > 0) {
          message = `${firstName}! ${bookedTrips} trip${bookedTrips !== 1 ? 's' : ''} booked and ready to go. Start packing!`
        } else if (collectingTrips > 0) {
          message = `Hey ${firstName}! Still waiting on some amigos to submit their preferences. Give them a nudge?`
        }

        return (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 animate-idle hidden sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cactus-mascot.svg" alt="TripAmigos mascot" width={60} height={80} className="w-[60px] h-auto" />
            </div>
            <div className="relative bg-white border border-border rounded-card p-4 shadow-sm mt-1 flex-1">
              <div className="absolute -left-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-border hidden sm:block" />
              <div className="absolute -left-[6px] top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white hidden sm:block" />
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-primary leading-relaxed">{message}</p>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href="/trips/create"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-input font-medium transition-colors text-xs"
                  >
                    <Plus size={14} /> New trip
                  </Link>
                  <Link
                    href="/expenses"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-accent hover:text-accent text-text-secondary rounded-input font-medium transition-colors text-xs"
                  >
                    <Receipt size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Trips you're attending (show first if action needed) */}
      {attendeeList.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Trips you're attending</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendeeList.map((trip) => {
              const hasSubmitted = submittedTripIds.has(trip.id)
              const isBooked = trip.status === 'booked'
              const actualMemberCount = trip.trip_members?.length || 0
              const acceptedCount = trip.trip_members?.filter((m: any) => m.invite_status === 'accepted').length || 0
              const startDate = new Date(trip.date_from)
              const endDate = new Date(trip.date_to)
              const destination = trip.booking_data?.destination

              if (isBooked) {
                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="relative overflow-hidden bg-gradient-to-br from-accent via-[#1d4ed8] to-[#7c3aed] border-0 rounded-card p-6 hover:shadow-xl transition-all duration-200 space-y-4 group text-white"
                  >
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-input w-fit backdrop-blur-sm">
                        <CheckCircle size={12} className="text-green-300" />
                        <span className="text-xs font-bold text-white">Trip booked!</span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{trip.name}</h3>
                        {destination && (
                          <p className="text-sm text-white/80 flex items-center gap-1.5">
                            <MapPin size={13} /> {destination}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-white/70">
                          <Calendar size={16} />
                          <span>{format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Users size={16} />
                          <span>{actualMemberCount} people going</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-input font-semibold text-sm group-hover:bg-white/30 transition-colors">
                        View trip details <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                )
              }

              return (
                <Link
                  key={trip.id}
                  href={hasSubmitted ? `/trips/${trip.id}` : `/trips/${trip.id}/submit`}
                  className={`bg-white border rounded-card p-6 hover:shadow-lg transition-all duration-200 space-y-4 group ${
                    !hasSubmitted ? 'border-accent ring-2 ring-accent/20' : 'border-border hover:border-accent'
                  }`}
                >
                  {/* Action badge */}
                  {!hasSubmitted && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-light rounded-input w-fit">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                      </span>
                      <span className="text-xs font-bold text-accent">Action needed</span>
                    </div>
                  )}

                  {hasSubmitted && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-input w-fit">
                      <CheckCircle size={12} className="text-green-600" />
                      <span className="text-xs font-bold text-green-700">Preferences submitted</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                      {trip.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                        Attendee
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar size={16} />
                      <span>{format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Users size={16} />
                      <span>{acceptedCount} of {actualMemberCount} members responded</span>
                    </div>
                  </div>

                  {!hasSubmitted ? (
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent text-white rounded-input font-semibold text-sm group-hover:bg-accent-hover transition-colors">
                      Submit my preferences <ArrowRight size={14} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-accent rounded-full h-full transition-all duration-300"
                          style={{ width: `${actualMemberCount > 0 ? (acceptedCount / actualMemberCount) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary text-right">
                        {actualMemberCount > 0 ? Math.round((acceptedCount / actualMemberCount) * 100) : 0}% of group done
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Trips you're organising */}
      <div className="space-y-4">
        {attendeeList.length > 0 && (
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Trips you're organising</h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organisedList.map((trip) => {
            const acceptedCount = trip.trip_members?.filter((m: any) => m.invite_status === 'accepted').length || 0
            const actualMemberCount = trip.trip_members?.length || 0
            const isBooked = trip.status === 'booked'
            const destination = trip.booking_data?.destination

            const startDate = new Date(trip.date_from)
            const endDate = new Date(trip.date_to)
            const isSameMonth = startDate.getMonth() === endDate.getMonth()

            if (isBooked) {
              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 border-0 rounded-card p-6 hover:shadow-xl transition-all duration-200 space-y-4 group text-white"
                >
                  <DeleteTripButton tripId={trip.id} tripName={trip.name} />
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white font-medium backdrop-blur-sm">
                        Organiser
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white font-medium backdrop-blur-sm flex items-center gap-1">
                        <CheckCircle size={10} /> Booked
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold pr-8">{trip.name}</h3>
                      {destination && (
                        <p className="text-sm text-white/80 flex items-center gap-1.5">
                          <MapPin size={13} /> {destination}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-white/70">
                        <Calendar size={16} />
                        <span>
                          {format(startDate, 'MMM d')}
                          {!isSameMonth && format(startDate, ', yyyy')}
                          {' – '}
                          {format(endDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <Users size={16} />
                        <span>{actualMemberCount} people going</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-input font-semibold text-sm group-hover:bg-white/30 transition-colors">
                      View trip details <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="relative bg-white border border-border rounded-card p-6 hover:border-accent hover:shadow-lg transition-all duration-200 space-y-4 group"
              >
                <DeleteTripButton tripId={trip.id} tripName={trip.name} />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors pr-8">
                    {trip.name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-accent-light text-accent font-medium">
                      Organiser
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      trip.status === 'collecting'
                        ? 'bg-info-bg text-info'
                        : trip.status === 'ready'
                          ? 'bg-warning-bg text-warning'
                          : 'bg-success-bg text-success'
                    }`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar size={16} />
                    <span>
                      {format(startDate, 'MMM d')}
                      {!isSameMonth && format(startDate, ', yyyy')}
                      {' – '}
                      {format(endDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Users size={16} />
                    <span>{acceptedCount} of {actualMemberCount} members responded</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-accent rounded-full h-full transition-all duration-300"
                      style={{ width: `${actualMemberCount > 0 ? (acceptedCount / actualMemberCount) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary text-right">
                    {actualMemberCount > 0 ? Math.round((acceptedCount / actualMemberCount) * 100) : 0}% done
                  </p>
                </div>
              </Link>
            )
          })}

          {/* New Trip Card */}
          <Link
            href="/trips/create"
            className="bg-bg-soft border-2 border-dashed border-border rounded-card p-6 hover:border-accent hover:bg-accent-light transition-all duration-200 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3 group"
          >
            <div className="w-12 h-12 bg-white group-hover:bg-accent group-hover:text-white rounded-full flex items-center justify-center transition-colors">
              <span className="text-2xl group-hover:text-white">+</span>
            </div>
            <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
              Create a new trip
            </h3>
            <p className="text-sm text-text-secondary">
              Plan your next adventure with friends
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
