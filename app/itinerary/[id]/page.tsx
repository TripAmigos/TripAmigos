import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function PublicItineraryPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, name, date_from, date_to, status, booking_data,
      trip_members ( id, first_name, last_name, guest_name, role )
    `)
    .eq('id', params.id)
    .eq('status', 'booked')
    .single()

  if (!trip || !trip.booking_data) {
    notFound()
  }

  const bookingData = trip.booking_data as any
  const startDate = new Date(trip.date_from)
  const endDate = new Date(trip.date_to)
  const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const members = (trip.trip_members || []) as any[]
  const itinerary = bookingData.itinerary || {}

  const typeConfig: Record<string, { bg: string; text: string }> = {
    activity: { bg: 'bg-purple-50', text: 'text-purple-700' },
    restaurant: { bg: 'bg-orange-50', text: 'text-orange-700' },
    note: { bg: 'bg-gray-50', text: 'text-gray-600' },
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent via-[#1d4ed8] to-[#7c3aed] text-white">
        <div className="max-w-2xl mx-auto px-6 py-10 text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">TripAmigos</p>
          <h1 className="text-3xl font-bold">{trip.name}</h1>
          {bookingData.destination && (
            <p className="text-lg text-white/80">{bookingData.destination}</p>
          )}
          <p className="text-sm text-white/60">
            {format(startDate, 'EEE d MMM')} – {format(endDate, 'EEE d MMM yyyy')} · {daysCount} days · {members.length} people
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Flights */}
        {bookingData.flights?.length > 0 && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-accent to-[#1d4ed8] px-5 py-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Travel details</h2>
            </div>
            {bookingData.flights.map((flight: any, i: number) => (
              <div key={i} className="p-5 space-y-3 border-b border-border last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">{flight.origin} → {flight.destination}</p>
                    <p className="text-sm text-text-secondary">{flight.airline}</p>
                  </div>
                  {flight.bookingReference && (
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted uppercase">Ref</p>
                      <p className="text-sm font-mono font-bold text-accent">{flight.bookingReference}</p>
                    </div>
                  )}
                </div>
                {flight.slices?.map((slice: any, si: number) => (
                  <div key={si} className="bg-bg-soft rounded-xl p-4 flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xl font-bold text-primary">
                        {slice.segments?.[0]?.departingAt ? format(new Date(slice.segments[0].departingAt), 'HH:mm') : '—'}
                      </p>
                      <p className="text-xs font-semibold text-accent">{slice.origin?.code || slice.segments?.[0]?.origin}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] text-text-muted">{slice.duration}</p>
                      <div className="w-full h-0.5 bg-accent/30 my-1.5 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                      </div>
                      <p className="text-[10px] text-text-secondary">{slice.isDirect ? 'Direct' : `${slice.stops} stop`}</p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-xl font-bold text-primary">
                        {slice.segments?.[slice.segments.length - 1]?.arrivingAt ? format(new Date(slice.segments[slice.segments.length - 1].arrivingAt), 'HH:mm') : '—'}
                      </p>
                      <p className="text-xs font-semibold text-accent">{slice.destination?.code || slice.segments?.[slice.segments.length - 1]?.destination}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Hotel */}
        {bookingData.hotel?.name && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#003580] to-[#00224f] px-5 py-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Accommodation</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xl font-bold text-primary">{bookingData.hotel.name}</p>
              {bookingData.hotel.address && (
                <p className="text-sm text-text-secondary">{bookingData.hotel.address}{bookingData.hotel.city ? `, ${bookingData.hotel.city}` : ''}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-bg-soft rounded-xl text-center">
                  <p className="text-[10px] text-text-muted uppercase">Check-in</p>
                  <p className="text-sm font-bold text-primary">{format(new Date(bookingData.hotel.checkIn), 'EEE d MMM')}</p>
                  <p className="text-[10px] text-text-muted">from 15:00</p>
                </div>
                <div className="p-2.5 bg-bg-soft rounded-xl text-center">
                  <p className="text-[10px] text-text-muted uppercase">Check-out</p>
                  <p className="text-sm font-bold text-primary">{format(new Date(bookingData.hotel.checkOut), 'EEE d MMM')}</p>
                  <p className="text-[10px] text-text-muted">by 11:00</p>
                </div>
                <div className="p-2.5 bg-bg-soft rounded-xl text-center">
                  <p className="text-[10px] text-text-muted uppercase">Rooms</p>
                  <p className="text-sm font-bold text-primary">{bookingData.hotel.rooms}</p>
                </div>
                <div className="p-2.5 bg-bg-soft rounded-xl text-center">
                  <p className="text-[10px] text-text-muted uppercase">Nights</p>
                  <p className="text-sm font-bold text-primary">{bookingData.hotel.nights || daysCount - 1}</p>
                </div>
              </div>
              {bookingData.hotel.bookingReference && (
                <p className="text-xs text-text-secondary">
                  Booking ref: <span className="font-mono font-bold text-primary">{bookingData.hotel.bookingReference}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Itinerary */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Itinerary</h2>
          </div>
          <div className="p-5 space-y-0">
            {Array.from({ length: daysCount }).map((_, i) => {
              const day = new Date(startDate)
              day.setDate(day.getDate() + i)
              const dateKey = format(day, 'yyyy-MM-dd')
              const isFirst = i === 0
              const isLast = i === daysCount - 1
              const dayEntries = itinerary[dateKey] || []

              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      isFirst || isLast ? 'bg-accent' : dayEntries.length > 0 ? 'bg-purple-500' : 'bg-border'
                    }`} />
                    {i < daysCount - 1 && <div className="w-0.5 flex-1 bg-border min-h-[20px]" />}
                  </div>
                  <div className="pb-4 min-w-0 -mt-0.5">
                    <p className="text-sm font-bold text-primary">Day {i + 1} · {format(day, 'EEE d MMM')}</p>
                    {isFirst && <p className="text-xs text-accent font-medium mt-0.5">Travel day · Check in</p>}
                    {isLast && <p className="text-xs text-accent font-medium mt-0.5">Check out · Return home</p>}
                    {dayEntries.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {dayEntries.map((entry: any, ei: number) => (
                          <div key={ei} className={`flex items-start gap-2 px-3 py-1.5 rounded-lg ${typeConfig[entry.type]?.bg || 'bg-gray-50'}`}>
                            {entry.time && <span className="text-xs font-mono font-bold text-primary">{entry.time}</span>}
                            <span className={`text-xs font-medium ${typeConfig[entry.type]?.text || 'text-primary'}`}>{entry.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {dayEntries.length === 0 && !isFirst && !isLast && (
                      <p className="text-xs text-text-muted mt-0.5 italic">No plans yet</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Who's going */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Who's going</h2>
          <div className="flex flex-wrap gap-2">
            {members.map((m: any) => {
              const name = m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.guest_name || 'Member'
              return (
                <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-bg-soft rounded-xl">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    m.role === 'organiser' ? 'bg-accent' : 'bg-primary'
                  }`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-primary">{name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted py-4">
          Planned with TripAmigos · tripamigos.co
        </p>
      </div>
    </div>
  )
}
