'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Check, Plane, Building2, ExternalLink, ArrowRight, Share2,
  Calendar, MapPin, Users, Receipt, PartyPopper, Copy, Mail
} from 'lucide-react'

interface BookedFlowProps {
  trip: any
  userId: string
  organiserName: string
  hotelUrl: string | null
}

export default function BookedFlow({ trip, userId, organiserName, hotelUrl }: BookedFlowProps) {
  const bookingData = trip.booking_data || {}
  const isOrganiser = trip.organiser_id === userId
  const members = trip.trip_members || []

  // Determine hotel URL from props or booking data
  const hotelBookingUrl = hotelUrl || bookingData.hotel?.bookingUrl || null

  // Step state
  const [hotelBooked, setHotelBooked] = useState(!hotelBookingUrl || bookingData.hotel?.confirmed)
  const [copiedLink, setCopiedLink] = useState(false)

  const flightsConfirmed = bookingData.status === 'booked' || bookingData.stripePaymentStatus === 'paid'
  const allDone = flightsConfirmed && hotelBooked

  const dateFrom = trip.date_from ? format(new Date(trip.date_from), 'EEE d MMM yyyy') : ''
  const dateTo = trip.date_to ? format(new Date(trip.date_to), 'EEE d MMM yyyy') : ''
  const destination = bookingData.destination || trip.shortlisted_cities?.[0] || 'your destination'
  const groupSize = trip.group_size || members.length || 0
  const flightCost = bookingData.totalCost || 0
  const hotelCost = bookingData.hotel?.totalPrice || 0

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/trips/${trip.id}`
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        {allDone ? (
          <div className="text-center space-y-3 pt-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <PartyPopper size={36} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-primary">You&apos;re all booked!</h1>
            <p className="text-text-secondary max-w-md mx-auto">
              {destination} is happening. Flights and hotel are sorted — now just count down the days.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3 pt-4">
            <h1 className="text-3xl font-bold text-primary">Almost there!</h1>
            <p className="text-text-secondary max-w-md mx-auto">
              Your flights are booked. Just one more step to complete your trip to {destination}.
            </p>
          </div>
        )}

        {/* Step tracker */}
        <div className="bg-white border border-border rounded-card overflow-hidden">

          {/* Step 1: Flights */}
          <div className="p-5 flex items-center gap-4 border-b border-border">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              flightsConfirmed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {flightsConfirmed
                ? <Check size={20} className="text-green-600" />
                : <Plane size={20} className="text-text-muted" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">Flights booked</p>
              <p className="text-xs text-text-secondary">
                {bookingData.flights?.length || 0} route{(bookingData.flights?.length || 0) !== 1 ? 's' : ''} confirmed
                {flightCost > 0 && ` · £${flightCost.toLocaleString()}`}
              </p>
            </div>
            {flightsConfirmed && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Done</span>
            )}
          </div>

          {/* Step 2: Hotel */}
          <div className={`p-5 border-b border-border ${!hotelBooked ? 'bg-blue-50/30' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                hotelBooked ? 'bg-green-100' : 'bg-[#003580]'
              }`}>
                {hotelBooked
                  ? <Check size={20} className="text-green-600" />
                  : <Building2 size={20} className="text-white" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">
                  {hotelBooked ? 'Hotel booked' : 'Book your hotel'}
                </p>
                {bookingData.hotel && (
                  <p className="text-xs text-text-secondary">
                    {bookingData.hotel.name}
                    {hotelCost > 0 && ` · £${hotelCost.toLocaleString()}`}
                    {bookingData.hotel.nights && ` · ${bookingData.hotel.nights} nights`}
                  </p>
                )}
              </div>
              {hotelBooked && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Done</span>
              )}
            </div>

            {!hotelBooked && hotelBookingUrl && (
              <div className="mt-4 space-y-3">
                <a
                  href={hotelBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#003580] hover:bg-[#00264d] text-white rounded-card font-bold text-base transition-colors"
                >
                  Book on Booking.com <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setHotelBooked(true)}
                  className="w-full text-sm text-text-secondary hover:text-primary transition-colors py-2"
                >
                  I&apos;ve booked my hotel →
                </button>
              </div>
            )}

            {!hotelBooked && !hotelBookingUrl && (
              <div className="mt-3">
                <button
                  onClick={() => setHotelBooked(true)}
                  className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  Mark hotel as booked
                </button>
              </div>
            )}
          </div>

          {/* Step 3: All done / Share */}
          <div className={`p-5 ${allDone ? 'bg-green-50/30' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                allDone ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {allDone
                  ? <Check size={20} className="text-green-600" />
                  : <Share2 size={20} className="text-text-muted" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">
                  {allDone ? 'Trip confirmed!' : 'Share with the group'}
                </p>
                <p className="text-xs text-text-secondary">
                  {allDone ? 'Everyone gets their confirmation by email' : 'Complete the steps above to finalise'}
                </p>
              </div>
              {allDone && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Done</span>
              )}
            </div>
          </div>
        </div>

        {/* Trip summary card — shows when all done */}
        {allDone && (
          <div className="bg-white border border-border rounded-card overflow-hidden">
            <div className="bg-gradient-to-r from-accent to-blue-500 p-5 text-white">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Your trip</p>
              <h2 className="text-xl font-bold mt-1">{trip.name}</h2>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Destination</p>
                  <p className="text-sm font-semibold text-primary">{destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Dates</p>
                  <p className="text-sm font-semibold text-primary">{dateFrom} — {dateTo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users size={16} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Group</p>
                  <p className="text-sm font-semibold text-primary">{groupSize} people</p>
                </div>
              </div>

              {(flightCost > 0 || hotelCost > 0) && (
                <div className="flex items-center gap-3">
                  <Receipt size={16} className="text-accent flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Total cost</p>
                    <p className="text-sm font-semibold text-primary">
                      £{(flightCost + hotelCost).toLocaleString()}
                      {groupSize > 0 && (
                        <span className="text-text-secondary font-normal"> · ~£{Math.round((flightCost + hotelCost) / groupSize).toLocaleString()} pp</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Flight details */}
              {bookingData.flights?.map((flight: any, i: number) => (
                <div key={i} className="flex items-center gap-3 pt-2 border-t border-border">
                  <Plane size={16} className="text-text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Flight {bookingData.flights.length > 1 ? i + 1 : ''}</p>
                    <p className="text-sm font-semibold text-primary">
                      {flight.airline} · {flight.origin} → {flight.destination}
                    </p>
                    {flight.bookingReference && (
                      <p className="text-xs text-accent font-medium">Ref: {flight.bookingReference}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Hotel details */}
              {bookingData.hotel && (
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <Building2 size={16} className="text-text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Hotel</p>
                    <p className="text-sm font-semibold text-primary">{bookingData.hotel.name}</p>
                    <p className="text-xs text-text-secondary">
                      {bookingData.hotel.rooms} room{bookingData.hotel.rooms !== 1 ? 's' : ''} · {bookingData.hotel.nights} nights
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {allDone && (
          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover text-white rounded-card font-medium transition-colors"
            >
              {copiedLink ? (
                <><Check size={16} /> Link copied!</>
              ) : (
                <><Copy size={16} /> Copy trip link to share with group</>
              )}
            </button>

            <Link
              href={`/trips/${trip.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 border border-border bg-white hover:bg-bg-soft text-primary rounded-card font-medium transition-colors"
            >
              View full trip dashboard <ArrowRight size={16} />
            </Link>

            <Link
              href={`/trips/${trip.id}/expenses`}
              className="w-full flex items-center justify-center gap-2 py-3 border border-border bg-white hover:bg-bg-soft text-primary rounded-card font-medium transition-colors"
            >
              <Receipt size={16} /> Set up expense tracking
            </Link>
          </div>
        )}

        {/* Support notice */}
        <div className="bg-bg-soft rounded-card p-4 space-y-2">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Need help after booking?</p>
          <div className="space-y-1.5">
            <p className="text-xs text-text-secondary">
              <span className="font-medium text-primary">Flights:</span> Contact your airline directly using the booking reference in your confirmation email.
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium text-primary">Hotel:</span> Contact Booking.com or the hotel using your Booking.com confirmation.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
