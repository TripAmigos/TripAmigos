export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { searchHotels } from '@/lib/booking'

/**
 * POST /api/hotels/search
 * Searches for hotel options at a destination.
 *
 * Body: {
 *   destination: string,  // e.g. "Barcelona" or "Barcelona, Spain"
 *   checkIn: string,      // YYYY-MM-DD
 *   checkOut: string,     // YYYY-MM-DD
 *   guests: number,       // total guests
 *   rooms?: number,       // optional, auto-calculated if not provided
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destination, checkIn, checkOut, guests, rooms } = body

    if (!destination || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, checkIn, checkOut, guests' },
        { status: 400 }
      )
    }

    // Shift past dates forward for demos
    let searchCheckIn = checkIn
    let searchCheckOut = checkOut
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(checkIn) < today) {
      const stayMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()
      const newIn = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      searchCheckIn = newIn.toISOString().split('T')[0]
      searchCheckOut = new Date(newIn.getTime() + stayMs).toISOString().split('T')[0]
    }

    const hotels = await searchHotels({
      destination,
      checkIn: searchCheckIn,
      checkOut: searchCheckOut,
      guests: parseInt(guests),
      rooms: rooms ? parseInt(rooms) : undefined,
    })

    return NextResponse.json({
      hotels,
      destination,
      checkIn,
      checkOut,
      guests: parseInt(guests),
      totalResults: hotels.length,
    })
  } catch (error: any) {
    console.error('Hotel search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search hotels' },
      { status: 500 }
    )
  }
}
