/**
 * Trainline integration for TripAmigos
 *
 * Currently uses realistic mock data mirroring the Trainline Partner API response format.
 * When Trainline API access is granted, swap generateMockResults() for real API calls.
 *
 * Revenue model: 3-20% commission per booking via Trainline Partner Solutions
 */

// =====================================================
// TYPES
// =====================================================

export interface TrainSearchParams {
  origin: string         // Station name e.g. 'London'
  destination: string    // Station name e.g. 'Edinburgh'
  departureDate: string  // YYYY-MM-DD
  returnDate: string     // YYYY-MM-DD
  passengers: number
}

export interface TrainJourney {
  id: string
  departureStation: string
  arrivalStation: string
  departureTime: string    // ISO datetime
  arrivalTime: string      // ISO datetime
  durationMinutes: number
  changes: number
  legs: TrainLeg[]
  operator: string
  operatorLogo: string | null
}

export interface TrainLeg {
  operator: string
  trainNumber: string
  departureStation: string
  arrivalStation: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  platform?: string
}

export interface TrainOption {
  id: string
  tier: string
  tierLabel: string
  outbound: TrainJourney
  returnJourney: TrainJourney
  ticketType: string         // 'Advance' | 'Off-Peak' | 'Anytime'
  ticketDescription: string
  class: 'standard' | 'first'
  pricePerPerson: number
  totalPrice: number
  currency: string
  passengers: number
  isFlexible: boolean
  refundable: boolean
  expiresAt: string
}

// =====================================================
// UK RAIL OPERATORS
// =====================================================

interface RailOperator {
  name: string
  code: string
  color: string
}

const UK_OPERATORS: Record<string, RailOperator> = {
  avanti: { name: 'Avanti West Coast', code: 'VT', color: '#00A651' },
  lner: { name: 'LNER', code: 'GR', color: '#CE0E2D' },
  gwr: { name: 'Great Western Railway', code: 'GW', color: '#0A493E' },
  crosscountry: { name: 'CrossCountry', code: 'XC', color: '#660F21' },
  scotrail: { name: 'ScotRail', code: 'SR', color: '#1A3567' },
  southeastern: { name: 'Southeastern', code: 'SE', color: '#00AEEF' },
  tpe: { name: 'TransPennine Express', code: 'TP', color: '#0019A8' },
  northern: { name: 'Northern', code: 'NT', color: '#0D0F56' },
  emi: { name: 'East Midlands Railway', code: 'EM', color: '#6B2C91' },
  thameslink: { name: 'Thameslink', code: 'TL', color: '#DA1F7C' },
  southern: { name: 'Southern', code: 'SN', color: '#8CC63E' },
  swrail: { name: 'South Western Railway', code: 'SW', color: '#24398C' },
  eurostar: { name: 'Eurostar', code: 'ES', color: '#003399' },
}

// =====================================================
// UK STATION MAPPING
// =====================================================

interface Station {
  name: string
  code: string   // National Rail station code
  city: string
}

const UK_STATIONS: Station[] = [
  // London terminals
  { name: 'London Euston', code: 'EUS', city: 'London' },
  { name: 'London Kings Cross', code: 'KGX', city: 'London' },
  { name: 'London Paddington', code: 'PAD', city: 'London' },
  { name: 'London St Pancras', code: 'STP', city: 'London' },
  { name: 'London Victoria', code: 'VIC', city: 'London' },
  { name: 'London Waterloo', code: 'WAT', city: 'London' },
  { name: 'London Liverpool Street', code: 'LST', city: 'London' },
  // Major cities
  { name: 'Edinburgh Waverley', code: 'EDB', city: 'Edinburgh' },
  { name: 'Glasgow Central', code: 'GLC', city: 'Glasgow' },
  { name: 'Manchester Piccadilly', code: 'MAN', city: 'Manchester' },
  { name: 'Birmingham New Street', code: 'BHM', city: 'Birmingham' },
  { name: 'Liverpool Lime Street', code: 'LIV', city: 'Liverpool' },
  { name: 'Leeds', code: 'LDS', city: 'Leeds' },
  { name: 'Bristol Temple Meads', code: 'BRI', city: 'Bristol' },
  { name: 'Newcastle', code: 'NCL', city: 'Newcastle' },
  { name: 'Cardiff Central', code: 'CDF', city: 'Cardiff' },
  { name: 'York', code: 'YRK', city: 'York' },
  { name: 'Bath Spa', code: 'BTH', city: 'Bath' },
  { name: 'Brighton', code: 'BTN', city: 'Brighton' },
  { name: 'Oxford', code: 'OXF', city: 'Oxford' },
  { name: 'Cambridge', code: 'CBG', city: 'Cambridge' },
  { name: 'Nottingham', code: 'NOT', city: 'Nottingham' },
  { name: 'Sheffield', code: 'SHF', city: 'Sheffield' },
  { name: 'Aberdeen', code: 'ABD', city: 'Aberdeen' },
  { name: 'Inverness', code: 'INV', city: 'Inverness' },
  { name: 'Bournemouth', code: 'BMH', city: 'Bournemouth' },
  { name: 'Southampton Central', code: 'SOU', city: 'Southampton' },
  { name: 'Exeter St Davids', code: 'EXD', city: 'Exeter' },
  { name: 'Plymouth', code: 'PLY', city: 'Plymouth' },
  { name: 'Penzance', code: 'PNZ', city: 'Cornwall' },
  // International
  { name: 'Paris Gare du Nord', code: 'FRPAR', city: 'Paris' },
  { name: 'Brussels Midi', code: 'BEBMI', city: 'Brussels' },
  { name: 'Amsterdam Centraal', code: 'NLAMC', city: 'Amsterdam' },
  { name: 'Lille Europe', code: 'FRLIL', city: 'Lille' },
]

// =====================================================
// ROUTE DATABASE (realistic journey data)
// =====================================================

interface RouteTemplate {
  origin: string
  destination: string
  operator: string
  durationMinutes: number
  changes: number
  viaStation?: string
  londonTerminal?: string
  advancePrice: number      // per person, cheapest
  offPeakPrice: number
  anytimePrice: number
  firstClassMultiplier: number
  frequency: number          // trains per day
}

const ROUTE_DATABASE: RouteTemplate[] = [
  // London routes
  { origin: 'London', destination: 'Edinburgh', operator: 'lner', durationMinutes: 262, changes: 0, londonTerminal: 'London Kings Cross', advancePrice: 30, offPeakPrice: 96, anytimePrice: 140, firstClassMultiplier: 1.8, frequency: 16 },
  { origin: 'London', destination: 'Manchester', operator: 'avanti', durationMinutes: 127, changes: 0, londonTerminal: 'London Euston', advancePrice: 22, offPeakPrice: 76, anytimePrice: 108, firstClassMultiplier: 1.7, frequency: 18 },
  { origin: 'London', destination: 'Birmingham', operator: 'avanti', durationMinutes: 82, changes: 0, londonTerminal: 'London Euston', advancePrice: 12, offPeakPrice: 40, anytimePrice: 65, firstClassMultiplier: 1.6, frequency: 24 },
  { origin: 'London', destination: 'Liverpool', operator: 'avanti', durationMinutes: 135, changes: 0, londonTerminal: 'London Euston', advancePrice: 26, offPeakPrice: 82, anytimePrice: 115, firstClassMultiplier: 1.7, frequency: 12 },
  { origin: 'London', destination: 'Leeds', operator: 'lner', durationMinutes: 132, changes: 0, londonTerminal: 'London Kings Cross', advancePrice: 22, offPeakPrice: 72, anytimePrice: 102, firstClassMultiplier: 1.8, frequency: 16 },
  { origin: 'London', destination: 'Bristol', operator: 'gwr', durationMinutes: 102, changes: 0, londonTerminal: 'London Paddington', advancePrice: 18, offPeakPrice: 56, anytimePrice: 86, firstClassMultiplier: 1.6, frequency: 20 },
  { origin: 'London', destination: 'Newcastle', operator: 'lner', durationMinutes: 180, changes: 0, londonTerminal: 'London Kings Cross', advancePrice: 25, offPeakPrice: 88, anytimePrice: 128, firstClassMultiplier: 1.8, frequency: 14 },
  { origin: 'London', destination: 'Cardiff', operator: 'gwr', durationMinutes: 125, changes: 0, londonTerminal: 'London Paddington', advancePrice: 22, offPeakPrice: 60, anytimePrice: 92, firstClassMultiplier: 1.6, frequency: 14 },
  { origin: 'London', destination: 'York', operator: 'lner', durationMinutes: 115, changes: 0, londonTerminal: 'London Kings Cross', advancePrice: 20, offPeakPrice: 68, anytimePrice: 96, firstClassMultiplier: 1.8, frequency: 16 },
  { origin: 'London', destination: 'Glasgow', operator: 'avanti', durationMinutes: 270, changes: 0, londonTerminal: 'London Euston', advancePrice: 35, offPeakPrice: 105, anytimePrice: 150, firstClassMultiplier: 1.8, frequency: 12 },
  { origin: 'London', destination: 'Bath', operator: 'gwr', durationMinutes: 88, changes: 0, londonTerminal: 'London Paddington', advancePrice: 16, offPeakPrice: 48, anytimePrice: 78, firstClassMultiplier: 1.6, frequency: 16 },
  { origin: 'London', destination: 'Brighton', operator: 'southern', durationMinutes: 60, changes: 0, londonTerminal: 'London Victoria', advancePrice: 10, offPeakPrice: 22, anytimePrice: 34, firstClassMultiplier: 1.4, frequency: 30 },
  { origin: 'London', destination: 'Oxford', operator: 'gwr', durationMinutes: 63, changes: 0, londonTerminal: 'London Paddington', advancePrice: 10, offPeakPrice: 28, anytimePrice: 44, firstClassMultiplier: 1.5, frequency: 24 },
  { origin: 'London', destination: 'Cambridge', operator: 'thameslink', durationMinutes: 55, changes: 0, londonTerminal: 'London Kings Cross', advancePrice: 8, offPeakPrice: 24, anytimePrice: 36, firstClassMultiplier: 1.4, frequency: 28 },
  { origin: 'London', destination: 'Nottingham', operator: 'emi', durationMinutes: 105, changes: 0, londonTerminal: 'London St Pancras', advancePrice: 16, offPeakPrice: 50, anytimePrice: 76, firstClassMultiplier: 1.5, frequency: 16 },
  { origin: 'London', destination: 'Bournemouth', operator: 'swrail', durationMinutes: 120, changes: 0, londonTerminal: 'London Waterloo', advancePrice: 14, offPeakPrice: 42, anytimePrice: 64, firstClassMultiplier: 1.5, frequency: 14 },
  { origin: 'London', destination: 'Cornwall', operator: 'gwr', durationMinutes: 310, changes: 0, londonTerminal: 'London Paddington', advancePrice: 35, offPeakPrice: 80, anytimePrice: 120, firstClassMultiplier: 1.6, frequency: 6 },
  { origin: 'London', destination: 'Aberdeen', operator: 'lner', durationMinutes: 432, changes: 1, viaStation: 'Edinburgh Waverley', londonTerminal: 'London Kings Cross', advancePrice: 40, offPeakPrice: 120, anytimePrice: 170, firstClassMultiplier: 1.8, frequency: 6 },
  { origin: 'London', destination: 'Inverness', operator: 'lner', durationMinutes: 510, changes: 1, viaStation: 'Edinburgh Waverley', londonTerminal: 'London Kings Cross', advancePrice: 45, offPeakPrice: 130, anytimePrice: 185, firstClassMultiplier: 1.8, frequency: 4 },
  { origin: 'London', destination: 'Lake District', operator: 'avanti', durationMinutes: 180, changes: 1, viaStation: 'Lancaster', londonTerminal: 'London Euston', advancePrice: 30, offPeakPrice: 85, anytimePrice: 120, firstClassMultiplier: 1.7, frequency: 8 },

  // Cross-country routes
  { origin: 'Manchester', destination: 'Edinburgh', operator: 'tpe', durationMinutes: 210, changes: 0, advancePrice: 22, offPeakPrice: 68, anytimePrice: 95, firstClassMultiplier: 1.6, frequency: 10 },
  { origin: 'Manchester', destination: 'Birmingham', operator: 'crosscountry', durationMinutes: 88, changes: 0, advancePrice: 12, offPeakPrice: 32, anytimePrice: 48, firstClassMultiplier: 1.5, frequency: 16 },
  { origin: 'Manchester', destination: 'Liverpool', operator: 'tpe', durationMinutes: 52, changes: 0, advancePrice: 6, offPeakPrice: 14, anytimePrice: 22, firstClassMultiplier: 1.4, frequency: 24 },
  { origin: 'Manchester', destination: 'Leeds', operator: 'tpe', durationMinutes: 55, changes: 0, advancePrice: 8, offPeakPrice: 18, anytimePrice: 28, firstClassMultiplier: 1.4, frequency: 22 },
  { origin: 'Manchester', destination: 'Newcastle', operator: 'tpe', durationMinutes: 165, changes: 0, advancePrice: 18, offPeakPrice: 56, anytimePrice: 78, firstClassMultiplier: 1.6, frequency: 10 },
  { origin: 'Manchester', destination: 'Glasgow', operator: 'tpe', durationMinutes: 210, changes: 0, advancePrice: 22, offPeakPrice: 70, anytimePrice: 95, firstClassMultiplier: 1.6, frequency: 8 },
  { origin: 'Manchester', destination: 'Bristol', operator: 'crosscountry', durationMinutes: 175, changes: 1, viaStation: 'Birmingham New Street', advancePrice: 22, offPeakPrice: 60, anytimePrice: 85, firstClassMultiplier: 1.5, frequency: 8 },
  { origin: 'Manchester', destination: 'York', operator: 'tpe', durationMinutes: 72, changes: 0, advancePrice: 10, offPeakPrice: 26, anytimePrice: 38, firstClassMultiplier: 1.4, frequency: 14 },

  { origin: 'Edinburgh', destination: 'Glasgow', operator: 'scotrail', durationMinutes: 52, changes: 0, advancePrice: 6, offPeakPrice: 16, anytimePrice: 26, firstClassMultiplier: 1.4, frequency: 30 },
  { origin: 'Edinburgh', destination: 'Aberdeen', operator: 'scotrail', durationMinutes: 152, changes: 0, advancePrice: 14, offPeakPrice: 40, anytimePrice: 58, firstClassMultiplier: 1.5, frequency: 12 },
  { origin: 'Edinburgh', destination: 'Inverness', operator: 'scotrail', durationMinutes: 215, changes: 0, advancePrice: 18, offPeakPrice: 52, anytimePrice: 72, firstClassMultiplier: 1.5, frequency: 8 },
  { origin: 'Edinburgh', destination: 'Newcastle', operator: 'lner', durationMinutes: 90, changes: 0, advancePrice: 12, offPeakPrice: 36, anytimePrice: 52, firstClassMultiplier: 1.6, frequency: 14 },

  { origin: 'Birmingham', destination: 'Bristol', operator: 'crosscountry', durationMinutes: 85, changes: 0, advancePrice: 10, offPeakPrice: 30, anytimePrice: 46, firstClassMultiplier: 1.5, frequency: 14 },
  { origin: 'Birmingham', destination: 'Edinburgh', operator: 'crosscountry', durationMinutes: 265, changes: 0, advancePrice: 28, offPeakPrice: 80, anytimePrice: 115, firstClassMultiplier: 1.6, frequency: 8 },
  { origin: 'Birmingham', destination: 'Leeds', operator: 'crosscountry', durationMinutes: 120, changes: 0, advancePrice: 14, offPeakPrice: 40, anytimePrice: 58, firstClassMultiplier: 1.5, frequency: 10 },
  { origin: 'Birmingham', destination: 'Newcastle', operator: 'crosscountry', durationMinutes: 195, changes: 0, advancePrice: 22, offPeakPrice: 64, anytimePrice: 90, firstClassMultiplier: 1.6, frequency: 8 },
  { origin: 'Birmingham', destination: 'Cardiff', operator: 'crosscountry', durationMinutes: 120, changes: 0, advancePrice: 12, offPeakPrice: 34, anytimePrice: 52, firstClassMultiplier: 1.5, frequency: 10 },

  { origin: 'Leeds', destination: 'Newcastle', operator: 'tpe', durationMinutes: 90, changes: 0, advancePrice: 10, offPeakPrice: 28, anytimePrice: 42, firstClassMultiplier: 1.5, frequency: 12 },
  { origin: 'Leeds', destination: 'York', operator: 'tpe', durationMinutes: 25, changes: 0, advancePrice: 4, offPeakPrice: 10, anytimePrice: 16, firstClassMultiplier: 1.4, frequency: 30 },

  { origin: 'Bristol', destination: 'Cardiff', operator: 'gwr', durationMinutes: 55, changes: 0, advancePrice: 8, offPeakPrice: 18, anytimePrice: 28, firstClassMultiplier: 1.4, frequency: 18 },
  { origin: 'Bristol', destination: 'Bath', operator: 'gwr', durationMinutes: 15, changes: 0, advancePrice: 4, offPeakPrice: 8, anytimePrice: 12, firstClassMultiplier: 1.4, frequency: 36 },

  { origin: 'Newcastle', destination: 'York', operator: 'lner', durationMinutes: 58, changes: 0, advancePrice: 8, offPeakPrice: 22, anytimePrice: 34, firstClassMultiplier: 1.5, frequency: 16 },

  // Eurostar routes (from London St Pancras)
  { origin: 'London', destination: 'Paris', operator: 'eurostar', durationMinutes: 136, changes: 0, londonTerminal: 'London St Pancras', advancePrice: 39, offPeakPrice: 89, anytimePrice: 175, firstClassMultiplier: 2.2, frequency: 14 },
  { origin: 'London', destination: 'Brussels', operator: 'eurostar', durationMinutes: 120, changes: 0, londonTerminal: 'London St Pancras', advancePrice: 35, offPeakPrice: 79, anytimePrice: 165, firstClassMultiplier: 2.2, frequency: 10 },
  { origin: 'London', destination: 'Amsterdam', operator: 'eurostar', durationMinutes: 230, changes: 0, londonTerminal: 'London St Pancras', advancePrice: 40, offPeakPrice: 95, anytimePrice: 185, firstClassMultiplier: 2.2, frequency: 4 },
]

// =====================================================
// SEARCH TRAINS (mock implementation)
// =====================================================

export async function searchTrains(params: TrainSearchParams): Promise<TrainOption[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

  const { origin, destination, departureDate, returnDate, passengers } = params

  // Find matching routes (check both directions)
  const originCity = normaliseCity(origin)
  const destCity = normaliseCity(destination)

  let route = ROUTE_DATABASE.find(
    r => normaliseCity(r.origin) === originCity && normaliseCity(r.destination) === destCity
  )
  let reversed = false

  if (!route) {
    route = ROUTE_DATABASE.find(
      r => normaliseCity(r.origin) === destCity && normaliseCity(r.destination) === originCity
    )
    reversed = true
  }

  if (!route) return []

  const operator = UK_OPERATORS[route.operator]
  if (!operator) return []

  // Generate departure times throughout the day
  const departureTimes = generateDepartureTimes(route.frequency)
  const returnTimes = generateDepartureTimes(route.frequency)

  // Build 3 tier options
  const options: TrainOption[] = []

  // Pick good outbound/return times
  const morningDeparture = departureTimes.find(t => t >= 7 && t <= 10) || departureTimes[2]
  const middayDeparture = departureTimes.find(t => t >= 10 && t <= 13) || departureTimes[4]
  const afternoonReturn = returnTimes.find(t => t >= 15 && t <= 18) || returnTimes[returnTimes.length - 3]
  const eveningReturn = returnTimes.find(t => t >= 17 && t <= 20) || returnTimes[returnTimes.length - 2]

  const originStation = findStation(reversed ? destination : origin, route.londonTerminal)
  const destStation = findStation(reversed ? origin : destination)

  const actualOrigin = reversed ? destStation : originStation
  const actualDest = reversed ? originStation : destStation

  // Price variation (+/- 15%)
  const priceVariation = 0.85 + Math.random() * 0.3

  // Option 1: Best value (Advance, cheapest)
  const advancePrice = Math.round(route.advancePrice * priceVariation)
  options.push(buildOption({
    id: `train_advance_${Date.now()}`,
    tier: 'best-value',
    tierLabel: 'Best value',
    route,
    operator,
    originStation: actualOrigin,
    destStation: actualDest,
    departureDate,
    returnDate,
    outboundHour: morningDeparture,
    returnHour: eveningReturn,
    ticketType: 'Advance',
    ticketDescription: 'Cheapest fare — specific train only, non-refundable',
    class: 'standard',
    pricePerPerson: advancePrice,
    passengers,
    isFlexible: false,
    refundable: false,
    reversed,
  }))

  // Option 2: Recommended (Off-Peak, some flexibility)
  const offPeakPrice = Math.round(route.offPeakPrice * priceVariation)
  options.push(buildOption({
    id: `train_offpeak_${Date.now()}`,
    tier: 'recommended',
    tierLabel: 'Recommended',
    route,
    operator,
    originStation: actualOrigin,
    destStation: actualDest,
    departureDate,
    returnDate,
    outboundHour: middayDeparture,
    returnHour: afternoonReturn,
    ticketType: 'Off-Peak',
    ticketDescription: 'Flexible — travel on any off-peak service',
    class: 'standard',
    pricePerPerson: offPeakPrice,
    passengers,
    isFlexible: true,
    refundable: false,
    reversed,
  }))

  // Option 3: Premium (First Class Anytime)
  const firstPrice = Math.round(route.anytimePrice * route.firstClassMultiplier * priceVariation)
  options.push(buildOption({
    id: `train_first_${Date.now()}`,
    tier: 'premium',
    tierLabel: 'Premium',
    route,
    operator,
    originStation: actualOrigin,
    destStation: actualDest,
    departureDate,
    returnDate,
    outboundHour: morningDeparture,
    returnHour: afternoonReturn,
    ticketType: 'Anytime',
    ticketDescription: 'Maximum flexibility — any train, fully refundable, First Class',
    class: 'first',
    pricePerPerson: firstPrice,
    passengers,
    isFlexible: true,
    refundable: true,
    reversed,
  }))

  return options
}

// =====================================================
// Check if a route is available for train travel
// =====================================================

export function isTrainRouteAvailable(origin: string, destination: string): boolean {
  const originCity = normaliseCity(origin)
  const destCity = normaliseCity(destination)

  return ROUTE_DATABASE.some(
    r =>
      (normaliseCity(r.origin) === originCity && normaliseCity(r.destination) === destCity) ||
      (normaliseCity(r.origin) === destCity && normaliseCity(r.destination) === originCity)
  )
}

/**
 * Get all cities that have train routes
 */
export function getTrainCities(): string[] {
  const cities = new Set<string>()
  ROUTE_DATABASE.forEach(r => {
    cities.add(r.origin)
    cities.add(r.destination)
  })
  return Array.from(cities).sort()
}

// =====================================================
// HELPERS
// =====================================================

// Station name aliases → canonical city name
const STATION_TO_CITY: Record<string, string> = {
  'euston': 'london',
  'kings cross': 'london',
  'king\'s cross': 'london',
  'paddington': 'london',
  'st pancras': 'london',
  'victoria': 'london',
  'waterloo': 'london',
  'liverpool street': 'london',
  'piccadilly': 'manchester',
  'manchester piccadilly': 'manchester',
  'new street': 'birmingham',
  'birmingham new street': 'birmingham',
  'lime street': 'liverpool',
  'liverpool lime street': 'liverpool',
  'waverley': 'edinburgh',
  'edinburgh waverley': 'edinburgh',
  'temple meads': 'bristol',
  'bristol temple meads': 'bristol',
  'glasgow central': 'glasgow',
  'cardiff central': 'cardiff',
  'leeds bradford': 'leeds',
  'bath spa': 'bath',
  'newcastle central': 'newcastle',
  'london kings cross': 'london',
  'london euston': 'london',
  'london paddington': 'london',
  'london st pancras': 'london',
  'london victoria': 'london',
  'london waterloo': 'london',
  'london liverpool street': 'london',
}

function normaliseCity(input: string): string {
  // Strip country suffix e.g. "Edinburgh, Scotland" → "Edinburgh"
  const raw = input.split(',')[0].trim().toLowerCase()

  // Check station name aliases
  if (STATION_TO_CITY[raw]) return STATION_TO_CITY[raw]

  // Partial match for station names
  for (const [alias, city] of Object.entries(STATION_TO_CITY)) {
    if (raw.includes(alias) || alias.includes(raw)) return city
  }

  return raw
}

function findStation(city: string, preferredTerminal?: string): Station {
  const cityNorm = normaliseCity(city)

  if (preferredTerminal) {
    const terminal = UK_STATIONS.find(s => s.name === preferredTerminal)
    if (terminal) return terminal
  }

  const match = UK_STATIONS.find(s => s.city.toLowerCase() === cityNorm)
  return match || { name: city, code: 'UNK', city }
}

function generateDepartureTimes(frequency: number): number[] {
  const times: number[] = []
  const startHour = 6
  const endHour = 22
  const interval = (endHour - startHour) / Math.min(frequency, 20)

  for (let h = startHour; h < endHour; h += interval) {
    // Add slight random offset (within 15 mins)
    const mins = Math.floor(Math.random() * 4) * 15
    times.push(Math.floor(h) + mins / 60)
  }

  return times.slice(0, Math.min(frequency, 16))
}

function hourToTimeString(hour: number, dateStr: string): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function addMinutes(isoString: string, minutes: number): string {
  const date = new Date(isoString)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

interface BuildOptionParams {
  id: string
  tier: string
  tierLabel: string
  route: RouteTemplate
  operator: RailOperator
  originStation: Station
  destStation: Station
  departureDate: string
  returnDate: string
  outboundHour: number
  returnHour: number
  ticketType: string
  ticketDescription: string
  class: 'standard' | 'first'
  pricePerPerson: number
  passengers: number
  isFlexible: boolean
  refundable: boolean
  reversed: boolean
}

function buildOption(p: BuildOptionParams): TrainOption {
  const outboundDep = hourToTimeString(p.outboundHour, p.departureDate)
  const outboundArr = addMinutes(outboundDep, p.route.durationMinutes)

  const returnDep = hourToTimeString(p.returnHour, p.returnDate)
  const returnArr = addMinutes(returnDep, p.route.durationMinutes)

  // Build legs
  const buildLegs = (depTime: string, arrTime: string, fromStation: Station, toStation: Station): TrainLeg[] => {
    if (p.route.changes === 0) {
      return [{
        operator: p.operator.name,
        trainNumber: `${p.operator.code}${1000 + Math.floor(Math.random() * 9000)}`,
        departureStation: fromStation.name,
        arrivalStation: toStation.name,
        departureTime: depTime,
        arrivalTime: arrTime,
        durationMinutes: p.route.durationMinutes,
        platform: String(Math.floor(Math.random() * 12) + 1),
      }]
    }

    // With a change
    const viaStation = UK_STATIONS.find(s => s.name === p.route.viaStation) || { name: p.route.viaStation || 'Via', code: 'VIA', city: 'Via' }
    const firstLegDuration = Math.floor(p.route.durationMinutes * 0.6)
    const changeDuration = 15
    const secondLegDuration = p.route.durationMinutes - firstLegDuration - changeDuration

    const firstArr = addMinutes(depTime, firstLegDuration)
    const secondDep = addMinutes(firstArr, changeDuration)

    return [
      {
        operator: p.operator.name,
        trainNumber: `${p.operator.code}${1000 + Math.floor(Math.random() * 9000)}`,
        departureStation: fromStation.name,
        arrivalStation: viaStation.name,
        departureTime: depTime,
        arrivalTime: firstArr,
        durationMinutes: firstLegDuration,
        platform: String(Math.floor(Math.random() * 12) + 1),
      },
      {
        operator: p.operator.name,
        trainNumber: `${p.operator.code}${1000 + Math.floor(Math.random() * 9000)}`,
        departureStation: viaStation.name,
        arrivalStation: toStation.name,
        departureTime: secondDep,
        arrivalTime: arrTime,
        durationMinutes: secondLegDuration,
        platform: String(Math.floor(Math.random() * 12) + 1),
      },
    ]
  }

  const outboundLegs = buildLegs(outboundDep, outboundArr, p.originStation, p.destStation)
  const returnLegs = buildLegs(returnDep, returnArr, p.destStation, p.originStation)

  // Expires 30 mins from now for mock
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  return {
    id: p.id,
    tier: p.tier,
    tierLabel: p.tierLabel,
    outbound: {
      id: `${p.id}_out`,
      departureStation: p.originStation.name,
      arrivalStation: p.destStation.name,
      departureTime: outboundDep,
      arrivalTime: outboundArr,
      durationMinutes: p.route.durationMinutes,
      changes: p.route.changes,
      legs: outboundLegs,
      operator: p.operator.name,
      operatorLogo: null,
    },
    returnJourney: {
      id: `${p.id}_ret`,
      departureStation: p.destStation.name,
      arrivalStation: p.originStation.name,
      departureTime: returnDep,
      arrivalTime: returnArr,
      durationMinutes: p.route.durationMinutes,
      changes: p.route.changes,
      legs: returnLegs,
      operator: p.operator.name,
      operatorLogo: null,
    },
    ticketType: p.ticketType,
    ticketDescription: p.ticketDescription,
    class: p.class,
    pricePerPerson: p.pricePerPerson,
    totalPrice: p.pricePerPerson * p.passengers,
    currency: 'GBP',
    passengers: p.passengers,
    isFlexible: p.isFlexible,
    refundable: p.refundable,
    expiresAt,
  }
}

/**
 * Format minutes to human-readable duration
 */
export function formatTrainDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
