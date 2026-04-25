/**
 * Travel hubs for TripAmigos
 * Used in the departure location dropdown on trip creation and preference forms.
 * Each hub has both an airport and station mapping where applicable.
 */

export interface TravelHub {
  city: string
  country: string
  airportCode?: string    // IATA code for flights
  airportName?: string    // e.g. "Heathrow"
  stationName?: string    // e.g. "London Euston"
  region: 'uk' | 'europe' | 'usa' | 'canada' | 'asia' | 'other'
}

// UK hubs (most detailed — primary market)
const ukHubs: TravelHub[] = [
  { city: 'London', country: 'UK', airportCode: 'LHR', airportName: 'Heathrow', stationName: 'London (multiple stations)', region: 'uk' },
  { city: 'London', country: 'UK', airportCode: 'LGW', airportName: 'Gatwick', region: 'uk' },
  { city: 'London', country: 'UK', airportCode: 'STN', airportName: 'Stansted', region: 'uk' },
  { city: 'London', country: 'UK', airportCode: 'LTN', airportName: 'Luton', region: 'uk' },
  { city: 'London', country: 'UK', airportCode: 'LCY', airportName: 'City', region: 'uk' },
  { city: 'Manchester', country: 'UK', airportCode: 'MAN', airportName: 'Manchester', stationName: 'Manchester Piccadilly', region: 'uk' },
  { city: 'Birmingham', country: 'UK', airportCode: 'BHX', airportName: 'Birmingham', stationName: 'Birmingham New Street', region: 'uk' },
  { city: 'Edinburgh', country: 'UK', airportCode: 'EDI', airportName: 'Edinburgh', stationName: 'Edinburgh Waverley', region: 'uk' },
  { city: 'Glasgow', country: 'UK', airportCode: 'GLA', airportName: 'Glasgow', stationName: 'Glasgow Central', region: 'uk' },
  { city: 'Liverpool', country: 'UK', airportCode: 'LPL', airportName: 'Liverpool', stationName: 'Liverpool Lime Street', region: 'uk' },
  { city: 'Bristol', country: 'UK', airportCode: 'BRS', airportName: 'Bristol', stationName: 'Bristol Temple Meads', region: 'uk' },
  { city: 'Leeds', country: 'UK', airportCode: 'LBA', airportName: 'Leeds Bradford', stationName: 'Leeds', region: 'uk' },
  { city: 'Newcastle', country: 'UK', airportCode: 'NCL', airportName: 'Newcastle', stationName: 'Newcastle Central', region: 'uk' },
  { city: 'Cardiff', country: 'UK', airportCode: 'CWL', airportName: 'Cardiff', stationName: 'Cardiff Central', region: 'uk' },
  { city: 'Belfast', country: 'UK', airportCode: 'BFS', airportName: 'Belfast International', stationName: 'Belfast Central', region: 'uk' },
  { city: 'Aberdeen', country: 'UK', airportCode: 'ABZ', airportName: 'Aberdeen', stationName: 'Aberdeen', region: 'uk' },
  { city: 'Nottingham', country: 'UK', airportCode: 'EMA', airportName: 'East Midlands', stationName: 'Nottingham', region: 'uk' },
  { city: 'Southampton', country: 'UK', airportCode: 'SOU', airportName: 'Southampton', stationName: 'Southampton Central', region: 'uk' },
  { city: 'York', country: 'UK', stationName: 'York', region: 'uk' },
  { city: 'Bath', country: 'UK', stationName: 'Bath Spa', region: 'uk' },
  { city: 'Brighton', country: 'UK', stationName: 'Brighton', region: 'uk' },
  { city: 'Oxford', country: 'UK', stationName: 'Oxford', region: 'uk' },
  { city: 'Cambridge', country: 'UK', stationName: 'Cambridge', region: 'uk' },
  { city: 'Bournemouth', country: 'UK', airportCode: 'BOH', airportName: 'Bournemouth', stationName: 'Bournemouth', region: 'uk' },
  { city: 'Exeter', country: 'UK', airportCode: 'EXT', airportName: 'Exeter', stationName: 'Exeter St Davids', region: 'uk' },
  { city: 'Inverness', country: 'UK', airportCode: 'INV', airportName: 'Inverness', stationName: 'Inverness', region: 'uk' },
  { city: 'Sheffield', country: 'UK', stationName: 'Sheffield', region: 'uk' },
  { city: 'Plymouth', country: 'UK', stationName: 'Plymouth', region: 'uk' },
]

// Europe hubs
const europeHubs: TravelHub[] = [
  { city: 'Paris', country: 'France', airportCode: 'CDG', airportName: 'Charles de Gaulle', stationName: 'Paris Gare du Nord', region: 'europe' },
  { city: 'Amsterdam', country: 'Netherlands', airportCode: 'AMS', airportName: 'Schiphol', stationName: 'Amsterdam Centraal', region: 'europe' },
  { city: 'Brussels', country: 'Belgium', airportCode: 'BRU', airportName: 'Brussels', stationName: 'Brussels Midi', region: 'europe' },
  { city: 'Berlin', country: 'Germany', airportCode: 'BER', airportName: 'Brandenburg', stationName: 'Berlin Hauptbahnhof', region: 'europe' },
  { city: 'Munich', country: 'Germany', airportCode: 'MUC', airportName: 'Munich', region: 'europe' },
  { city: 'Frankfurt', country: 'Germany', airportCode: 'FRA', airportName: 'Frankfurt', region: 'europe' },
  { city: 'Barcelona', country: 'Spain', airportCode: 'BCN', airportName: 'El Prat', region: 'europe' },
  { city: 'Madrid', country: 'Spain', airportCode: 'MAD', airportName: 'Barajas', region: 'europe' },
  { city: 'Rome', country: 'Italy', airportCode: 'FCO', airportName: 'Fiumicino', region: 'europe' },
  { city: 'Milan', country: 'Italy', airportCode: 'MXP', airportName: 'Malpensa', region: 'europe' },
  { city: 'Lisbon', country: 'Portugal', airportCode: 'LIS', airportName: 'Lisbon', region: 'europe' },
  { city: 'Dublin', country: 'Ireland', airportCode: 'DUB', airportName: 'Dublin', region: 'europe' },
  { city: 'Copenhagen', country: 'Denmark', airportCode: 'CPH', airportName: 'Copenhagen', region: 'europe' },
  { city: 'Stockholm', country: 'Sweden', airportCode: 'ARN', airportName: 'Arlanda', region: 'europe' },
  { city: 'Oslo', country: 'Norway', airportCode: 'OSL', airportName: 'Oslo', region: 'europe' },
  { city: 'Prague', country: 'Czech Republic', airportCode: 'PRG', airportName: 'Vaclav Havel', region: 'europe' },
  { city: 'Vienna', country: 'Austria', airportCode: 'VIE', airportName: 'Vienna', region: 'europe' },
  { city: 'Budapest', country: 'Hungary', airportCode: 'BUD', airportName: 'Budapest', region: 'europe' },
  { city: 'Warsaw', country: 'Poland', airportCode: 'WAW', airportName: 'Chopin', region: 'europe' },
  { city: 'Zurich', country: 'Switzerland', airportCode: 'ZRH', airportName: 'Zurich', region: 'europe' },
  { city: 'Geneva', country: 'Switzerland', airportCode: 'GVA', airportName: 'Geneva', region: 'europe' },
  { city: 'Istanbul', country: 'Turkey', airportCode: 'IST', airportName: 'Istanbul', region: 'europe' },
  { city: 'Athens', country: 'Greece', airportCode: 'ATH', airportName: 'Athens', region: 'europe' },
  { city: 'Helsinki', country: 'Finland', airportCode: 'HEL', airportName: 'Vantaa', region: 'europe' },
]

// USA hubs
const usaHubs: TravelHub[] = [
  { city: 'New York', country: 'USA', airportCode: 'JFK', airportName: 'JFK', region: 'usa' },
  { city: 'Los Angeles', country: 'USA', airportCode: 'LAX', airportName: 'LAX', region: 'usa' },
  { city: 'Chicago', country: 'USA', airportCode: 'ORD', airportName: "O'Hare", region: 'usa' },
  { city: 'San Francisco', country: 'USA', airportCode: 'SFO', airportName: 'SFO', region: 'usa' },
  { city: 'Miami', country: 'USA', airportCode: 'MIA', airportName: 'Miami', region: 'usa' },
  { city: 'Boston', country: 'USA', airportCode: 'BOS', airportName: 'Logan', region: 'usa' },
  { city: 'Washington DC', country: 'USA', airportCode: 'IAD', airportName: 'Dulles', region: 'usa' },
  { city: 'Atlanta', country: 'USA', airportCode: 'ATL', airportName: 'Hartsfield-Jackson', region: 'usa' },
  { city: 'Seattle', country: 'USA', airportCode: 'SEA', airportName: 'Seattle-Tacoma', region: 'usa' },
  { city: 'Dallas', country: 'USA', airportCode: 'DFW', airportName: 'Dallas Fort Worth', region: 'usa' },
  { city: 'Denver', country: 'USA', airportCode: 'DEN', airportName: 'Denver', region: 'usa' },
  { city: 'Houston', country: 'USA', airportCode: 'IAH', airportName: 'George Bush', region: 'usa' },
]

// Other international hubs
const otherHubs: TravelHub[] = [
  { city: 'Toronto', country: 'Canada', airportCode: 'YYZ', airportName: 'Pearson', region: 'canada' },
  { city: 'Vancouver', country: 'Canada', airportCode: 'YVR', airportName: 'Vancouver', region: 'canada' },
  { city: 'Montreal', country: 'Canada', airportCode: 'YUL', airportName: 'Trudeau', region: 'canada' },
  { city: 'Dubai', country: 'UAE', airportCode: 'DXB', airportName: 'Dubai International', region: 'other' },
  { city: 'Singapore', country: 'Singapore', airportCode: 'SIN', airportName: 'Changi', region: 'other' },
  { city: 'Hong Kong', country: 'Hong Kong', airportCode: 'HKG', airportName: 'Chek Lap Kok', region: 'other' },
  { city: 'Tokyo', country: 'Japan', airportCode: 'NRT', airportName: 'Narita', region: 'other' },
  { city: 'Sydney', country: 'Australia', airportCode: 'SYD', airportName: 'Kingsford Smith', region: 'other' },
  { city: 'Melbourne', country: 'Australia', airportCode: 'MEL', airportName: 'Tullamarine', region: 'other' },
  { city: 'Bangkok', country: 'Thailand', airportCode: 'BKK', airportName: 'Suvarnabhumi', region: 'other' },
  { city: 'Delhi', country: 'India', airportCode: 'DEL', airportName: 'Indira Gandhi', region: 'other' },
  { city: 'Mumbai', country: 'India', airportCode: 'BOM', airportName: 'Chhatrapati Shivaji', region: 'other' },
  { city: 'Cape Town', country: 'South Africa', airportCode: 'CPT', airportName: 'Cape Town', region: 'other' },
  { city: 'Auckland', country: 'New Zealand', airportCode: 'AKL', airportName: 'Auckland', region: 'other' },
]

export const allTravelHubs: TravelHub[] = [
  ...ukHubs,
  ...europeHubs,
  ...usaHubs,
  ...otherHubs,
]

/**
 * Search travel hubs by query string
 * Returns matching hubs, prioritising UK hubs first
 */
export function searchTravelHubs(query: string, mode: 'flight' | 'train' | 'any' = 'any'): TravelHub[] {
  const q = query.trim().toLowerCase()

  let hubs = allTravelHubs

  // For train mode, only show hubs that have stations
  if (mode === 'train') {
    hubs = hubs.filter(h => h.stationName)
  }

  // For flight mode, only show hubs that have airports
  if (mode === 'flight') {
    hubs = hubs.filter(h => h.airportCode)
  }

  if (!q) {
    // Show UK hubs first by default, then Europe
    return hubs
      .sort((a, b) => {
        const order = { uk: 0, europe: 1, usa: 2, canada: 3, asia: 4, other: 5 }
        return (order[a.region] || 5) - (order[b.region] || 5)
      })
      .slice(0, 10)
  }

  return hubs
    .filter(h =>
      h.city.toLowerCase().includes(q) ||
      h.country.toLowerCase().includes(q) ||
      (h.airportCode && h.airportCode.toLowerCase().includes(q)) ||
      (h.airportName && h.airportName.toLowerCase().includes(q)) ||
      (h.stationName && h.stationName.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      // Exact city match first
      const aExact = a.city.toLowerCase() === q ? 0 : 1
      const bExact = b.city.toLowerCase() === q ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
      // Then starts-with
      const aStarts = a.city.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.city.toLowerCase().startsWith(q) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      // UK first
      const order = { uk: 0, europe: 1, usa: 2, canada: 3, asia: 4, other: 5 }
      return (order[a.region] || 5) - (order[b.region] || 5)
    })
    .slice(0, 8)
}

/**
 * Get display label for a hub based on transport mode
 */
export function getHubLabel(hub: TravelHub, mode: 'flight' | 'train' | 'any'): string {
  if (mode === 'train' && hub.stationName) {
    return `${hub.city} — ${hub.stationName}`
  }
  if (mode === 'flight' && hub.airportName) {
    return `${hub.city} — ${hub.airportName} (${hub.airportCode})`
  }
  // Default
  if (hub.airportCode) return `${hub.city} (${hub.airportCode})`
  return hub.city
}

/**
 * Resolve a station name or city alias to a canonical city name
 * e.g. "Euston" → "London", "Kings Cross" → "London", "Piccadilly" → "Manchester"
 */
const STATION_ALIASES: Record<string, string> = {
  'euston': 'London',
  'kings cross': 'London',
  'paddington': 'London',
  'st pancras': 'London',
  'victoria': 'London',
  'waterloo': 'London',
  'liverpool street': 'London',
  'piccadilly': 'Manchester',
  'new street': 'Birmingham',
  'lime street': 'Liverpool',
  'waverley': 'Edinburgh',
  'temple meads': 'Bristol',
  'central': 'Glasgow',
}

export function resolveStationToCity(input: string): string {
  const lower = input.trim().toLowerCase()

  // Check aliases
  for (const [alias, city] of Object.entries(STATION_ALIASES)) {
    if (lower.includes(alias)) return city
  }

  // Check if it matches a hub city name directly
  const hub = allTravelHubs.find(h => h.city.toLowerCase() === lower)
  if (hub) return hub.city

  // Return as-is
  return input.trim()
}
