/**
 * Booking.com hotel integration for TripAmigos
 *
 * MVP approach: mock data structured to match the Booking.com Demand API v3 response format.
 * When you get affiliate credentials, swap searchHotels() internals to hit the real API.
 *
 * Real API docs: https://developers.booking.com/demand/docs/open-api/demand-api
 * Sign up: https://partnerships.booking.com/
 */

export const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || ''

// =====================================================
// TYPES (mirrors Demand API response shape)
// =====================================================

export interface HotelOption {
  id: string
  name: string
  starRating: number
  reviewScore: number
  reviewCount: number
  reviewWord: string
  address: string
  city: string
  country: string
  photoUrl: string
  amenities: string[]
  distanceFromCentre: string
  pricePerNight: number
  totalPrice: number
  currency: string
  nights: number
  guests: number
  rooms: number
  roomType: string
  freeCancellation: boolean
  breakfastIncluded: boolean
  bookingUrl: string
  tier: 'budget' | 'mid-range' | 'premium'
  tierLabel: string
}

// =====================================================
// HOTEL DATABASE — realistic mock data per destination
// =====================================================

interface HotelTemplate {
  name: string
  starRating: number
  reviewScore: number
  reviewCount: number
  reviewWord: string
  amenities: string[]
  distanceFromCentre: string
  roomType: string
  freeCancellation: boolean
  breakfastIncluded: boolean
  tier: 'budget' | 'mid-range' | 'premium'
  basePricePerNight: number // per room
  photoSlug: string
}

// Hotels for major destinations — 3 tiers per city
const HOTEL_DATA: Record<string, { country: string; hotels: HotelTemplate[] }> = {
  'Barcelona': {
    country: 'Spain',
    hotels: [
      {
        name: 'Generator Barcelona',
        starRating: 3,
        reviewScore: 8.1,
        reviewCount: 4230,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Bar', 'Terrace', 'Shared kitchen', '24h reception'],
        distanceFromCentre: '0.8 km from centre',
        roomType: 'Private room (4 beds)',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 32,
        photoSlug: 'generator-bcn',
      },
      {
        name: 'Hotel Jazz Barcelona',
        starRating: 4,
        reviewScore: 8.6,
        reviewCount: 3180,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Rooftop pool', 'Gym', 'Bar', 'Air conditioning', 'City views'],
        distanceFromCentre: '0.3 km from centre',
        roomType: 'Superior twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 145,
        photoSlug: 'jazz-bcn',
      },
      {
        name: 'Hotel Arts Barcelona',
        starRating: 5,
        reviewScore: 9.2,
        reviewCount: 2740,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Infinity pool', 'Fine dining', 'Beach access', 'Concierge', 'Gym'],
        distanceFromCentre: '1.2 km from centre',
        roomType: 'Deluxe sea view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 380,
        photoSlug: 'arts-bcn',
      },
    ],
  },
  'Amsterdam': {
    country: 'Netherlands',
    hotels: [
      {
        name: 'ClinkNOORD Amsterdam',
        starRating: 3,
        reviewScore: 8.0,
        reviewCount: 5120,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Bar', 'Games room', 'Café', '24h reception'],
        distanceFromCentre: '1.5 km from centre',
        roomType: 'Private 4-bed room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 38,
        photoSlug: 'clink-ams',
      },
      {
        name: 'DoubleTree by Hilton Amsterdam Centraal',
        starRating: 4,
        reviewScore: 8.4,
        reviewCount: 2890,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Gym', 'Restaurant', 'Bar', 'Air conditioning', 'Canal views'],
        distanceFromCentre: '0.2 km from centre',
        roomType: 'Twin guest room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 185,
        photoSlug: 'doubletree-ams',
      },
      {
        name: 'Waldorf Astoria Amsterdam',
        starRating: 5,
        reviewScore: 9.4,
        reviewCount: 1480,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Pool', 'Michelin restaurant', 'Canal-side', 'Butler service', 'Gym'],
        distanceFromCentre: '0.4 km from centre',
        roomType: 'King canal view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 520,
        photoSlug: 'waldorf-ams',
      },
    ],
  },
  'Paris': {
    country: 'France',
    hotels: [
      {
        name: 'Generator Paris',
        starRating: 3,
        reviewScore: 7.8,
        reviewCount: 6340,
        reviewWord: 'Good',
        amenities: ['Wi-Fi', 'Bar', 'Terrace', 'Café', '24h reception'],
        distanceFromCentre: '2.5 km from centre',
        roomType: 'Private quad room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 35,
        photoSlug: 'generator-paris',
      },
      {
        name: 'Hôtel Le Compostelle',
        starRating: 4,
        reviewScore: 8.7,
        reviewCount: 2150,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Bar', 'Air conditioning', 'Concierge', 'Near Champs-Élysées'],
        distanceFromCentre: '0.5 km from centre',
        roomType: 'Classic twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 195,
        photoSlug: 'compostelle-paris',
      },
      {
        name: 'Le Meurice – Dorchester Collection',
        starRating: 5,
        reviewScore: 9.5,
        reviewCount: 980,
        reviewWord: 'Exceptional',
        amenities: ['Wi-Fi', 'Spa', 'Michelin restaurant', 'Tuileries views', 'Butler', 'Gym', 'Concierge'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Deluxe room with garden view',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 680,
        photoSlug: 'meurice-paris',
      },
    ],
  },
  'Rome': {
    country: 'Italy',
    hotels: [
      {
        name: 'The Yellow Hostel',
        starRating: 3,
        reviewScore: 8.2,
        reviewCount: 3780,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Bar', 'Terrace', 'Air conditioning', 'Near Termini'],
        distanceFromCentre: '1.0 km from centre',
        roomType: 'Private room (4 beds)',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 28,
        photoSlug: 'yellow-rome',
      },
      {
        name: 'Hotel Artemide',
        starRating: 4,
        reviewScore: 9.0,
        reviewCount: 4560,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Rooftop bar', 'Restaurant', 'Air conditioning', 'Gym'],
        distanceFromCentre: '0.3 km from centre',
        roomType: 'Superior twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 165,
        photoSlug: 'artemide-rome',
      },
      {
        name: 'Hotel de Russie – Rocco Forte',
        starRating: 5,
        reviewScore: 9.3,
        reviewCount: 1250,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Secret garden', 'Fine dining', 'Gym', 'Concierge', 'Piazza del Popolo'],
        distanceFromCentre: '0.2 km from centre',
        roomType: 'Deluxe garden room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 490,
        photoSlug: 'russie-rome',
      },
    ],
  },
  'Lisbon': {
    country: 'Portugal',
    hotels: [
      {
        name: 'Lisbon Destination Hostel',
        starRating: 3,
        reviewScore: 8.5,
        reviewCount: 2890,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Bar', 'Common area', 'Walking tours', '24h reception'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Private quad room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 25,
        photoSlug: 'destination-lisbon',
      },
      {
        name: 'Hotel do Chiado',
        starRating: 4,
        reviewScore: 8.8,
        reviewCount: 1920,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Rooftop terrace', 'Bar', 'Air conditioning', 'City views', 'Restaurant'],
        distanceFromCentre: '0.3 km from centre',
        roomType: 'Classic twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 135,
        photoSlug: 'chiado-lisbon',
      },
      {
        name: 'Four Seasons Hotel Ritz Lisbon',
        starRating: 5,
        reviewScore: 9.1,
        reviewCount: 1640,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Pool', 'Fine dining', 'Park views', 'Gym', 'Concierge'],
        distanceFromCentre: '1.5 km from centre',
        roomType: 'Deluxe park view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 420,
        photoSlug: 'ritz-lisbon',
      },
    ],
  },
  'Prague': {
    country: 'Czech Republic',
    hotels: [
      {
        name: 'Mosaic House Prague',
        starRating: 3,
        reviewScore: 8.3,
        reviewCount: 3420,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Bar', 'Music lounge', 'Eco-friendly', '24h reception'],
        distanceFromCentre: '0.8 km from centre',
        roomType: 'Private room (4 beds)',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 22,
        photoSlug: 'mosaic-prague',
      },
      {
        name: 'Moods Charles Bridge',
        starRating: 4,
        reviewScore: 8.9,
        reviewCount: 1870,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Bar', 'Air conditioning', 'Near Charles Bridge', 'Concierge'],
        distanceFromCentre: '0.2 km from centre',
        roomType: 'Superior twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 110,
        photoSlug: 'moods-prague',
      },
      {
        name: 'Four Seasons Hotel Prague',
        starRating: 5,
        reviewScore: 9.4,
        reviewCount: 1120,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Vltava views', 'Fine dining', 'Gym', 'Concierge'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Deluxe river view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 350,
        photoSlug: 'fourseasons-prague',
      },
    ],
  },
  'London': {
    country: 'England',
    hotels: [
      {
        name: 'Point A Hotel London Kings Cross',
        starRating: 3,
        reviewScore: 7.9,
        reviewCount: 5640,
        reviewWord: 'Good',
        amenities: ['Wi-Fi', 'Smart TV', 'Air conditioning', '24h reception', 'Near Kings Cross'],
        distanceFromCentre: '1.2 km from centre',
        roomType: 'Twin room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 75,
        photoSlug: 'pointa-london',
      },
      {
        name: 'The Hoxton Shoreditch',
        starRating: 4,
        reviewScore: 8.5,
        reviewCount: 3210,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Restaurant', 'Bar', 'Coworking', 'Air conditioning'],
        distanceFromCentre: '2.0 km from centre',
        roomType: 'Cosy twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 175,
        photoSlug: 'hoxton-london',
      },
      {
        name: 'The Savoy',
        starRating: 5,
        reviewScore: 9.3,
        reviewCount: 2890,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Pool', 'Thames views', 'Fine dining', 'Butler', 'Gym'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Deluxe river view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 580,
        photoSlug: 'savoy-london',
      },
    ],
  },
  'Edinburgh': {
    country: 'Scotland',
    hotels: [
      {
        name: 'CODE Pod Hostel Edinburgh',
        starRating: 3,
        reviewScore: 8.4,
        reviewCount: 2340,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Lounge', 'Kitchen', 'Lockers', '24h reception'],
        distanceFromCentre: '0.5 km from centre',
        roomType: 'Private pod room (4 beds)',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 42,
        photoSlug: 'code-edinburgh',
      },
      {
        name: 'Apex Grassmarket Hotel',
        starRating: 4,
        reviewScore: 8.7,
        reviewCount: 2670,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Spa', 'Gym', 'Restaurant', 'Castle views', 'Air conditioning'],
        distanceFromCentre: '0.3 km from centre',
        roomType: 'Classic twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 140,
        photoSlug: 'apex-edinburgh',
      },
      {
        name: 'The Balmoral – Rocco Forte',
        starRating: 5,
        reviewScore: 9.2,
        reviewCount: 1890,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Pool', 'Michelin restaurant', 'Castle views', 'Concierge', 'Gym'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Classic room with castle view',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 340,
        photoSlug: 'balmoral-edinburgh',
      },
    ],
  },
  'Dublin': {
    country: 'Ireland',
    hotels: [
      {
        name: 'Generator Dublin',
        starRating: 3,
        reviewScore: 7.9,
        reviewCount: 3120,
        reviewWord: 'Good',
        amenities: ['Wi-Fi', 'Bar', 'Café', 'Common area', '24h reception'],
        distanceFromCentre: '1.0 km from centre',
        roomType: 'Private quad room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 35,
        photoSlug: 'generator-dublin',
      },
      {
        name: 'The Dean Dublin',
        starRating: 4,
        reviewScore: 8.6,
        reviewCount: 2450,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Rooftop bar', 'Restaurant', 'Gym', 'Record players in rooms'],
        distanceFromCentre: '0.4 km from centre',
        roomType: 'Loft twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 155,
        photoSlug: 'dean-dublin',
      },
      {
        name: 'The Shelbourne – Autograph Collection',
        starRating: 5,
        reviewScore: 9.1,
        reviewCount: 1780,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Pool', 'Fine dining', 'St Stephen\'s Green views', 'Concierge'],
        distanceFromCentre: '0.2 km from centre',
        roomType: 'Deluxe park view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 390,
        photoSlug: 'shelbourne-dublin',
      },
    ],
  },
  'New York': {
    country: 'USA',
    hotels: [
      {
        name: 'Pod 51 Hotel',
        starRating: 3,
        reviewScore: 7.7,
        reviewCount: 4870,
        reviewWord: 'Good',
        amenities: ['Wi-Fi', 'Rooftop', 'Café', 'Air conditioning', 'Near Midtown'],
        distanceFromCentre: '1.5 km from centre',
        roomType: 'Queen pod room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 95,
        photoSlug: 'pod51-nyc',
      },
      {
        name: 'Arlo Midtown',
        starRating: 4,
        reviewScore: 8.3,
        reviewCount: 2340,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Rooftop bar', 'Restaurant', 'Gym', 'Near Times Square'],
        distanceFromCentre: '0.5 km from centre',
        roomType: 'King city view room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'mid-range',
        basePricePerNight: 220,
        photoSlug: 'arlo-nyc',
      },
      {
        name: 'The Plaza Hotel',
        starRating: 5,
        reviewScore: 9.0,
        reviewCount: 3150,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Gym', 'Fine dining', 'Central Park views', 'Butler', 'Concierge'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Deluxe park view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 750,
        photoSlug: 'plaza-nyc',
      },
    ],
  },
  'Cancun': {
    country: 'Mexico',
    hotels: [
      {
        name: 'Hostel Mundo Joven Cancún',
        starRating: 3,
        reviewScore: 7.6,
        reviewCount: 1890,
        reviewWord: 'Good',
        amenities: ['Wi-Fi', 'Pool', 'Bar', 'Common area', '24h reception'],
        distanceFromCentre: '2.0 km from centre',
        roomType: 'Private room (4 beds)',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 22,
        photoSlug: 'mundo-cancun',
      },
      {
        name: 'Hyatt Ziva Cancún',
        starRating: 4,
        reviewScore: 8.8,
        reviewCount: 3450,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'All-inclusive', 'Beach', 'Pool', 'Spa', 'Multiple restaurants'],
        distanceFromCentre: '0.5 km from hotel zone',
        roomType: 'Ocean view twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 195,
        photoSlug: 'ziva-cancun',
      },
      {
        name: 'Ritz-Carlton Cancún',
        starRating: 5,
        reviewScore: 9.2,
        reviewCount: 2100,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'Private beach', 'Fine dining', 'Pool', 'Concierge', 'Gym'],
        distanceFromCentre: '0.3 km from hotel zone',
        roomType: 'Oceanfront deluxe room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 450,
        photoSlug: 'ritz-cancun',
      },
    ],
  },
  'Dubai': {
    country: 'UAE',
    hotels: [
      {
        name: 'Rove Downtown Dubai',
        starRating: 3,
        reviewScore: 8.4,
        reviewCount: 4560,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Pool', 'Gym', 'Restaurant', 'Near Burj Khalifa'],
        distanceFromCentre: '0.5 km from centre',
        roomType: 'Rover twin room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 55,
        photoSlug: 'rove-dubai',
      },
      {
        name: 'Address Downtown Dubai',
        starRating: 4,
        reviewScore: 8.9,
        reviewCount: 2870,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Burj Khalifa views', 'Gym'],
        distanceFromCentre: '0.1 km from centre',
        roomType: 'Fountain view room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 210,
        photoSlug: 'address-dubai',
      },
      {
        name: 'Burj Al Arab Jumeirah',
        starRating: 5,
        reviewScore: 9.5,
        reviewCount: 1560,
        reviewWord: 'Exceptional',
        amenities: ['Wi-Fi', 'Private beach', 'Spa', 'Butler', 'Fine dining', 'Pool', 'Helipad'],
        distanceFromCentre: '5.0 km from centre',
        roomType: 'Deluxe suite',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 1200,
        photoSlug: 'burj-dubai',
      },
    ],
  },
  'Bangkok': {
    country: 'Thailand',
    hotels: [
      {
        name: 'NapPark Hostel @ Khao San',
        starRating: 3,
        reviewScore: 8.0,
        reviewCount: 3890,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Café', 'Lounge', 'Air conditioning', 'Near Khao San Road'],
        distanceFromCentre: '2.0 km from centre',
        roomType: 'Private room (4 beds)',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 15,
        photoSlug: 'nappark-bangkok',
      },
      {
        name: 'Centara Grand at CentralWorld',
        starRating: 4,
        reviewScore: 8.7,
        reviewCount: 5230,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Sky bar', 'Gym', 'Air conditioning'],
        distanceFromCentre: '0.3 km from centre',
        roomType: 'Deluxe twin room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 85,
        photoSlug: 'centara-bangkok',
      },
      {
        name: 'Mandarin Oriental Bangkok',
        starRating: 5,
        reviewScore: 9.4,
        reviewCount: 1890,
        reviewWord: 'Superb',
        amenities: ['Wi-Fi', 'Spa', 'River views', 'Fine dining', 'Pool', 'Butler', 'Concierge'],
        distanceFromCentre: '1.5 km from centre',
        roomType: 'River wing deluxe room',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 280,
        photoSlug: 'mandarin-bangkok',
      },
    ],
  },
  'Bali': {
    country: 'Indonesia',
    hotels: [
      {
        name: 'Kos One Hostel Seminyak',
        starRating: 3,
        reviewScore: 8.1,
        reviewCount: 2340,
        reviewWord: 'Very good',
        amenities: ['Wi-Fi', 'Pool', 'Bar', 'Air conditioning', 'Near beach'],
        distanceFromCentre: '1.0 km from centre',
        roomType: 'Private twin room',
        freeCancellation: true,
        breakfastIncluded: false,
        tier: 'budget',
        basePricePerNight: 18,
        photoSlug: 'kosone-bali',
      },
      {
        name: 'Alila Seminyak',
        starRating: 4,
        reviewScore: 8.9,
        reviewCount: 1870,
        reviewWord: 'Excellent',
        amenities: ['Wi-Fi', 'Beach', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym'],
        distanceFromCentre: '0.3 km from beach',
        roomType: 'Deluxe ocean suite',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'mid-range',
        basePricePerNight: 140,
        photoSlug: 'alila-bali',
      },
      {
        name: 'Four Seasons Resort Bali at Jimbaran Bay',
        starRating: 5,
        reviewScore: 9.5,
        reviewCount: 1230,
        reviewWord: 'Exceptional',
        amenities: ['Wi-Fi', 'Private villas', 'Spa', 'Beach', 'Fine dining', 'Pool', 'Concierge'],
        distanceFromCentre: '0.1 km from beach',
        roomType: 'Garden villa',
        freeCancellation: true,
        breakfastIncluded: true,
        tier: 'premium',
        basePricePerNight: 450,
        photoSlug: 'fourseasons-bali',
      },
    ],
  },
}

// =====================================================
// SEARCH FUNCTION
// =====================================================

interface SearchParams {
  destination: string
  checkIn: string     // YYYY-MM-DD
  checkOut: string    // YYYY-MM-DD
  guests: number
  rooms?: number
}

/**
 * Search hotels for a destination.
 *
 * Currently returns mock data structured like the Booking.com Demand API response.
 * To go live: replace this function's internals with a real API call to
 * https://demandapi.booking.com/3.1/accommodations/search
 */
export async function searchHotels(params: SearchParams): Promise<HotelOption[]> {
  const { destination, checkIn, checkOut, guests, rooms: roomsParam } = params

  // Normalise destination (strip country suffix like "Barcelona, Spain")
  const city = destination.split(',')[0].trim()

  // Calculate nights
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Estimate rooms needed (2 guests per room, rounded up)
  const rooms = roomsParam || Math.ceil(guests / 2)

  // Simulate network delay (1-2 seconds)
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000))

  // Find hotel data for this city
  const cityData = HOTEL_DATA[city]

  if (!cityData) {
    // Generate generic hotels for destinations we don't have specific data for
    return generateGenericHotels(city, destination, nights, guests, rooms, checkIn, checkOut)
  }

  // Build hotel options with calculated pricing
  return cityData.hotels.map((hotel, index) => {
    // Add slight price variation for realism (±10%)
    const variation = 0.9 + Math.random() * 0.2
    const adjustedPrice = Math.round(hotel.basePricePerNight * variation)
    const totalPrice = adjustedPrice * nights * rooms

    const tierLabels: Record<string, string> = {
      'budget': 'Budget-friendly',
      'mid-range': 'Best for groups',
      'premium': 'Premium',
    }

    return {
      id: `hotel_${city.toLowerCase().replace(/\s+/g, '')}_${index}`,
      name: hotel.name,
      starRating: hotel.starRating,
      reviewScore: hotel.reviewScore,
      reviewCount: hotel.reviewCount,
      reviewWord: hotel.reviewWord,
      address: `${hotel.distanceFromCentre}`,
      city: city,
      country: cityData.country,
      photoUrl: `/api/hotels/photo?slug=${hotel.photoSlug}`,
      amenities: hotel.amenities,
      distanceFromCentre: hotel.distanceFromCentre,
      pricePerNight: adjustedPrice * rooms,
      totalPrice,
      currency: 'GBP',
      nights,
      guests,
      rooms,
      roomType: hotel.roomType,
      freeCancellation: hotel.freeCancellation,
      breakfastIncluded: hotel.breakfastIncluded,
      bookingUrl: generateBookingUrl(city, checkIn, checkOut, guests),
      tier: hotel.tier,
      tierLabel: tierLabels[hotel.tier],
    }
  })
}

/**
 * Generate generic hotel options for cities without specific data
 */
function generateGenericHotels(city: string, fullDestination: string, nights: number, guests: number, rooms: number, checkIn: string = '', checkOut: string = ''): HotelOption[] {
  const country = fullDestination.includes(',') ? fullDestination.split(',')[1].trim() : ''

  const templates = [
    {
      namePrefix: 'Central',
      nameSuffix: 'Hostel',
      starRating: 3,
      reviewScore: 7.8,
      reviewCount: 1200 + Math.floor(Math.random() * 2000),
      reviewWord: 'Good',
      amenities: ['Wi-Fi', 'Bar', 'Common area', '24h reception'],
      distanceFromCentre: '1.0 km from centre',
      roomType: 'Private room (4 beds)',
      tier: 'budget' as const,
      basePricePerNight: 30,
    },
    {
      namePrefix: 'Hotel',
      nameSuffix: 'Grand',
      starRating: 4,
      reviewScore: 8.5,
      reviewCount: 1500 + Math.floor(Math.random() * 2000),
      reviewWord: 'Very good',
      amenities: ['Wi-Fi', 'Restaurant', 'Bar', 'Gym', 'Air conditioning'],
      distanceFromCentre: '0.4 km from centre',
      roomType: 'Twin room',
      tier: 'mid-range' as const,
      basePricePerNight: 120,
    },
    {
      namePrefix: 'The',
      nameSuffix: 'Palace Hotel & Spa',
      starRating: 5,
      reviewScore: 9.1,
      reviewCount: 800 + Math.floor(Math.random() * 1000),
      reviewWord: 'Superb',
      amenities: ['Wi-Fi', 'Spa', 'Pool', 'Fine dining', 'Gym', 'Concierge'],
      distanceFromCentre: '0.2 km from centre',
      roomType: 'Deluxe room',
      tier: 'premium' as const,
      basePricePerNight: 300,
    },
  ]

  const tierLabels: Record<string, string> = {
    'budget': 'Budget-friendly',
    'mid-range': 'Best for groups',
    'premium': 'Premium',
  }

  return templates.map((t, index) => {
    const variation = 0.9 + Math.random() * 0.2
    const adjustedPrice = Math.round(t.basePricePerNight * variation)
    const totalPrice = adjustedPrice * nights * rooms
    const name = t.tier === 'mid-range'
      ? `${t.namePrefix} ${city} ${t.nameSuffix}`
      : t.tier === 'budget'
        ? `${city} ${t.namePrefix} ${t.nameSuffix}`
        : `${t.namePrefix} ${city} ${t.nameSuffix}`

    return {
      id: `hotel_${city.toLowerCase().replace(/\s+/g, '')}_${index}`,
      name,
      starRating: t.starRating,
      reviewScore: t.reviewScore,
      reviewCount: t.reviewCount,
      reviewWord: t.reviewWord,
      address: t.distanceFromCentre,
      city,
      country,
      photoUrl: `/api/hotels/photo?slug=generic-${t.tier}`,
      amenities: t.amenities,
      distanceFromCentre: t.distanceFromCentre,
      pricePerNight: adjustedPrice * rooms,
      totalPrice,
      currency: 'GBP',
      nights,
      guests,
      rooms,
      roomType: t.roomType,
      freeCancellation: true,
      breakfastIncluded: t.tier !== 'budget',
      bookingUrl: generateBookingUrl(city, checkIn, checkOut, guests),
      tier: t.tier,
      tierLabel: tierLabels[t.tier],
    }

  })
}

/**
 * Generate a Booking.com affiliate URL for a destination.
 * When you have real credentials, this will include your affiliate ID for tracking.
 */
function generateBookingUrl(city: string, checkIn: string, checkOut: string, guests: number): string {
  const encodedCity = encodeURIComponent(city)
  const affiliateId = BOOKING_AFFILIATE_ID || 'PLACEHOLDER'

  // Real Booking.com search URL format with affiliate tracking
  return `https://www.booking.com/searchresults.html?ss=${encodedCity}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&no_rooms=${Math.ceil(guests / 2)}&aid=${affiliateId}`
}

/**
 * Check if we have hotel data for a given city
 */
export function hasHotelData(city: string): boolean {
  const normalised = city.split(',')[0].trim()
  return normalised in HOTEL_DATA
}

/**
 * Get all cities that have specific hotel data
 */
export function getHotelCities(): string[] {
  return Object.keys(HOTEL_DATA)
}
