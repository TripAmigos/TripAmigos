'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Check, Copy, ArrowRight } from 'lucide-react'

interface TripCreatedSuccessProps {
  trip: any
  pendingInvites: any[]
}

export default function TripCreatedSuccess({ trip, pendingInvites }: TripCreatedSuccessProps) {
  const router = useRouter()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const startDate = new Date(trip.date_from)
  const endDate = new Date(trip.date_to)

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/invite/${token}`
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const copyAllLinks = () => {
    const text = pendingInvites
      .map((inv) => `${inv.invite_email}: ${getInviteLink(inv.invite_token)}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check size={28} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-primary">Trip created!</h1>
        <p className="text-text-secondary">
          <strong className="text-primary">{trip.name}</strong> is set up and ready to go. Now send your crew their invite links so they can submit their preferences.
        </p>
      </div>

      {/* Trip summary card */}
      <div className="bg-bg-soft rounded-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Dates</span>
          <span className="font-medium text-primary">{format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Group size</span>
          <span className="font-medium text-primary">{trip.group_size} people</span>
        </div>
        {trip.shortlisted_cities?.length > 0 && (
          <div className="flex justify-between text-sm items-start">
            <span className="text-text-secondary">Destinations</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
              {trip.shortlisted_cities.map((city: string) => (
                <span key={city} className="px-2 py-0.5 bg-accent-light text-accent rounded-full text-xs font-medium">
                  {city.split(',')[0]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite links section */}
      {pendingInvites.length > 0 && (
        <div className="bg-white border border-border rounded-card overflow-hidden">
          <div className="p-5 space-y-1 border-b border-border">
            <h2 className="font-bold text-primary flex items-center gap-2">
              Share invite links
            </h2>
            <p className="text-xs text-text-secondary">
              Copy each link and send it to the person — via WhatsApp, text, email, whatever works. They can join and submit their preferences straight away.
            </p>
          </div>

          <div className="divide-y divide-border">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                    {inv.invite_email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{inv.invite_email}</p>
                    <p className="text-[10px] text-text-muted truncate">
                      /invite/{inv.invite_token?.slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyLink(inv.invite_token)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-input text-xs font-semibold transition-all ${
                    copiedToken === inv.invite_token
                      ? 'bg-green-500 text-white'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {copiedToken === inv.invite_token ? (
                    <><Check size={12} /> Copied!</>
                  ) : (
                    <><Copy size={12} /> Copy link</>
                  )}
                </button>
              </div>
            ))}
          </div>

          {pendingInvites.length > 1 && (
            <div className="p-4 border-t border-border bg-bg-soft">
              <button
                onClick={copyAllLinks}
                className={`w-full py-2 rounded-input text-sm font-semibold transition-all ${
                  copiedAll
                    ? 'bg-green-500 text-white'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {copiedAll ? 'All links copied!' : 'Copy all links'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* What happens next */}
      <div className="bg-bg-soft rounded-card p-4 space-y-3">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">What happens next</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <p className="text-sm text-primary">Your crew clicks their link and submits their preferences</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/60 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <p className="text-sm text-primary">You'll see everyone's answers on your trip dashboard</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <p className="text-sm text-primary">We'll match the group and show you bookable options</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push(`/trips/${trip.id}`)}
        className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-card font-bold text-base flex items-center justify-center gap-2 transition-colors"
      >
        Go to trip dashboard <ArrowRight size={16} />
      </button>
    </div>
  )
}
