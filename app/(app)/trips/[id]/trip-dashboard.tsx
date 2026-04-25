'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { X, ArrowRight, Clock, UserPlus, Pencil, Trash2, Check, Gift, EyeOff, Loader, Info, Plane, Building2, Mail, RefreshCw, MapPin, Calendar, Star, Train, Car, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { regionLabels } from '@/lib/destinations'

interface Member {
  id: string
  member_id: string | null
  invite_status: string
  role: string
  invite_email: string | null
  invite_token: string | null
  guest_name?: string | null
  first_name?: string | null
  last_name?: string | null
  costs_covered?: boolean
  preferred_airport?: string | null
  invite_sent_at?: string | null
}

interface Preference {
  id: string
  member_id: string
  trip_member_id?: string | null
  nationality: string | null
  preferred_airport: string | null
  budget_min: number | null
  budget_max: number | null
  preferred_destinations: string[] | null
  accommodation_type: string | null
  accommodation_rating_min: number | null
  transport_preference: string | null
  direct_flights_only: boolean
  flight_time_preference: string | null
  dealbreakers: string[] | null
  must_haves: string[] | null
  is_submitted: boolean
}

interface TripDashboardProps {
  trip: any
  members: Member[]
  preferences: Preference[]
  userId: string
  userName?: string
}

// Simple horizontal bar component
function HorizontalBar({ label, count, total, color, icon }: { label: string; count: number; total: number; color: string; icon?: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-primary">{icon && `${icon} `}{label}</span>
        <span className="text-text-secondary">{count} {count === 1 ? 'person' : 'people'}</span>
      </div>
      <div className="w-full bg-border rounded-full h-6 overflow-hidden">
        <div
          className={`${color} rounded-full h-full transition-all duration-300 ease-out flex items-center`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          {pct >= 20 && <span className="text-white text-[10px] font-bold ml-2">{Math.round(pct)}%</span>}
        </div>
      </div>
    </div>
  )
}

// Circular progress ring
function ProgressRing({ value, max, size = 120, label, sublabel }: { value: number; max: number; size?: number; label: string; sublabel: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={pct === 100 ? '#22c55e' : '#2563eb'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">{value}/{max}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-primary mt-2">{label}</p>
      <p className="text-xs text-text-secondary">{sublabel}</p>
    </div>
  )
}

// Destination popularity chip
function DestinationChip({ name, count, isTop }: { name: string; count: number; isTop: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
      isTop ? 'bg-accent text-white shadow-sm' : 'bg-bg-soft text-primary border border-border'
    }`}>
      {isTop && <span className="text-xs font-bold">★</span>}
      {name}
      <span className={`text-xs ${isTop ? 'text-white/80' : 'text-text-secondary'}`}>×{count}</span>
    </span>
  )
}

export default function TripDashboard({ trip, members: initialMembers, preferences, userId, userName }: TripDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justBooked = searchParams.get('booked') === 'true'
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [showBookedBanner, setShowBookedBanner] = useState(justBooked)
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'members'>('overview')
  const [nudgedMembers, setNudgedMembers] = useState<string[]>([])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [showInviteLinks, setShowInviteLinks] = useState(false)

  // Attendee management state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFirstName, setAddFirstName] = useState('')
  const [addLastName, setAddLastName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addCostsCovered, setAddCostsCovered] = useState(false)
  const [addRole, setAddRole] = useState<'attendee' | 'surprise'>('attendee')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailSentIds, setEmailSentIds] = useState<string[]>([])

  // Booking data
  const bookingData = trip.booking_data || null

  // Editable itinerary state
  const [itinerary, setItinerary] = useState<Record<string, { time?: string; text: string; type: 'activity' | 'restaurant' | 'note' }[]>>(
    bookingData?.itinerary || {}
  )
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState({ time: '', text: '', type: 'activity' as 'activity' | 'restaurant' | 'note' })
  const [savingItinerary, setSavingItinerary] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const addItineraryEntry = (dateKey: string) => {
    if (!newEntry.text.trim()) return
    const updated = { ...itinerary }
    if (!updated[dateKey]) updated[dateKey] = []
    updated[dateKey] = [...updated[dateKey], { time: newEntry.time || undefined, text: newEntry.text.trim(), type: newEntry.type }]
    setItinerary(updated)
    setNewEntry({ time: '', text: '', type: 'activity' })
  }

  const removeItineraryEntry = (dateKey: string, index: number) => {
    const updated = { ...itinerary }
    updated[dateKey] = updated[dateKey].filter((_, i) => i !== index)
    if (updated[dateKey].length === 0) delete updated[dateKey]
    setItinerary(updated)
  }

  const saveItinerary = async () => {
    setSavingItinerary(true)
    const updated = { ...bookingData, itinerary }
    await supabase.from('trips').update({ booking_data: updated }).eq('id', trip.id)
    setSavingItinerary(false)
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Send invite email to a member
  const handleSendInviteEmail = async (memberId: string, isResend = false) => {
    setSendingEmailId(memberId)
    try {
      const endpoint = isResend ? '/api/invites/resend' : '/api/invites/send'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripMemberId: memberId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setEmailSentIds(prev => [...prev, memberId])
      // Update the member's invite_sent_at locally
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, invite_sent_at: new Date().toISOString() } : m
      ))
    } catch (err: any) {
      console.error('Email send error:', err)
      alert(`Failed to send email: ${err.message}`)
    }
    setSendingEmailId(null)
  }

  // --- Attendee management handlers ---

  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')

    if (!addFirstName.trim() || !addLastName.trim()) {
      setAddError('First and last name are required')
      return
    }
    if (!addEmail.trim() || !addEmail.includes('@')) {
      setAddError('Please enter a valid email address')
      return
    }

    setAddLoading(true)

    // Generate a simple invite token
    const inviteToken = crypto.randomUUID()

    const { data, error } = await supabase
      .from('trip_members')
      .insert({
        trip_id: trip.id,
        member_id: null,
        first_name: addFirstName.trim(),
        last_name: addLastName.trim(),
        invite_email: addEmail.trim().toLowerCase(),
        guest_name: `${addFirstName.trim()} ${addLastName.trim()}`,
        role: addRole,
        invite_status: addRole === 'surprise' ? 'accepted' : 'pending',
        invite_token: inviteToken,
        costs_covered: addCostsCovered,
      })
      .select()
      .single()

    setAddLoading(false)

    if (error) {
      setAddError(error.message)
    } else {
      const newMember = data as Member
      setMembers(prev => [...prev, newMember])
      setAddFirstName('')
      setAddLastName('')
      setAddEmail('')
      setAddCostsCovered(false)
      setAddRole('attendee')
      setShowAddForm(false)

      // Auto-send invite email (non-blocking — don't wait for it)
      if (addRole !== 'surprise' && addEmail.trim()) {
        handleSendInviteEmail(newMember.id).catch(() => {})
      }
    }
  }

  const startEditing = (member: Member) => {
    setEditingMemberId(member.id)
    setEditFirstName(member.first_name || member.guest_name?.split(' ')[0] || '')
    setEditLastName(member.last_name || member.guest_name?.split(' ').slice(1).join(' ') || '')
    setEditEmail(member.invite_email || '')
  }

  const handleSaveEdit = async (memberId: string) => {
    setEditLoading(true)

    const { error } = await supabase
      .from('trip_members')
      .update({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        invite_email: editEmail.trim().toLowerCase(),
        guest_name: `${editFirstName.trim()} ${editLastName.trim()}`,
      })
      .eq('id', memberId)

    setEditLoading(false)

    if (!error) {
      setMembers(prev => prev.map(m =>
        m.id === memberId
          ? { ...m, first_name: editFirstName.trim(), last_name: editLastName.trim(), invite_email: editEmail.trim().toLowerCase(), guest_name: `${editFirstName.trim()} ${editLastName.trim()}` }
          : m
      ))
      setEditingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setRemoveLoading(true)

    // Also delete their preferences if they exist
    const member = members.find(m => m.id === memberId)
    if (member?.member_id) {
      await supabase.from('member_preferences').delete().eq('member_id', member.member_id)
    }

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('id', memberId)

    setRemoveLoading(false)

    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      setRemovingMemberId(null)
    }
  }

  const getMemberDisplayName = (member: Member) => {
    // If this is the current user and we have their profile name, use it
    if (member.member_id === userId && userName) return userName
    if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`
    if (member.first_name) return member.first_name
    if (member.guest_name) return member.guest_name
    if (member.invite_email) return member.invite_email
    return 'Invited member'
  }

  const submittedCount = preferences.filter(p => p.is_submitted).length
  const totalInvited = members.length
  const acceptedCount = members.filter(m => m.invite_status === 'accepted').length
  const pendingCount = totalInvited - acceptedCount

  const startDate = new Date(trip.date_from)
  const endDate = new Date(trip.date_to)
  const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const isOrganiser = trip.organiser_id === userId

  // Aggregate preference data (memoised so it doesn't recompute on every tab switch)
  const {
    accommodationCounts, transportCounts, flightTimeCounts, destinationCounts,
    budgets, mustHavesAll, dealbreakersAll, directFlightVotes,
    sortedDestinations, topDestination,
    budgetOverlapMin, budgetOverlapMax, hasBudgetOverlap,
  } = useMemo(() => {
    const acc: Record<string, number> = {}
    const trans: Record<string, number> = {}
    const flight: Record<string, number> = {}
    const dest: Record<string, number> = {}
    const bud: { min: number; max: number }[] = []
    const mh: Record<string, number> = {}
    const db: Record<string, number> = {}
    let dfv = 0

    preferences.filter(p => p.is_submitted).forEach((p) => {
      if (p.accommodation_type) acc[p.accommodation_type] = (acc[p.accommodation_type] || 0) + 1
      if (p.transport_preference) trans[p.transport_preference] = (trans[p.transport_preference] || 0) + 1
      if (p.flight_time_preference) flight[p.flight_time_preference] = (flight[p.flight_time_preference] || 0) + 1
      if (p.preferred_destinations) p.preferred_destinations.forEach((d) => { dest[d] = (dest[d] || 0) + 1 })
      if (p.budget_min != null && p.budget_max != null) bud.push({ min: p.budget_min, max: p.budget_max })
      if (p.must_haves) p.must_haves.forEach((m) => { mh[m] = (mh[m] || 0) + 1 })
      if (p.dealbreakers) p.dealbreakers.forEach((d) => { db[d] = (db[d] || 0) + 1 })
      if (p.direct_flights_only) dfv++
    })

    const sorted = Object.entries(dest).sort((a, b) => b[1] - a[1])
    const overlapMin = bud.length > 0 ? Math.max(...bud.map(b => b.min)) : 0
    const overlapMax = bud.length > 0 ? Math.min(...bud.map(b => b.max)) : 0

    return {
      accommodationCounts: acc, transportCounts: trans, flightTimeCounts: flight,
      destinationCounts: dest, budgets: bud, mustHavesAll: mh, dealbreakersAll: db,
      directFlightVotes: dfv, sortedDestinations: sorted, topDestination: sorted[0],
      budgetOverlapMin: overlapMin, budgetOverlapMax: overlapMax,
      hasBudgetOverlap: overlapMin <= overlapMax && bud.length > 0,
    }
  }, [preferences])

  const accommodationLabels: Record<string, { label: string; icon: string }> = {
    hotel: { label: 'Hotel', icon: '' },
    apartment: { label: 'Apartment', icon: '' },
    villa: { label: 'Villa', icon: '' },
    hostel: { label: 'Hostel', icon: '' },
    resort: { label: 'Resort', icon: '' },
    no_preference: { label: 'No preference', icon: '' },
  }

  const transportLabels: Record<string, { label: string; icon: string }> = {
    flight: { label: 'Fly', icon: '' },
    train: { label: 'Train', icon: '' },
    drive: { label: 'Drive', icon: '' },
    no_preference: { label: 'Any', icon: '' },
  }

  const flightTimeLabels: Record<string, string> = {
    early_morning: 'Early morning',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  }

  const submitted = submittedCount
  const total = totalInvited

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#0f2640] rounded-card p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
                {isOrganiser ? 'You\'re organising' : 'You\'re attending'}
              </p>
              <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <span>{format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}</span>
                <span>·</span>
                <span>{daysCount} days</span>
                <span>·</span>
                <span className="capitalize">{trip.trip_types?.[0] || 'Trip'}</span>
              </div>
            </div>
            {daysUntil > 0 && (
              <div className="text-right">
                <p className="text-3xl font-bold">{daysUntil}</p>
                <p className="text-xs text-white/60">days to go</p>
              </div>
            )}
          </div>

          {/* Quick stat pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
              {trip.payment_method === 'organiser_pays' ? 'One card' : 'Individual payments'}
            </span>
            {trip.destination_scope && trip.destination_scope !== 'anywhere' && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
                {regionLabels[trip.destination_scope as keyof typeof regionLabels] || trip.destination_scope}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              trip.status === 'collecting' ? 'bg-blue-400/20 text-blue-200' :
              trip.status === 'ready' ? 'bg-amber-400/20 text-amber-200' :
              'bg-green-400/20 text-green-200'
            }`}>
              {trip.status === 'collecting' ? 'Collecting preferences' :
               trip.status === 'ready' ? 'Ready to book' : 'Booked'}
            </span>
          </div>
        </div>
        {/* Background decorative circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 -bottom-10 w-28 h-28 rounded-full bg-white/5" />
      </div>

      {/* Post-booking confirmation banner */}
      {showBookedBanner && (
        <div className="bg-green-50 border border-green-200 rounded-card overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-800">Trip booked!</h2>
                  <p className="text-sm text-green-700 mt-1">
                    Everyone in your group will receive their booking confirmations by email. You're all set!
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBookedBanner(false)} className="text-green-400 hover:text-green-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="border-t border-green-200 pt-4">
              <div className="flex items-start gap-2 mb-3">
                <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-primary">Need help after booking? Contact the provider directly</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-card border border-green-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Plane size={16} className="text-accent" />
                    <p className="text-sm font-bold text-primary">Flight queries</p>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    For changes, cancellations, baggage, seat selection, or any flight issues — contact your airline directly. Your booking reference is in the confirmation email.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-card border border-green-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#003580]" />
                    <p className="text-sm font-bold text-primary">Hotel queries</p>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    For room changes, cancellations, check-in times, or any hotel issues — contact Booking.com or the hotel directly via your Booking.com confirmation.
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-3 text-center">
                TripAmigos helps you plan and book group trips — once booked, your reservations are directly with the airline and hotel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ ATTENDEE VIEW (pre-booking only — booked view is shared above) ============ */}
      {!isOrganiser && trip.status !== 'booked' && (
        <div className="space-y-6">
          {/* Trip status card */}
          <div className="bg-white border border-border rounded-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Trip status</h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                trip.status === 'collecting' ? 'bg-blue-500 animate-pulse' :
                trip.status === 'ready' ? 'bg-amber-500' : 'bg-green-500'
              }`} />
              <p className="text-sm font-medium text-primary">
                {trip.status === 'collecting'
                  ? `Collecting preferences — ${submittedCount} of ${totalInvited} submitted`
                  : trip.status === 'ready'
                  ? 'All preferences in — the organiser is reviewing options'
                  : 'Trip booked! Check below for your details'}
              </p>
            </div>
            {trip.status === 'collecting' && (
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent rounded-full h-full transition-all duration-500"
                  style={{ width: `${totalInvited > 0 ? (submittedCount / totalInvited) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>

          {/* Destination voting — anonymized */}
          {(trip.shortlisted_cities?.length > 0 || sortedDestinations.length > 0) && (
            <div className="bg-white border border-border rounded-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Where the group wants to go</h3>
                {topDestination && topDestination[1] > 1 && (
                  <span className="text-xs px-2 py-1 bg-accent-light text-accent rounded-full font-medium">
                    {topDestination[0].split(', ')[0]} is leading!
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {(trip.shortlisted_cities || []).map((city: string) => {
                  const votes = destinationCounts[city] || 0
                  const maxVotes = sortedDestinations.length > 0 ? sortedDestinations[0][1] : 0
                  const isLeader = votes > 0 && votes === maxVotes
                  const pct = submittedCount > 0 ? (votes / submittedCount) * 100 : 0

                  return (
                    <div key={city} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isLeader && votes > 1 ? (
                            <span className="text-sm font-bold text-accent">●</span>
                          ) : votes > 0 ? (
                            <span className="text-sm text-primary">●</span>
                          ) : (
                            <span className="text-sm text-text-muted">○</span>
                          )}
                          <span className={`text-sm font-medium ${isLeader ? 'text-accent' : votes > 0 ? 'text-primary' : 'text-text-muted'}`}>
                            {city.split(', ')[0]}
                          </span>
                          <span className="text-xs text-text-secondary">{city.split(', ')[1]}</span>
                        </div>
                        <span className={`text-xs font-bold ${isLeader ? 'text-accent' : 'text-text-secondary'}`}>
                          {votes} {votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-4 overflow-hidden">
                        <div
                          className={`${isLeader ? 'bg-accent' : votes > 0 ? 'bg-accent/40' : 'bg-transparent'} rounded-full h-full transition-all duration-300 ease-out`}
                          style={{ width: `${Math.max(pct, votes > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {submittedCount > 0 && (
                <p className="text-xs text-text-secondary pt-1">
                  Based on {submittedCount} of {totalInvited} responses so far
                </p>
              )}
            </div>
          )}

          {/* Accommodation & transport summaries */}
          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(accommodationCounts).length > 0 && (
              <div className="bg-white border border-border rounded-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Accommodation votes</h3>
                <div className="space-y-3">
                  {Object.entries(accommodationCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <HorizontalBar
                        key={type}
                        label={accommodationLabels[type]?.label || type}
                        icon={accommodationLabels[type]?.icon}
                        count={count}
                        total={submittedCount}
                        color={count === Math.max(...Object.values(accommodationCounts)) ? 'bg-accent' : 'bg-accent/40'}
                      />
                    ))}
                </div>
              </div>
            )}

            {Object.keys(transportCounts).length > 0 && (
              <div className="bg-white border border-border rounded-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Travel votes</h3>
                <div className="space-y-3">
                  {Object.entries(transportCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <HorizontalBar
                        key={type}
                        label={transportLabels[type]?.label || type}
                        icon={transportLabels[type]?.icon}
                        count={count}
                        total={submittedCount}
                        color={count === Math.max(...Object.values(transportCounts)) ? 'bg-blue-500' : 'bg-blue-500/40'}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget sweet spot */}
          {budgets.length > 0 && (
            <div className="bg-white border border-border rounded-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Group budget range</h3>
              {hasBudgetOverlap ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-accent">£{budgetOverlapMin}</span>
                    <span className="text-text-secondary mx-1">–</span>
                    <span className="text-3xl font-bold text-accent">£{budgetOverlapMax}</span>
                    <span className="text-sm text-text-secondary ml-2">per person</span>
                  </div>
                  <p className="text-xs text-text-secondary">This is where everyone's budget overlaps</p>
                </div>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-input">
                  Budgets don't fully overlap yet — the organiser may reach out to discuss.
                </p>
              )}
            </div>
          )}

          {/* Your preferences summary */}
          {(() => {
            const myMember = members.find(m => m.member_id === userId)
            const myPref = myMember
              ? preferences.find(p => p.member_id === myMember.member_id || p.trip_member_id === myMember.id)
              : null

            if (myPref?.is_submitted) {
              return (
                <div className="bg-white border border-green-200 rounded-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Your preferences</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {myPref.preferred_destinations && myPref.preferred_destinations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-text-secondary uppercase">Destinations</p>
                        <p className="text-sm text-primary font-medium">
                          {myPref.preferred_destinations.slice(0, 3).map(d => d.split(', ')[0]).join(', ')}
                          {myPref.preferred_destinations.length > 3 ? ` +${myPref.preferred_destinations.length - 3}` : ''}
                        </p>
                      </div>
                    )}
                    {myPref.accommodation_type && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-text-secondary uppercase">Stay</p>
                        <p className="text-sm text-primary font-medium capitalize">{accommodationLabels[myPref.accommodation_type]?.label || myPref.accommodation_type}</p>
                      </div>
                    )}
                    {myPref.budget_min != null && myPref.budget_max != null && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-text-secondary uppercase">Budget</p>
                        <p className="text-sm text-primary font-medium">£{myPref.budget_min} – £{myPref.budget_max}</p>
                      </div>
                    )}
                    {myPref.transport_preference && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-text-secondary uppercase">Travel</p>
                        <p className="text-sm text-primary font-medium">{transportLabels[myPref.transport_preference]?.label || myPref.transport_preference}</p>
                      </div>
                    )}
                  </div>
                  {myPref.preferred_airport && (
                    <p className="text-xs text-text-secondary">Flying from <span className="font-medium text-primary">{myPref.preferred_airport}</span></p>
                  )}
                </div>
              )
            } else {
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-card p-6 text-center space-y-3">
                  <Clock size={32} className="text-amber-500 mx-auto" />
                  <p className="text-lg font-semibold text-primary">You haven't submitted your preferences yet</p>
                  <p className="text-sm text-text-secondary">Check your email for the invite link, or ask the organiser to resend it.</p>
                </div>
              )
            }
          })()}

          {/* ===== POST-BOOKING ITINERARY (attendee) ===== */}
          {trip.status === 'booked' && bookingData && (
            <div className="space-y-4">
              {/* Booked confirmation */}
              <div className="bg-green-50 border border-green-200 rounded-card p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-800">Your trip is booked!</p>
                  <p className="text-sm text-green-700">
                    Everything's confirmed for {bookingData.destination || 'your trip'}. Here are your details.
                  </p>
                </div>
              </div>

              {/* Flight / transport details */}
              {bookingData.flights?.length > 0 && (
                <div className="bg-white border border-border rounded-card overflow-hidden">
                  <div className="px-5 pt-5 pb-3">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <Plane size={14} className="text-accent" /> Your travel
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {bookingData.flights.map((flight: any, i: number) => {
                      // Find this attendee's name in the passengers
                      const myMember = members.find(m => m.member_id === userId)
                      const myName = myMember ? getMemberDisplayName(myMember) : ''
                      const isOnThisFlight = flight.passengers?.some((p: string) =>
                        p.toLowerCase() === myName.toLowerCase() ||
                        p.toLowerCase().includes(myName.split(' ')[0]?.toLowerCase() || '___')
                      )

                      if (!isOnThisFlight && flight.passengers?.length > 0) return null

                      return (
                        <div key={i} className="px-5 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {flight.mode === 'train' ? <Train size={16} className="text-accent" /> : flight.mode === 'drive' ? <Car size={16} className="text-accent" /> : <Plane size={16} className="text-accent" />}
                              <p className="text-sm font-semibold text-primary">
                                {flight.origin} → {flight.destination}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-accent">{flight.airline || flight.mode}</span>
                          </div>

                          {/* Flight slices (outbound + return) */}
                          {flight.slices?.map((slice: any, si: number) => (
                            <div key={si} className="flex items-center gap-4 p-3 bg-bg-soft rounded-input">
                              <div className="text-center min-w-[60px]">
                                <p className="text-lg font-bold text-primary">
                                  {slice.segments?.[0]?.departingAt
                                    ? format(new Date(slice.segments[0].departingAt), 'HH:mm')
                                    : '—'}
                                </p>
                                <p className="text-[10px] text-text-secondary uppercase">
                                  {slice.origin?.code || slice.segments?.[0]?.origin}
                                </p>
                              </div>
                              <div className="flex-1 flex flex-col items-center">
                                <p className="text-[10px] text-text-muted">{slice.duration || ''}</p>
                                <div className="w-full h-px bg-border relative my-1">
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                                </div>
                                <p className="text-[10px] text-text-muted">
                                  {slice.stops === 0 || slice.isDirect ? 'Direct' : `${slice.stops} stop${slice.stops > 1 ? 's' : ''}`}
                                </p>
                              </div>
                              <div className="text-center min-w-[60px]">
                                <p className="text-lg font-bold text-primary">
                                  {slice.segments?.[slice.segments.length - 1]?.arrivingAt
                                    ? format(new Date(slice.segments[slice.segments.length - 1].arrivingAt), 'HH:mm')
                                    : '—'}
                                </p>
                                <p className="text-[10px] text-text-secondary uppercase">
                                  {slice.destination?.code || slice.segments?.[slice.segments.length - 1]?.destination}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Train journeys */}
                          {flight.mode === 'train' && flight.outbound && (
                            <div className="space-y-2">
                              {[{ label: 'Outbound', journey: flight.outbound }, { label: 'Return', journey: flight.returnJourney }]
                                .filter(j => j.journey)
                                .map(({ label, journey }) => (
                                  <div key={label} className="flex items-center gap-4 p-3 bg-bg-soft rounded-input">
                                    <div className="text-center min-w-[60px]">
                                      <p className="text-lg font-bold text-primary">
                                        {journey.departureTime ? format(new Date(journey.departureTime), 'HH:mm') : '—'}
                                      </p>
                                      <p className="text-[10px] text-text-secondary">{journey.departureStation}</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center">
                                      <p className="text-[10px] text-text-muted">{label}</p>
                                      <div className="w-full h-px bg-border my-1" />
                                      <p className="text-[10px] text-text-muted">{journey.changes > 0 ? `${journey.changes} change${journey.changes > 1 ? 's' : ''}` : 'Direct'}</p>
                                    </div>
                                    <div className="text-center min-w-[60px]">
                                      <p className="text-lg font-bold text-primary">
                                        {journey.arrivalTime ? format(new Date(journey.arrivalTime), 'HH:mm') : '—'}
                                      </p>
                                      <p className="text-[10px] text-text-secondary">{journey.arrivalStation}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          {flight.bookingReference && (
                            <p className="text-xs text-text-secondary">
                              Booking ref: <span className="font-mono font-bold text-primary">{flight.bookingReference}</span>
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Hotel details */}
              {bookingData.hotel && bookingData.hotel.name && (
                <div className="bg-white border border-border rounded-card p-5 space-y-3">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={14} className="text-accent" /> Your accommodation
                  </h3>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-primary">{bookingData.hotel.name}</p>
                    {bookingData.hotel.starRating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: bookingData.hotel.starRating }).map((_, i) => (
                          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                    {bookingData.hotel.address && (
                      <p className="text-sm text-text-secondary flex items-center gap-1.5">
                        <MapPin size={13} className="text-text-muted flex-shrink-0" /> {bookingData.hotel.address}{bookingData.hotel.city ? `, ${bookingData.hotel.city}` : ''}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-bg-soft rounded-input">
                        <p className="text-[10px] text-text-secondary uppercase font-medium">Check-in</p>
                        <p className="text-sm font-semibold text-primary">{format(new Date(bookingData.hotel.checkIn), 'EEE d MMM yyyy')}</p>
                      </div>
                      <div className="p-3 bg-bg-soft rounded-input">
                        <p className="text-[10px] text-text-secondary uppercase font-medium">Check-out</p>
                        <p className="text-sm font-semibold text-primary">{format(new Date(bookingData.hotel.checkOut), 'EEE d MMM yyyy')}</p>
                      </div>
                    </div>
                    {bookingData.hotel.roomType && (
                      <p className="text-xs text-text-secondary">
                        {bookingData.hotel.rooms} × {bookingData.hotel.roomType} · {bookingData.hotel.nights || Math.ceil((new Date(bookingData.hotel.checkOut).getTime() - new Date(bookingData.hotel.checkIn).getTime()) / (1000*60*60*24))} nights
                      </p>
                    )}
                    {bookingData.hotel.bookingReference && (
                      <p className="text-xs text-text-secondary">
                        Booking ref: <span className="font-mono font-bold text-primary">{bookingData.hotel.bookingReference}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Day-by-day itinerary */}
              <div className="bg-white border border-border rounded-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} className="text-accent" /> Trip itinerary
                </h3>
                <div className="space-y-0">
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = new Date(startDate)
                    day.setDate(day.getDate() + i)
                    const isFirst = i === 0
                    const isLast = i === daysCount - 1

                    return (
                      <div key={i} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            isFirst || isLast ? 'bg-accent' : 'bg-border'
                          }`} />
                          {i < daysCount - 1 && <div className="w-px flex-1 bg-border" />}
                        </div>
                        {/* Day content */}
                        <div className="pb-4 min-w-0">
                          <p className="text-xs font-bold text-primary">
                            {format(day, 'EEE d MMM')}
                            {isFirst && <span className="ml-2 text-accent font-semibold">— Travel day</span>}
                            {isLast && <span className="ml-2 text-accent font-semibold">— Return day</span>}
                          </p>
                          {isFirst && (
                            <p className="text-xs text-text-secondary mt-0.5">
                              {bookingData.flights?.[0]
                                ? `${bookingData.flights[0].origin} → ${bookingData.flights[0].destination}`
                                : `Arrive in ${bookingData.destination || 'destination'}`}
                              {bookingData.hotel?.name ? ` · Check in to ${bookingData.hotel.name}` : ''}
                            </p>
                          )}
                          {isLast && (
                            <p className="text-xs text-text-secondary mt-0.5">
                              {bookingData.hotel?.name ? `Check out of ${bookingData.hotel.name} · ` : ''}
                              {bookingData.flights?.[0]
                                ? `${bookingData.flights[0].destination} → ${bookingData.flights[0].origin}`
                                : `Depart ${bookingData.destination || 'destination'}`}
                            </p>
                          )}
                          {!isFirst && !isLast && (
                            <p className="text-xs text-text-secondary mt-0.5">Free day in {bookingData.destination || 'destination'}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* No data yet state */}
          {submittedCount === 0 && trip.status !== 'booked' && (
            <div className="bg-bg-soft border border-border rounded-card p-8 text-center space-y-3">
              <p className="text-4xl font-light text-text-muted">—</p>
              <p className="text-lg font-semibold text-primary">No votes yet</p>
              <p className="text-sm text-text-secondary">Charts will appear here as people submit their preferences</p>
            </div>
          )}
        </div>
      )}

      {/* ============ ORGANISER VIEW ============ */}

      {/* ============ BOOKED VIEW (both organiser + attendee) ============ */}
      {trip.status === 'booked' && bookingData && (
        <div className="space-y-5">
          {/* Celebration header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-card p-6 text-white text-center">
            <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute left-1/4 -top-4 w-16 h-16 rounded-full bg-white/5" />
            <div className="relative z-10 space-y-2">
              <p className="text-4xl">&#9992;&#65039;</p>
              <h2 className="text-2xl font-bold">You're going to {bookingData.destination}!</h2>
              <p className="text-sm text-white/80">
                {format(startDate, 'EEE d MMM')} – {format(endDate, 'EEE d MMM yyyy')} · {daysCount} days · {members.length} people
              </p>
            </div>
          </div>

          {/* Share trip button (organiser only) */}
          {isOrganiser && (
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-full py-3 bg-white border border-border rounded-card font-semibold text-sm text-primary hover:border-accent hover:shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight size={14} className="rotate-[-45deg]" /> Share trip with your group
              </button>
              {showShareMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-card shadow-lg p-4 space-y-3 z-20">
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/itinerary/${trip.id}`
                      navigator.clipboard.writeText(link)
                      setLinkCopied(true)
                      setTimeout(() => setLinkCopied(false), 2000)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-input hover:bg-bg-soft transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
                      <ArrowRight size={16} className="text-accent rotate-[-45deg]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{linkCopied ? 'Link copied!' : 'Copy shareable link'}</p>
                      <p className="text-xs text-text-secondary">Anyone with the link can view the itinerary — no account needed</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      setGeneratingPdf(true)
                      try {
                        const res = await fetch(`/api/itinerary/pdf?tripId=${trip.id}`)
                        if (!res.ok) throw new Error('Failed to generate PDF')
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${trip.name.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.pdf`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch (err) {
                        console.error('PDF generation error:', err)
                        alert('Could not generate PDF. Please try the shareable link instead.')
                      }
                      setGeneratingPdf(false)
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-input hover:bg-bg-soft transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      {generatingPdf ? <Loader size={16} className="text-purple-600 animate-spin" /> : <Info size={16} className="text-purple-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{generatingPdf ? 'Generating PDF...' : 'Download PDF'}</p>
                      <p className="text-xs text-text-secondary">Branded PDF with flights, hotel and itinerary to share</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Flight / transport card */}
          {bookingData.flights?.length > 0 && (
            <div className="bg-white border border-border rounded-card overflow-hidden">
              <div className="bg-gradient-to-r from-accent to-[#1d4ed8] px-5 py-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plane size={14} /> Travel details
                </h3>
              </div>
              <div className="divide-y divide-border">
                {bookingData.flights.map((flight: any, i: number) => (
                  <div key={i} className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-primary">{flight.origin} → {flight.destination}</p>
                        <p className="text-sm text-text-secondary">{flight.airline} · {flight.passengers?.length || 0} passengers</p>
                      </div>
                      {flight.bookingReference && (
                        <div className="text-right">
                          <p className="text-[10px] text-text-muted uppercase">Booking ref</p>
                          <p className="text-base font-mono font-bold text-accent">{flight.bookingReference}</p>
                        </div>
                      )}
                    </div>

                    {/* Flight slices */}
                    {flight.slices?.map((slice: any, si: number) => (
                      <div key={si} className="bg-bg-soft rounded-card p-4">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                          {si === 0 ? 'Outbound' : 'Return'}
                          {slice.segments?.[0]?.departingAt && ` · ${format(new Date(slice.segments[0].departingAt), 'EEE d MMM')}`}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[70px]">
                            <p className="text-2xl font-bold text-primary">
                              {slice.segments?.[0]?.departingAt
                                ? format(new Date(slice.segments[0].departingAt), 'HH:mm')
                                : '—'}
                            </p>
                            <p className="text-xs font-semibold text-accent mt-0.5">
                              {slice.origin?.code || slice.segments?.[0]?.origin}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                              {slice.origin?.name || ''}
                            </p>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-2">
                            <p className="text-xs text-text-muted font-medium">{slice.duration || ''}</p>
                            <div className="w-full relative my-2">
                              <div className="w-full h-0.5 bg-accent/30" />
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white" />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white" />
                              {(!slice.isDirect && slice.stops > 0) && (
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 border-2 border-white" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-text-secondary">
                              {slice.stops === 0 || slice.isDirect ? 'Direct flight' : `${slice.stops} stop`}
                            </p>
                          </div>
                          <div className="text-center min-w-[70px]">
                            <p className="text-2xl font-bold text-primary">
                              {slice.segments?.[slice.segments.length - 1]?.arrivingAt
                                ? format(new Date(slice.segments[slice.segments.length - 1].arrivingAt), 'HH:mm')
                                : '—'}
                            </p>
                            <p className="text-xs font-semibold text-accent mt-0.5">
                              {slice.destination?.code || slice.segments?.[slice.segments.length - 1]?.destination}
                            </p>
                            <p className="text-[10px] text-text-secondary">
                              {slice.destination?.name || ''}
                            </p>
                          </div>
                        </div>
                        {slice.segments?.[0]?.flightNumber && (
                          <p className="text-xs text-text-muted mt-2 text-center">
                            Flight {slice.segments[0].flightNumber}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Train journeys */}
                    {flight.mode === 'train' && flight.outbound && (
                      <div className="space-y-3">
                        {[{ label: 'Outbound', journey: flight.outbound }, { label: 'Return', journey: flight.returnJourney }]
                          .filter(j => j.journey)
                          .map(({ label, journey }) => (
                            <div key={label} className="bg-bg-soft rounded-card p-4">
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">{label}</p>
                              <div className="flex items-center gap-4">
                                <div className="text-center min-w-[70px]">
                                  <p className="text-2xl font-bold text-primary">
                                    {journey.departureTime ? format(new Date(journey.departureTime), 'HH:mm') : '—'}
                                  </p>
                                  <p className="text-xs text-text-secondary">{journey.departureStation}</p>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-full h-0.5 bg-accent/30 my-2" />
                                  <p className="text-xs text-text-secondary">{journey.changes > 0 ? `${journey.changes} change${journey.changes > 1 ? 's' : ''}` : 'Direct'}</p>
                                </div>
                                <div className="text-center min-w-[70px]">
                                  <p className="text-2xl font-bold text-primary">
                                    {journey.arrivalTime ? format(new Date(journey.arrivalTime), 'HH:mm') : '—'}
                                  </p>
                                  <p className="text-xs text-text-secondary">{journey.arrivalStation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Passengers */}
                    {flight.passengers?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {flight.passengers.map((name: string, pi: number) => (
                          <span key={pi} className="text-xs px-2.5 py-1 bg-accent-light text-accent rounded-full font-medium">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotel card */}
          {bookingData.hotel && bookingData.hotel.name && (
            <div className="bg-white border border-border rounded-card overflow-hidden">
              <div className="bg-gradient-to-r from-[#003580] to-[#00224f] px-5 py-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={14} /> Accommodation
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xl font-bold text-primary">{bookingData.hotel.name}</h4>
                    {bookingData.hotel.starRating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: bookingData.hotel.starRating }).map((_, i) => (
                          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                    {bookingData.hotel.address && (
                      <p className="text-sm text-text-secondary flex items-center gap-1.5">
                        <MapPin size={13} className="text-text-muted flex-shrink-0" />
                        {bookingData.hotel.address}{bookingData.hotel.city ? `, ${bookingData.hotel.city}` : ''}
                      </p>
                    )}
                  </div>
                  {bookingData.hotel.bookingReference && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-text-muted uppercase">Booking ref</p>
                      <p className="text-base font-mono font-bold text-[#003580]">{bookingData.hotel.bookingReference}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-bg-soft rounded-input text-center">
                    <p className="text-[10px] text-text-secondary uppercase font-medium">Check-in</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{format(new Date(bookingData.hotel.checkIn), 'EEE d MMM')}</p>
                    <p className="text-xs text-text-muted">from 15:00</p>
                  </div>
                  <div className="p-3 bg-bg-soft rounded-input text-center">
                    <p className="text-[10px] text-text-secondary uppercase font-medium">Check-out</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{format(new Date(bookingData.hotel.checkOut), 'EEE d MMM')}</p>
                    <p className="text-xs text-text-muted">by 11:00</p>
                  </div>
                  <div className="p-3 bg-bg-soft rounded-input text-center">
                    <p className="text-[10px] text-text-secondary uppercase font-medium">Rooms</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{bookingData.hotel.rooms}</p>
                    <p className="text-xs text-text-muted">{bookingData.hotel.roomType || 'Room'}</p>
                  </div>
                  <div className="p-3 bg-bg-soft rounded-input text-center">
                    <p className="text-[10px] text-text-secondary uppercase font-medium">Nights</p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {bookingData.hotel.nights || Math.ceil((new Date(bookingData.hotel.checkOut).getTime() - new Date(bookingData.hotel.checkIn).getTime()) / (1000*60*60*24))}
                    </p>
                    <p className="text-xs text-text-muted">nights</p>
                  </div>
                </div>

                {/* Hotel link */}
                {bookingData.hotel.bookingUrl && (
                  <a
                    href={bookingData.hotel.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#003580] hover:underline"
                  >
                    <Building2 size={14} /> View on Booking.com <ArrowRight size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Day-by-day itinerary (editable by organiser) */}
          <div className="bg-white border border-border rounded-card overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} /> Your itinerary
              </h3>
              {isOrganiser && (
                <button
                  onClick={async () => { await saveItinerary() }}
                  disabled={savingItinerary}
                  className="text-xs px-3 py-1 rounded-input bg-white/20 text-white font-medium hover:bg-white/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingItinerary ? <><Loader size={10} className="animate-spin" /> Saving...</> : <><Check size={10} /> Save changes</>}
                </button>
              )}
            </div>
            <div className="p-5">
              <div className="space-y-0">
                {Array.from({ length: daysCount }).map((_, i) => {
                  const day = new Date(startDate)
                  day.setDate(day.getDate() + i)
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const isFirst = i === 0
                  const isLast = i === daysCount - 1
                  const dayEntries = itinerary[dateKey] || []
                  const isEditingThisDay = editingDay === dateKey

                  const typeConfig = {
                    activity: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Activity' },
                    restaurant: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Restaurant' },
                    note: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Note' },
                  }

                  return (
                    <div key={i} className="flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                          isFirst ? 'bg-accent border-accent' : isLast ? 'bg-accent border-accent' : dayEntries.length > 0 ? 'bg-purple-500 border-purple-500' : 'bg-white border-border'
                        }`} />
                        {i < daysCount - 1 && <div className="w-0.5 flex-1 bg-border min-h-[24px]" />}
                      </div>
                      {/* Content */}
                      <div className="pb-5 min-w-0 flex-1 -mt-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-primary">
                            Day {i + 1} · {format(day, 'EEE d MMM')}
                          </p>
                          {isOrganiser && !isEditingThisDay && (
                            <button
                              onClick={() => { setEditingDay(dateKey); setNewEntry({ time: '', text: '', type: 'activity' }) }}
                              className="text-[10px] px-2 py-0.5 text-accent hover:bg-accent-light rounded transition-colors font-medium"
                            >
                              + Add
                            </button>
                          )}
                        </div>

                        {/* Auto tags for first/last day */}
                        {isFirst && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className="text-xs px-2 py-0.5 bg-accent-light text-accent rounded-full font-medium flex items-center gap-1">
                              <Plane size={10} /> Travel day
                            </span>
                            {bookingData.hotel?.name && (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">
                                <Building2 size={10} /> Check in
                              </span>
                            )}
                          </div>
                        )}
                        {isLast && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {bookingData.hotel?.name && (
                              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium flex items-center gap-1">
                                <Building2 size={10} /> Check out
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-accent-light text-accent rounded-full font-medium flex items-center gap-1">
                              <Plane size={10} /> Return home
                            </span>
                          </div>
                        )}

                        {/* Itinerary entries */}
                        {dayEntries.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {dayEntries.map((entry, ei) => (
                              <div key={ei} className={`flex items-start gap-2 px-3 py-2 rounded-input ${typeConfig[entry.type]?.bg || 'bg-gray-50'} group/entry`}>
                                {entry.time && (
                                  <span className="text-xs font-mono font-bold text-primary whitespace-nowrap mt-0.5">{entry.time}</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${typeConfig[entry.type]?.text || 'text-primary'}`}>{entry.text}</p>
                                </div>
                                {isOrganiser && (
                                  <button
                                    onClick={() => removeItineraryEntry(dateKey, ei)}
                                    className="opacity-0 group-hover/entry:opacity-100 text-red-400 hover:text-red-600 transition-all p-0.5 flex-shrink-0"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No entries placeholder (non-first/last days only) */}
                        {dayEntries.length === 0 && !isFirst && !isLast && !isEditingThisDay && (
                          <p className="text-xs text-text-muted mt-0.5 italic">
                            {isOrganiser ? 'Click + Add to plan this day' : 'No plans yet'}
                          </p>
                        )}

                        {/* Add entry form (organiser only) */}
                        {isOrganiser && isEditingThisDay && (
                          <div className="mt-2 p-3 bg-bg-soft rounded-input space-y-2 border border-border">
                            <div className="flex gap-1.5">
                              {(['activity', 'restaurant', 'note'] as const).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setNewEntry(e => ({ ...e, type: t }))}
                                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                                    newEntry.type === t
                                      ? `${typeConfig[t].bg} ${typeConfig[t].text} ring-1 ring-current`
                                      : 'bg-white text-text-secondary hover:bg-bg-soft'
                                  }`}
                                >
                                  {typeConfig[t].label}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={newEntry.time}
                                onChange={(e) => setNewEntry(ne => ({ ...ne, time: e.target.value }))}
                                className="w-24 px-2 py-1.5 border border-border rounded-input bg-white text-primary text-xs"
                                placeholder="Time"
                              />
                              <input
                                type="text"
                                value={newEntry.text}
                                onChange={(e) => setNewEntry(ne => ({ ...ne, text: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') addItineraryEntry(dateKey) }}
                                placeholder={newEntry.type === 'restaurant' ? 'e.g. Dinner at La Boqueria' : newEntry.type === 'note' ? 'e.g. Chill day — no plans' : 'e.g. Sagrada Familia tour'}
                                className="flex-1 px-3 py-1.5 border border-border rounded-input bg-white text-primary text-xs placeholder-text-muted"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addItineraryEntry(dateKey)}
                                disabled={!newEntry.text.trim()}
                                className="text-xs px-3 py-1.5 bg-accent text-white rounded-input font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => setEditingDay(null)}
                                className="text-xs px-3 py-1.5 text-text-secondary hover:text-primary transition-colors"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Expense tracker link */}
          <Link
            href={`/trips/${trip.id}/expenses`}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-card p-5 flex items-center gap-4 hover:shadow-sm transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
              <Receipt size={22} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary group-hover:text-emerald-700 transition-colors">Track trip expenses</p>
              <p className="text-xs text-text-secondary">Log what everyone spends and split the cost fairly</p>
            </div>
            <ArrowRight size={18} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
          </Link>

          {/* Who's going */}
          <div className="bg-white border border-border rounded-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Who's going</h3>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-bg-soft rounded-input">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    m.role === 'organiser' ? 'bg-accent' : 'bg-primary'
                  }`}>
                    {getMemberDisplayName(m).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">{getMemberDisplayName(m)}</p>
                    {m.role === 'organiser' && <p className="text-[10px] text-accent font-medium">Organiser</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite links panel — shown when there are pending invites */}
      {isOrganiser && pendingCount > 0 && trip.status !== 'booked' && (
        <div className="bg-white border border-border rounded-card overflow-hidden">
          <button
            onClick={() => setShowInviteLinks(!showInviteLinks)}
            className="w-full p-5 flex items-center justify-between hover:bg-bg-soft transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
                <ArrowRight size={18} className="text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-primary">Share invite links</p>
                <p className="text-xs text-text-secondary">
                  {pendingCount} {pendingCount === 1 ? 'person hasn\'t' : 'people haven\'t'} joined yet — send them their link
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-text-secondary transition-transform ${showInviteLinks ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showInviteLinks && (
            <div className="border-t border-border p-5 space-y-3">
              <p className="text-xs text-text-secondary">Copy a link and send it to each person. They'll be able to sign up and submit their preferences.</p>
              {members.filter(m => m.invite_status === 'pending' && m.invite_token).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-bg-soft rounded-input gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                      {member.invite_email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{member.invite_email || 'Invited member'}</p>
                      <p className="text-[10px] text-text-muted truncate">/invite/{member.invite_token?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyInviteLink(member.invite_token!)}
                    className={`flex-shrink-0 px-4 py-2 rounded-input text-xs font-semibold transition-all ${
                      copiedToken === member.invite_token
                        ? 'bg-green-500 text-white'
                        : 'bg-accent text-white hover:bg-accent-hover'
                    }`}
                  >
                    {copiedToken === member.invite_token ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              ))}
              {members.filter(m => m.invite_status === 'pending' && !m.invite_token).length > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-input">
                  Some members don't have invite tokens yet. They may need to be re-invited.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ready to book CTA — only clickable when everyone has submitted */}
      {isOrganiser && submittedCount > 0 && trip.status !== 'booked' && (
        submittedCount >= totalInvited ? (
          <button
            onClick={() => router.push(`/trips/${trip.id}/options`)}
            className="w-full py-4 text-white rounded-card font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg bg-accent hover:bg-accent-hover animate-pulse hover:animate-none"
          >
            See my trip options →
          </button>
        ) : (
          <div className="w-full py-4 bg-bg-soft border border-border rounded-card text-center space-y-1">
            <p className="text-sm font-semibold text-primary">
              Waiting for everyone to respond ({submittedCount}/{totalInvited})
            </p>
            <p className="text-xs text-text-secondary">
              Once all of your group has responded, click here to view your flight and hotel options
            </p>
          </div>
        )
      )}

      {/* Tab navigation — organiser only, not when booked */}
      {isOrganiser && trip.status !== 'booked' && <div className="flex gap-1 bg-bg-soft rounded-card p-1">
        {(['overview', 'preferences', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-input text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'preferences' ? 'Preferences' : 'Members'}
          </button>
        ))}
      </div>}

      {/* OVERVIEW TAB */}
      {isOrganiser && trip.status !== 'booked' && activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress rings row */}
          <div className="bg-white border border-border rounded-card p-6">
            <div className="grid grid-cols-3 gap-4">
              <ProgressRing
                value={acceptedCount}
                max={totalInvited}
                label="Accepted"
                sublabel={pendingCount > 0 ? `${pendingCount} pending` : 'All responded'}
              />
              <ProgressRing
                value={submittedCount}
                max={totalInvited}
                label="Preferences in"
                sublabel={submittedCount === totalInvited ? 'Everyone\'s in!' : `${totalInvited - submittedCount} waiting`}
              />
              <ProgressRing
                value={sortedDestinations.length > 0 ? sortedDestinations.filter(([,c]) => c > 1).length : 0}
                max={sortedDestinations.length || 1}
                label="Overlaps found"
                sublabel="Destinations in common"
              />
            </div>
          </div>

          {/* Destination Leaderboard */}
          {(trip.shortlisted_cities?.length > 0 || sortedDestinations.length > 0) && (
            <div className="bg-white border border-border rounded-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Destination leaderboard</h3>
                {topDestination && topDestination[1] > 1 && (
                  <span className="text-xs px-2 py-1 bg-accent-light text-accent rounded-full font-medium">
                    {topDestination[0].split(', ')[0]} is winning!
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {/* Show all shortlisted cities, even those with 0 votes */}
                {(trip.shortlisted_cities || []).map((city: string, i: number) => {
                  const votes = destinationCounts[city] || 0
                  const maxVotes = sortedDestinations.length > 0 ? sortedDestinations[0][1] : 0
                  const isLeader = votes > 0 && votes === maxVotes
                  const pct = submittedCount > 0 ? (votes / submittedCount) * 100 : 0

                  return (
                    <div key={city} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isLeader && votes > 1 ? (
                            <span className="text-sm font-bold text-accent">●</span>
                          ) : votes > 0 ? (
                            <span className="text-sm text-primary">●</span>
                          ) : (
                            <span className="text-sm text-text-muted">○</span>
                          )}
                          <span className={`text-sm font-medium ${isLeader ? 'text-accent' : votes > 0 ? 'text-primary' : 'text-text-muted'}`}>
                            {city.split(', ')[0]}
                          </span>
                          <span className="text-xs text-text-secondary">{city.split(', ')[1]}</span>
                        </div>
                        <span className={`text-xs font-bold ${isLeader ? 'text-accent' : 'text-text-secondary'}`}>
                          {votes} {votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-4 overflow-hidden">
                        <div
                          className={`${isLeader ? 'bg-accent' : votes > 0 ? 'bg-accent/40' : 'bg-transparent'} rounded-full h-full transition-all duration-300 ease-out`}
                          style={{ width: `${Math.max(pct, votes > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {submittedCount > 0 && (
                <p className="text-xs text-text-secondary pt-1">
                  Based on {submittedCount} {submittedCount === 1 ? 'vote' : 'votes'} so far
                </p>
              )}
            </div>
          )}

          {/* Budget overlap */}
          {budgets.length > 0 && (
            <div className="bg-white border border-border rounded-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Budget sweet spot</h3>
              {hasBudgetOverlap ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-accent">£{budgetOverlapMin}</span>
                    <span className="text-text-secondary mx-1">–</span>
                    <span className="text-3xl font-bold text-accent">£{budgetOverlapMax}</span>
                    <span className="text-sm text-text-secondary ml-2">per person</span>
                  </div>
                  <p className="text-xs text-text-secondary">This is where everyone's budget overlaps — your ideal price range</p>
                  <div className="w-full bg-border rounded-full h-3 overflow-hidden relative">
                    <div className="bg-green-400 rounded-full h-full" style={{ width: '100%' }} />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-input">
                  <p className="text-sm text-amber-800">Budgets don't overlap yet. You may need to chat with your group about expectations.</p>
                </div>
              )}
            </div>
          )}

          {/* Nudge banner */}
          {submittedCount < totalInvited && (
            <div className="bg-gradient-to-r from-accent to-[#1d4ed8] rounded-card p-5 text-white text-center space-y-2">
              <p className="text-lg font-bold">
                {totalInvited - submittedCount} {totalInvited - submittedCount === 1 ? 'person hasn\'t' : 'people haven\'t'} submitted yet
              </p>
              <p className="text-sm text-white/80">Send them a nudge to get the ball rolling</p>
              <button className="mt-2 px-6 py-2 bg-white text-accent rounded-input font-semibold text-sm hover:bg-white/90 transition-colors">
                Send reminder
              </button>
            </div>
          )}

          {submittedCount === totalInvited && totalInvited > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-card p-6 text-white text-center space-y-3">
              <p className="text-3xl font-bold">✓</p>
              <p className="text-xl font-bold">Everyone's preferences are in!</p>
              <p className="text-sm text-white/80">
                We've matched your group's votes and found the best options. Ready to see them?
              </p>
              <button
                onClick={() => router.push(`/trips/${trip.id}/options`)}
                className="mt-2 px-8 py-3 bg-white text-green-600 rounded-card font-bold text-base hover:bg-white/90 transition-colors shadow-lg"
              >
                See my trip options →
              </button>
            </div>
          )}
        </div>
      )}

      {/* PREFERENCES TAB */}
      {isOrganiser && trip.status !== 'booked' && activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Accommodation breakdown */}
          {Object.keys(accommodationCounts).length > 0 && (
            <div className="bg-white border border-border rounded-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Accommodation preferences</h3>
              <div className="space-y-3">
                {Object.entries(accommodationCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <HorizontalBar
                      key={type}
                      label={accommodationLabels[type]?.label || type}
                      icon={accommodationLabels[type]?.icon}
                      count={count}
                      total={submittedCount}
                      color={count === Math.max(...Object.values(accommodationCounts)) ? 'bg-accent' : 'bg-accent/40'}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Transport breakdown */}
          {Object.keys(transportCounts).length > 0 && (
            <div className="bg-white border border-border rounded-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">How they want to travel</h3>
              <div className="space-y-3">
                {Object.entries(transportCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <HorizontalBar
                      key={type}
                      label={transportLabels[type]?.label || type}
                      icon={transportLabels[type]?.icon}
                      count={count}
                      total={submittedCount}
                      color={count === Math.max(...Object.values(transportCounts)) ? 'bg-blue-500' : 'bg-blue-500/40'}
                    />
                  ))}
              </div>
              {directFlightVotes > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-sm font-medium text-accent">Direct</span>
                  <p className="text-sm text-text-secondary">
                    <strong className="text-primary">{directFlightVotes}</strong> {directFlightVotes === 1 ? 'person wants' : 'people want'} direct flights only
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Flight time breakdown */}
          {Object.keys(flightTimeCounts).length > 0 && (
            <div className="bg-white border border-border rounded-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Preferred flight times</h3>
              <div className="space-y-3">
                {Object.entries(flightTimeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([time, count]) => (
                    <HorizontalBar
                      key={time}
                      label={flightTimeLabels[time] || time}
                      count={count}
                      total={submittedCount}
                      color={count === Math.max(...Object.values(flightTimeCounts)) ? 'bg-purple-500' : 'bg-purple-500/40'}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Must-haves & Dealbreakers */}
          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(mustHavesAll).length > 0 && (
              <div className="bg-white border border-border rounded-card p-6 space-y-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Must-haves</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(mustHavesAll)
                    .sort((a, b) => b[1] - a[1])
                    .map(([item, count]) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                      >
                        {item}
                        {count > 1 && <span className="text-xs text-green-500">×{count}</span>}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {Object.keys(dealbreakersAll).length > 0 && (
              <div className="bg-white border border-border rounded-card p-6 space-y-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Dealbreakers</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(dealbreakersAll)
                    .sort((a, b) => b[1] - a[1])
                    .map(([item, count]) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                      >
                        🚫 {item}
                        {count > 1 && <span className="text-xs text-red-500">×{count}</span>}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {submittedCount === 0 && (
            <div className="bg-bg-soft border border-border rounded-card p-8 text-center space-y-3">
              <p className="text-4xl font-light text-text-muted">—</p>
              <p className="text-lg font-semibold text-primary">No preferences yet</p>
              <p className="text-sm text-text-secondary">Charts and insights will appear here once your group starts submitting their preferences</p>
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {isOrganiser && trip.status !== 'booked' && activeTab === 'members' && (
        <div className="space-y-4">
          {/* Summary header */}
          <div className="bg-white border border-border rounded-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">{members.length} members · {submittedCount} preferences in</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {submittedCount === members.length
                  ? 'Everyone\'s done — you\'re ready to go!'
                  : `Waiting on ${members.length - submittedCount} ${members.length - submittedCount === 1 ? 'person' : 'people'}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500" /> {submittedCount} done
              </span>
              {members.length - submittedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> {members.length - submittedCount} waiting
                </span>
              )}
              {isOrganiser && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-input bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                >
                  <UserPlus size={13} /> Add
                </button>
              )}
            </div>
          </div>

          {/* Add attendee form */}
          {isOrganiser && showAddForm && (
            <div className="bg-white border-2 border-accent/30 rounded-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <UserPlus size={16} className="text-accent" /> Add a new attendee
                </h3>
                <button onClick={() => { setShowAddForm(false); setAddError('') }} className="text-text-secondary hover:text-primary">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddAttendee} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-primary mb-1">First name</label>
                    <input
                      type="text"
                      value={addFirstName}
                      onChange={(e) => setAddFirstName(e.target.value)}
                      placeholder="e.g. James"
                      className="w-full px-3 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary mb-1">Last name</label>
                    <input
                      type="text"
                      value={addLastName}
                      onChange={(e) => setAddLastName(e.target.value)}
                      placeholder="e.g. Smith"
                      className="w-full px-3 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">Email address</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="james@example.com"
                    className="w-full px-3 py-2 border border-border rounded-input bg-white text-primary placeholder-text-muted text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddCostsCovered(!addCostsCovered)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-medium transition-all border ${
                      addCostsCovered
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-border text-text-secondary hover:border-purple-300'
                    }`}
                  >
                    <Gift size={12} /> Costs covered
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole(addRole === 'surprise' ? 'attendee' : 'surprise')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-medium transition-all border ${
                      addRole === 'surprise'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-border text-text-secondary hover:border-amber-300'
                    }`}
                  >
                    <EyeOff size={12} /> Surprise
                  </button>
                </div>

                {addRole === 'surprise' && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-input">
                    This person won't receive an invite or know about the trip. You'll fill in their preferences on their behalf.
                  </p>
                )}
                {addCostsCovered && (
                  <p className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-input">
                    This person's share of the trip costs will be split across all other paying members.
                  </p>
                )}

                {addError && <p className="text-sm text-red-600">{addError}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2 bg-accent text-white rounded-input font-medium text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {addLoading ? <><Loader size={14} className="animate-spin" /> Adding...</> : 'Add attendee'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setAddError('') }}
                    className="px-5 py-2 border border-border text-primary rounded-input font-medium text-sm hover:bg-bg-soft transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Submitted section */}
          {members.filter(m => {
            const pref = preferences.find(p => p.member_id === m.member_id || p.trip_member_id === m.id)
            return pref?.is_submitted
          }).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Submitted</p>
              {members.filter(m => {
                const pref = preferences.find(p => p.member_id === m.member_id || p.trip_member_id === m.id)
                return pref?.is_submitted
              }).map((member) => {
                const pref = preferences.find(p => p.member_id === member.member_id || p.trip_member_id === member.id)!
                const isYou = member.member_id === userId
                const isEditing = editingMemberId === member.id
                const isRemoving = removingMemberId === member.id

                return (
                  <div key={member.id} className="bg-white border border-green-200 rounded-card p-5 space-y-3">
                    {/* Remove confirmation overlay */}
                    {isRemoving && (
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-input">
                        <p className="text-sm text-red-700 font-medium">Remove {getMemberDisplayName(member)} from this trip?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeLoading}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-input font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {removeLoading ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove
                          </button>
                          <button
                            onClick={() => setRemovingMemberId(null)}
                            className="text-xs px-3 py-1.5 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline edit mode */}
                    {isEditing && (
                      <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-input">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="First name"
                            className="px-3 py-1.5 border border-blue-300 rounded-input bg-white text-primary text-sm"
                          />
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="Last name"
                            className="px-3 py-1.5 border border-blue-300 rounded-input bg-white text-primary text-sm"
                          />
                        </div>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email address"
                          className="w-full px-3 py-1.5 border border-blue-300 rounded-input bg-white text-primary text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(member.id)}
                            disabled={editLoading}
                            className="text-xs px-3 py-1.5 bg-accent text-white rounded-input font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {editLoading ? <Loader size={12} className="animate-spin" /> : <Check size={12} />} Save
                          </button>
                          <button
                            onClick={() => setEditingMemberId(null)}
                            className="text-xs px-3 py-1.5 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            member.role === 'organiser' ? 'bg-accent' : 'bg-primary'
                          }`}>
                            {isYou ? 'You' : (getMemberDisplayName(member).charAt(0).toUpperCase())}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-primary">
                            {isYou ? 'You' : getMemberDisplayName(member)}
                            {member.role === 'organiser' && <span className="ml-2 text-xs px-2 py-0.5 bg-accent-light text-accent rounded-full">Organiser</span>}
                            {member.role === 'surprise' && <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Surprise</span>}
                            {member.costs_covered && <span className="ml-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Covered</span>}
                          </p>
                          <p className="text-xs text-green-600 font-medium">Preferences submitted</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOrganiser && !isYou && member.role !== 'organiser' && !isEditing && !isRemoving && (
                          <>
                            <button
                              onClick={() => startEditing(member)}
                              className="text-xs p-1.5 rounded-input text-text-secondary hover:text-primary hover:bg-bg-soft transition-colors"
                              title="Edit member"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setRemovingMemberId(member.id)}
                              className="text-xs p-1.5 rounded-input text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-50 text-green-700">Done</span>
                      </div>
                    </div>

                    {/* Preference summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-green-100">
                      {pref.preferred_destinations && pref.preferred_destinations.length > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-text-secondary uppercase">Destinations</p>
                          <p className="text-xs text-primary font-medium">{pref.preferred_destinations.slice(0, 2).join(', ')}{pref.preferred_destinations.length > 2 ? ` +${pref.preferred_destinations.length - 2}` : ''}</p>
                        </div>
                      )}
                      {pref.accommodation_type && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-text-secondary uppercase">Stay</p>
                          <p className="text-xs text-primary font-medium capitalize">{accommodationLabels[pref.accommodation_type]?.icon} {accommodationLabels[pref.accommodation_type]?.label || pref.accommodation_type}</p>
                        </div>
                      )}
                      {pref.budget_min != null && pref.budget_max != null && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-text-secondary uppercase">Budget</p>
                          <p className="text-xs text-primary font-medium">£{pref.budget_min} – £{pref.budget_max}</p>
                        </div>
                      )}
                      {pref.transport_preference && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-text-secondary uppercase">Travel</p>
                          <p className="text-xs text-primary font-medium">{transportLabels[pref.transport_preference]?.icon} {transportLabels[pref.transport_preference]?.label || pref.transport_preference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Waiting section */}
          {members.filter(m => {
            const pref = preferences.find(p => p.member_id === m.member_id || p.trip_member_id === m.id)
            return !pref?.is_submitted
          }).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Waiting for response</p>
              {members.filter(m => {
                const pref = preferences.find(p => p.member_id === m.member_id || p.trip_member_id === m.id)
                return !pref?.is_submitted
              }).map((member) => {
                const isYou = member.member_id === userId
                const isEditing = editingMemberId === member.id
                const isRemoving = removingMemberId === member.id

                return (
                  <div key={member.id} className="bg-white border border-border rounded-card p-5 space-y-3">
                    {/* Remove confirmation overlay */}
                    {isRemoving && (
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-input">
                        <p className="text-sm text-red-700 font-medium">Remove {getMemberDisplayName(member)}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeLoading}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-input font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {removeLoading ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove
                          </button>
                          <button
                            onClick={() => setRemovingMemberId(null)}
                            className="text-xs px-3 py-1.5 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline edit mode */}
                    {isEditing && (
                      <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-input">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="First name"
                            className="px-3 py-1.5 border border-blue-300 rounded-input bg-white text-primary text-sm"
                          />
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="Last name"
                            className="px-3 py-1.5 border border-blue-300 rounded-input bg-white text-primary text-sm"
                          />
                        </div>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email address"
                          className="w-full px-3 py-1.5 border border-blue-300 rounded-input bg-white text-primary text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(member.id)}
                            disabled={editLoading}
                            className="text-xs px-3 py-1.5 bg-accent text-white rounded-input font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {editLoading ? <Loader size={12} className="animate-spin" /> : <Check size={12} />} Save
                          </button>
                          <button
                            onClick={() => setEditingMemberId(null)}
                            className="text-xs px-3 py-1.5 border border-border text-primary rounded-input font-medium hover:bg-bg-soft transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-sm">
                            {isYou ? 'You' : (getMemberDisplayName(member).charAt(0).toUpperCase())}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                            <Clock size={8} className="text-amber-800" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-primary">
                            {isYou ? 'You' : getMemberDisplayName(member)}
                            {member.role === 'surprise' && <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Surprise</span>}
                            {member.costs_covered && <span className="ml-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Covered</span>}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {member.invite_status === 'pending'
                              ? 'Hasn\'t opened their invite yet'
                              : 'Accepted but hasn\'t submitted preferences'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOrganiser && !isYou && member.role !== 'organiser' && !isEditing && !isRemoving && (
                          <>
                            <button
                              onClick={() => startEditing(member)}
                              className="text-xs p-1.5 rounded-input text-text-secondary hover:text-primary hover:bg-bg-soft transition-colors"
                              title="Edit member"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setRemovingMemberId(member.id)}
                              className="text-xs p-1.5 rounded-input text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {!isYou && member.invite_token && member.invite_status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => copyInviteLink(member.invite_token!)}
                            className={`text-xs px-3 py-1.5 rounded-input font-semibold transition-all ${
                              copiedToken === member.invite_token
                                ? 'bg-green-500 text-white'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                          >
                            {copiedToken === member.invite_token ? 'Copied!' : 'Copy link'}
                          </button>
                        )}
                        {!isYou && member.invite_email && member.invite_status === 'pending' && (
                          sendingEmailId === member.id ? (
                            <span className="text-xs px-3 py-1.5 rounded-input bg-blue-50 text-blue-700 font-medium flex items-center gap-1.5">
                              <Loader size={12} className="animate-spin" /> Sending...
                            </span>
                          ) : emailSentIds.includes(member.id) ? (
                            <span className="text-xs px-3 py-1.5 rounded-input bg-green-50 text-green-700 font-medium flex items-center gap-1.5">
                              <Check size={12} /> Email sent
                            </span>
                          ) : member.invite_sent_at ? (
                            <button
                              type="button"
                              onClick={() => handleSendInviteEmail(member.id, true)}
                              className="text-xs px-3 py-1.5 rounded-input bg-accent text-white font-semibold hover:bg-accent-hover transition-colors flex items-center gap-1.5"
                            >
                              <RefreshCw size={12} /> Resend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendInviteEmail(member.id)}
                              className="text-xs px-3 py-1.5 rounded-input bg-accent text-white font-semibold hover:bg-accent-hover transition-colors flex items-center gap-1.5"
                            >
                              <Mail size={12} /> Send invite
                            </button>
                          )
                        )}
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          member.invite_status === 'pending' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {member.invite_status === 'pending' ? 'Pending' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
