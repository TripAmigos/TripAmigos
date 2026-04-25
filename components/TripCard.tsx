import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
import { Database } from '@/types/database'

interface TripCardProps {
  trip: Database['public']['Tables']['trips']['Row'] & {
    trip_members?: Array<{
      id: string
      status: string
      role: string
    }>
  }
  userRole: 'organiser' | 'attendee'
}

export function TripCard({ trip, userRole }: TripCardProps) {
  const acceptedCount = trip.trip_members?.filter((m) => m.status === 'accepted').length || 0
  const totalMembers = trip.group_size

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const isSameMonth = startDate.getMonth() === endDate.getMonth()

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="bg-white border border-border rounded-card p-6 hover:border-accent hover:shadow-lg transition-all duration-200 space-y-4 group"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
          {trip.name}
        </h3>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-full bg-accent-light text-accent font-medium">
            {userRole === 'organiser' ? 'Organiser' : 'Attendee'}
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
          <span>
            {acceptedCount} of {totalMembers} members responded
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-accent rounded-full h-full transition-all duration-300"
            style={{
              width: `${(acceptedCount / totalMembers) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-text-secondary text-right">
          {Math.round((acceptedCount / totalMembers) * 100)}% done
        </p>
      </div>
    </Link>
  )
}
