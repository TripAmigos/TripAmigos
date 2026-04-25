import { NextRequest, NextResponse } from 'next/server'
import { searchTrains } from '@/lib/trainline'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, departureDate, returnDate, passengers } = body

    if (!origin || !destination || !departureDate || !returnDate || !passengers) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, departureDate, returnDate, passengers' },
        { status: 400 }
      )
    }

    // Shift past dates forward for demos
    let searchDep = departureDate
    let searchRet = returnDate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(departureDate) < today) {
      const tripLengthMs = new Date(returnDate).getTime() - new Date(departureDate).getTime()
      const newDep = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      searchDep = newDep.toISOString().split('T')[0]
      searchRet = new Date(newDep.getTime() + tripLengthMs).toISOString().split('T')[0]
    }

    const options = await searchTrains({
      origin,
      destination,
      departureDate: searchDep,
      returnDate: searchRet,
      passengers: parseInt(passengers),
    })

    if (options.length === 0) {
      return NextResponse.json({
        options: [],
        message: `No train routes found between ${origin} and ${destination}. Try flights instead?`,
      })
    }

    return NextResponse.json({
      options: options.map(opt => ({
        ...opt,
        // Format for the frontend consistently
        outbound: {
          ...opt.outbound,
          legs: opt.outbound.legs.map(leg => ({
            ...leg,
            departureTime: leg.departureTime,
            arrivalTime: leg.arrivalTime,
          })),
        },
        returnJourney: {
          ...opt.returnJourney,
          legs: opt.returnJourney.legs.map(leg => ({
            ...leg,
            departureTime: leg.departureTime,
            arrivalTime: leg.arrivalTime,
          })),
        },
      })),
      provider: 'trainline_mock',
      totalOptions: options.length,
    })
  } catch (error: any) {
    console.error('Train search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search trains' },
      { status: 500 }
    )
  }
}
