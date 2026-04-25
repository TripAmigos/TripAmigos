import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

/**
 * GET /api/itinerary/pdf?tripId=xxx
 * Generates a branded HTML-to-PDF itinerary for sharing
 */
export async function GET(request: NextRequest) {
  try {
    const tripId = request.nextUrl.searchParams.get('tripId')
    if (!tripId) {
      return NextResponse.json({ error: 'tripId required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Auth check — only organiser can generate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: trip } = await supabase
      .from('trips')
      .select(`
        id, name, date_from, date_to, status, organiser_id, booking_data,
        trip_members ( id, first_name, last_name, guest_name, role )
      `)
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.organiser_id !== user.id) {
      return NextResponse.json({ error: 'Only the organiser can generate the PDF' }, { status: 403 })
    }

    const bookingData = trip.booking_data as any
    if (!bookingData) {
      return NextResponse.json({ error: 'No booking data' }, { status: 400 })
    }

    const startDate = new Date(trip.date_from)
    const endDate = new Date(trip.date_to)
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const members = (trip.trip_members || []) as any[]
    const itinerary = bookingData.itinerary || {}

    // Build HTML for the PDF
    const flightsHtml = (bookingData.flights || []).map((flight: any) => {
      const slicesHtml = (flight.slices || []).map((slice: any, si: number) => {
        const depTime = slice.segments?.[0]?.departingAt ? format(new Date(slice.segments[0].departingAt), 'HH:mm') : '—'
        const arrTime = slice.segments?.[slice.segments.length - 1]?.arrivingAt ? format(new Date(slice.segments[slice.segments.length - 1].arrivingAt), 'HH:mm') : '—'
        const depCode = slice.origin?.code || slice.segments?.[0]?.origin || ''
        const arrCode = slice.destination?.code || slice.segments?.[slice.segments.length - 1]?.destination || ''
        const depDate = slice.segments?.[0]?.departingAt ? format(new Date(slice.segments[0].departingAt), 'EEE d MMM') : ''
        return `
          <div style="background:#f8f9fa;border-radius:8px;padding:12px;margin:8px 0;">
            <div style="font-size:10px;color:#666;text-transform:uppercase;margin-bottom:6px;">${si === 0 ? 'Outbound' : 'Return'} · ${depDate}</div>
            <div style="display:flex;align-items:center;gap:16px;">
              <div style="text-align:center;min-width:60px;">
                <div style="font-size:22px;font-weight:700;">${depTime}</div>
                <div style="font-size:11px;color:#2563eb;font-weight:600;">${depCode}</div>
              </div>
              <div style="flex:1;text-align:center;">
                <div style="font-size:10px;color:#999;">${slice.duration || ''}</div>
                <div style="height:2px;background:#e5e7eb;margin:4px 0;border-radius:1px;"></div>
                <div style="font-size:10px;color:#666;">${slice.isDirect ? 'Direct' : slice.stops + ' stop'}</div>
              </div>
              <div style="text-align:center;min-width:60px;">
                <div style="font-size:22px;font-weight:700;">${arrTime}</div>
                <div style="font-size:11px;color:#2563eb;font-weight:600;">${arrCode}</div>
              </div>
            </div>
          </div>`
      }).join('')

      return `
        <div style="padding:16px;border-bottom:1px solid #e5e7eb;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <div style="font-size:16px;font-weight:700;">${flight.origin} → ${flight.destination}</div>
              <div style="font-size:13px;color:#666;">${flight.airline || ''}</div>
            </div>
            ${flight.bookingReference ? `<div style="text-align:right;"><div style="font-size:9px;color:#999;text-transform:uppercase;">Ref</div><div style="font-size:14px;font-family:monospace;font-weight:700;color:#2563eb;">${flight.bookingReference}</div></div>` : ''}
          </div>
          ${slicesHtml}
        </div>`
    }).join('')

    const hotelHtml = bookingData.hotel?.name ? `
      <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <div style="background:linear-gradient(135deg,#003580,#00224f);padding:12px 20px;">
          <div style="font-size:12px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:1px;">Accommodation</div>
        </div>
        <div style="padding:20px;">
          <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${bookingData.hotel.name}</div>
          ${bookingData.hotel.address ? `<div style="font-size:13px;color:#666;margin-bottom:12px;">${bookingData.hotel.address}${bookingData.hotel.city ? ', ' + bookingData.hotel.city : ''}</div>` : ''}
          <div style="display:flex;gap:12px;">
            <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:9px;color:#999;text-transform:uppercase;">Check-in</div>
              <div style="font-size:13px;font-weight:700;">${format(new Date(bookingData.hotel.checkIn), 'EEE d MMM')}</div>
              <div style="font-size:10px;color:#999;">from 15:00</div>
            </div>
            <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:9px;color:#999;text-transform:uppercase;">Check-out</div>
              <div style="font-size:13px;font-weight:700;">${format(new Date(bookingData.hotel.checkOut), 'EEE d MMM')}</div>
              <div style="font-size:10px;color:#999;">by 11:00</div>
            </div>
            <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:9px;color:#999;text-transform:uppercase;">Rooms</div>
              <div style="font-size:13px;font-weight:700;">${bookingData.hotel.rooms}</div>
            </div>
          </div>
          ${bookingData.hotel.bookingReference ? `<div style="font-size:12px;color:#666;margin-top:12px;">Booking ref: <strong style="font-family:monospace;color:#003580;">${bookingData.hotel.bookingReference}</strong></div>` : ''}
        </div>
      </div>` : ''

    const itineraryDays = Array.from({ length: daysCount }).map((_, i) => {
      const day = new Date(startDate)
      day.setDate(day.getDate() + i)
      const dateKey = format(day, 'yyyy-MM-dd')
      const isFirst = i === 0
      const isLast = i === daysCount - 1
      const dayEntries = itinerary[dateKey] || []

      const typeColors: Record<string, string> = { activity: '#7c3aed', restaurant: '#ea580c', note: '#666' }

      const entriesHtml = dayEntries.map((entry: any) =>
        `<div style="display:flex;gap:8px;align-items:baseline;padding:4px 10px;background:${entry.type === 'restaurant' ? '#fff7ed' : entry.type === 'activity' ? '#faf5ff' : '#f9fafb'};border-radius:6px;margin:4px 0;">
          ${entry.time ? `<span style="font-size:11px;font-family:monospace;font-weight:700;color:#1a1a2e;">${entry.time}</span>` : ''}
          <span style="font-size:12px;font-weight:500;color:${typeColors[entry.type] || '#333'};">${entry.text}</span>
        </div>`
      ).join('')

      let tagHtml = ''
      if (isFirst) tagHtml = '<span style="font-size:10px;background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:10px;font-weight:600;">Travel day · Check in</span>'
      if (isLast) tagHtml = '<span style="font-size:10px;background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:10px;font-weight:600;">Check out · Return</span>'

      return `
        <div style="display:flex;gap:12px;padding-bottom:8px;">
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:10px;height:10px;border-radius:50%;background:${isFirst || isLast ? '#2563eb' : dayEntries.length > 0 ? '#7c3aed' : '#e5e7eb'};flex-shrink:0;"></div>
            ${i < daysCount - 1 ? '<div style="width:2px;flex:1;background:#e5e7eb;min-height:16px;"></div>' : ''}
          </div>
          <div style="padding-bottom:4px;">
            <div style="font-size:13px;font-weight:700;">Day ${i + 1} · ${format(day, 'EEE d MMM')}</div>
            ${tagHtml}
            ${entriesHtml}
            ${dayEntries.length === 0 && !isFirst && !isLast ? '<div style="font-size:11px;color:#999;font-style:italic;">No plans yet</div>' : ''}
          </div>
        </div>`
    }).join('')

    const membersHtml = members.map((m: any) => {
      const name = m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.guest_name || 'Member'
      return `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#f8f9fa;border-radius:20px;font-size:12px;font-weight:500;margin:3px;">${name}</span>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; margin: 0; padding: 0; }
  * { box-sizing: border-box; }
</style></head>
<body>
  <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8,#7c3aed);padding:40px;text-align:center;color:white;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;opacity:0.6;margin-bottom:8px;">TripAmigos</div>
    <div style="font-size:28px;font-weight:700;margin-bottom:4px;">${trip.name}</div>
    ${bookingData.destination ? `<div style="font-size:16px;opacity:0.8;margin-bottom:8px;">${bookingData.destination}</div>` : ''}
    <div style="font-size:12px;opacity:0.6;">${format(startDate, 'EEE d MMM')} – ${format(endDate, 'EEE d MMM yyyy')} · ${daysCount} days · ${members.length} people</div>
  </div>
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    ${flightsHtml ? `<div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;"><div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:12px 20px;"><div style="font-size:12px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:1px;">Travel details</div></div>${flightsHtml}</div>` : ''}
    ${hotelHtml}
    <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:12px 20px;">
        <div style="font-size:12px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:1px;">Itinerary</div>
      </div>
      <div style="padding:20px;">${itineraryDays}</div>
    </div>
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Who's going</div>
      ${membersHtml}
    </div>
    <div style="text-align:center;font-size:10px;color:#999;padding:16px 0;border-top:1px solid #e5e7eb;">
      Planned with TripAmigos · tripamigos.co
    </div>
  </div>
</body>
</html>`

    // Return as HTML with print-friendly headers
    // The client can print-to-PDF or we can use this as a downloadable HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${trip.name.replace(/[^a-zA-Z0-9 ]/g, '')}_Itinerary.html"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate' }, { status: 500 })
  }
}
