/**
 * Common airport IATA codes for TripAmigos
 * Maps city names and airport names to IATA codes for Duffel search
 */

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
}

// Major UK airports
const ukAirports: Airport[] = [
  { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
  { iata: 'LGW', name: 'Gatwick', city: 'London', country: 'UK' },
  { iata: 'STN', name: 'Stansted', city: 'London', country: 'UK' },
  { iata: 'LTN', name: 'Luton', city: 'London', country: 'UK' },
  { iata: 'LCY', name: 'London City', city: 'London', country: 'UK' },
  { iata: 'MAN', name: 'Manchester', city: 'Manchester', country: 'UK' },
  { iata: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'UK' },
  { iata: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'UK' },
  { iata: 'GLA', name: 'Glasgow', city: 'Glasgow', country: 'UK' },
  { iata: 'BRS', name: 'Bristol', city: 'Bristol', country: 'UK' },
  { iata: 'LPL', name: 'John Lennon', city: 'Liverpool', country: 'UK' },
  { iata: 'NCL', name: 'Newcastle', city: 'Newcastle', country: 'UK' },
  { iata: 'BFS', name: 'Belfast International', city: 'Belfast', country: 'UK' },
  { iata: 'LBA', name: 'Leeds Bradford', city: 'Leeds', country: 'UK' },
  { iata: 'EMA', name: 'East Midlands', city: 'Nottingham', country: 'UK' },
  { iata: 'ABZ', name: 'Aberdeen', city: 'Aberdeen', country: 'UK' },
  { iata: 'CWL', name: 'Cardiff', city: 'Cardiff', country: 'UK' },
  { iata: 'SOU', name: 'Southampton', city: 'Southampton', country: 'UK' },
  { iata: 'EXT', name: 'Exeter', city: 'Exeter', country: 'UK' },
  { iata: 'BOH', name: 'Bournemouth', city: 'Bournemouth', country: 'UK' },
  { iata: 'INV', name: 'Inverness', city: 'Inverness', country: 'UK' },
  { iata: 'JER', name: 'Jersey', city: 'Jersey', country: 'UK' },
  { iata: 'NQY', name: 'Newquay Cornwall', city: 'Cornwall', country: 'UK' },
]

// Spain
const spainAirports: Airport[] = [
  { iata: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'Spain' },
  { iata: 'MAD', name: 'Barajas', city: 'Madrid', country: 'Spain' },
  { iata: 'PMI', name: 'Palma de Mallorca', city: 'Majorca', country: 'Spain' },
  { iata: 'AGP', name: 'Malaga', city: 'Malaga', country: 'Spain' },
  { iata: 'ALC', name: 'Alicante', city: 'Alicante', country: 'Spain' },
  { iata: 'IBZ', name: 'Ibiza', city: 'Ibiza', country: 'Spain' },
  { iata: 'TFS', name: 'Tenerife South', city: 'Tenerife', country: 'Spain' },
  { iata: 'VLC', name: 'Valencia', city: 'Valencia', country: 'Spain' },
  { iata: 'SVQ', name: 'San Pablo', city: 'Seville', country: 'Spain' },
  { iata: 'BIO', name: 'Bilbao', city: 'Bilbao', country: 'Spain' },
  { iata: 'EAS', name: 'San Sebastian', city: 'San Sebastian', country: 'Spain' },
  { iata: 'GRX', name: 'Federico Garcia Lorca', city: 'Granada', country: 'Spain' },
  { iata: 'ACE', name: 'Lanzarote', city: 'Lanzarote', country: 'Spain' },
  { iata: 'LPA', name: 'Gran Canaria', city: 'Gran Canaria', country: 'Spain' },
  { iata: 'FUE', name: 'Fuerteventura', city: 'Fuerteventura', country: 'Spain' },
  { iata: 'MAH', name: 'Menorca', city: 'Menorca', country: 'Spain' },
  { iata: 'XRY', name: 'Jerez', city: 'Cadiz', country: 'Spain' },
]

// France
const franceAirports: Airport[] = [
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { iata: 'ORY', name: 'Orly', city: 'Paris', country: 'France' },
  { iata: 'NCE', name: 'Nice Cote d\'Azur', city: 'Nice', country: 'France' },
  { iata: 'LYS', name: 'Lyon-Saint Exupery', city: 'Lyon', country: 'France' },
  { iata: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France' },
  { iata: 'BOD', name: 'Merignac', city: 'Bordeaux', country: 'France' },
  { iata: 'TLS', name: 'Blagnac', city: 'Toulouse', country: 'France' },
  { iata: 'SXB', name: 'Strasbourg', city: 'Strasbourg', country: 'France' },
  { iata: 'MPL', name: 'Montpellier', city: 'Montpellier', country: 'France' },
  { iata: 'AJA', name: 'Campo dell\'Oro', city: 'Corsica', country: 'France' },
  { iata: 'GVA', name: 'Geneva', city: 'Chamonix', country: 'France' }, // Nearest airport
]

// Italy
const italyAirports: Airport[] = [
  { iata: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy' },
  { iata: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy' },
  { iata: 'VCE', name: 'Marco Polo', city: 'Venice', country: 'Italy' },
  { iata: 'NAP', name: 'Napoli', city: 'Naples', country: 'Italy' },
  { iata: 'FLR', name: 'Peretola', city: 'Florence', country: 'Italy' },
  { iata: 'BLQ', name: 'Guglielmo Marconi', city: 'Bologna', country: 'Italy' },
  { iata: 'TRN', name: 'Caselle', city: 'Turin', country: 'Italy' },
  { iata: 'PSA', name: 'Galileo Galilei', city: 'Pisa', country: 'Italy' },
  { iata: 'CTA', name: 'Fontanarossa', city: 'Sicily', country: 'Italy' },
  { iata: 'CAG', name: 'Elmas', city: 'Sardinia', country: 'Italy' },
  { iata: 'BRI', name: 'Bari', city: 'Puglia', country: 'Italy' },
  { iata: 'VRN', name: 'Villafranca', city: 'Verona', country: 'Italy' },
]

// Germany
const germanyAirports: Airport[] = [
  { iata: 'BER', name: 'Brandenburg', city: 'Berlin', country: 'Germany' },
  { iata: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany' },
  { iata: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { iata: 'HAM', name: 'Hamburg', city: 'Hamburg', country: 'Germany' },
  { iata: 'CGN', name: 'Cologne Bonn', city: 'Cologne', country: 'Germany' },
  { iata: 'DUS', name: 'Dusseldorf', city: 'Dusseldorf', country: 'Germany' },
  { iata: 'STR', name: 'Stuttgart', city: 'Stuttgart', country: 'Germany' },
  { iata: 'DRS', name: 'Dresden', city: 'Dresden', country: 'Germany' },
]

// Rest of Europe
const restEuropeAirports: Airport[] = [
  // Netherlands & Belgium
  { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { iata: 'RTM', name: 'Rotterdam The Hague', city: 'Rotterdam', country: 'Netherlands' },
  { iata: 'BRU', name: 'Brussels', city: 'Brussels', country: 'Belgium' },
  { iata: 'CRL', name: 'Charleroi', city: 'Brussels', country: 'Belgium' },
  { iata: 'ANR', name: 'Antwerp', city: 'Antwerp', country: 'Belgium' },

  // Portugal
  { iata: 'LIS', name: 'Lisbon', city: 'Lisbon', country: 'Portugal' },
  { iata: 'OPO', name: 'Porto', city: 'Porto', country: 'Portugal' },
  { iata: 'FAO', name: 'Faro', city: 'Algarve', country: 'Portugal' },
  { iata: 'FNC', name: 'Madeira', city: 'Madeira', country: 'Portugal' },
  { iata: 'PDL', name: 'Ponta Delgada', city: 'Azores', country: 'Portugal' },

  // Greece
  { iata: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece' },
  { iata: 'SKG', name: 'Thessaloniki', city: 'Thessaloniki', country: 'Greece' },
  { iata: 'CFU', name: 'Corfu', city: 'Corfu', country: 'Greece' },
  { iata: 'JTR', name: 'Santorini', city: 'Santorini', country: 'Greece' },
  { iata: 'JMK', name: 'Mykonos', city: 'Mykonos', country: 'Greece' },
  { iata: 'HER', name: 'Heraklion', city: 'Crete', country: 'Greece' },
  { iata: 'RHO', name: 'Rhodes', city: 'Rhodes', country: 'Greece' },
  { iata: 'ZTH', name: 'Zakynthos', city: 'Zakynthos', country: 'Greece' },
  { iata: 'EFL', name: 'Kefalonia', city: 'Kefalonia', country: 'Greece' },
  { iata: 'KGS', name: 'Kos', city: 'Kos', country: 'Greece' },

  // Central Europe
  { iata: 'PRG', name: 'Vaclav Havel', city: 'Prague', country: 'Czech Republic' },
  { iata: 'BUD', name: 'Budapest', city: 'Budapest', country: 'Hungary' },
  { iata: 'VIE', name: 'Vienna', city: 'Vienna', country: 'Austria' },
  { iata: 'SZG', name: 'Salzburg', city: 'Salzburg', country: 'Austria' },
  { iata: 'INN', name: 'Innsbruck', city: 'Innsbruck', country: 'Austria' },
  { iata: 'WAW', name: 'Chopin', city: 'Warsaw', country: 'Poland' },
  { iata: 'KRK', name: 'Krakow', city: 'Krakow', country: 'Poland' },
  { iata: 'GDN', name: 'Lech Walesa', city: 'Gdansk', country: 'Poland' },
  { iata: 'WRO', name: 'Wroclaw', city: 'Wroclaw', country: 'Poland' },
  { iata: 'BTS', name: 'Bratislava', city: 'Bratislava', country: 'Slovakia' },
  { iata: 'LJU', name: 'Ljubljana', city: 'Ljubljana', country: 'Slovenia' },

  // Switzerland
  { iata: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland' },
  { iata: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland' },
  { iata: 'BSL', name: 'EuroAirport Basel', city: 'Basel', country: 'Switzerland' },

  // Nordics
  { iata: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark' },
  { iata: 'OSL', name: 'Oslo', city: 'Oslo', country: 'Norway' },
  { iata: 'BGO', name: 'Flesland', city: 'Bergen', country: 'Norway' },
  { iata: 'TOS', name: 'Tromso', city: 'Tromso', country: 'Norway' },
  { iata: 'ARN', name: 'Arlanda', city: 'Stockholm', country: 'Sweden' },
  { iata: 'GOT', name: 'Landvetter', city: 'Gothenburg', country: 'Sweden' },
  { iata: 'HEL', name: 'Vantaa', city: 'Helsinki', country: 'Finland' },
  { iata: 'RVN', name: 'Rovaniemi', city: 'Lapland', country: 'Finland' },
  { iata: 'KEF', name: 'Keflavik', city: 'Reykjavik', country: 'Iceland' },

  // Ireland
  { iata: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland' },
  { iata: 'SNN', name: 'Shannon', city: 'Galway', country: 'Ireland' },
  { iata: 'ORK', name: 'Cork', city: 'Cork', country: 'Ireland' },

  // Baltics
  { iata: 'TLL', name: 'Tallinn', city: 'Tallinn', country: 'Estonia' },
  { iata: 'RIX', name: 'Riga', city: 'Riga', country: 'Latvia' },
  { iata: 'VNO', name: 'Vilnius', city: 'Vilnius', country: 'Lithuania' },

  // Balkans & Eastern Europe
  { iata: 'DBV', name: 'Dubrovnik', city: 'Dubrovnik', country: 'Croatia' },
  { iata: 'SPU', name: 'Split', city: 'Split', country: 'Croatia' },
  { iata: 'ZAG', name: 'Zagreb', city: 'Zagreb', country: 'Croatia' },
  { iata: 'TGD', name: 'Podgorica', city: 'Montenegro', country: 'Montenegro' },
  { iata: 'TIV', name: 'Tivat', city: 'Kotor', country: 'Montenegro' },
  { iata: 'BEG', name: 'Nikola Tesla', city: 'Belgrade', country: 'Serbia' },
  { iata: 'OTP', name: 'Henri Coanda', city: 'Bucharest', country: 'Romania' },
  { iata: 'SOF', name: 'Sofia', city: 'Sofia', country: 'Bulgaria' },
  { iata: 'TIA', name: 'Tirana', city: 'Tirana', country: 'Albania' },
  { iata: 'SJJ', name: 'Sarajevo', city: 'Sarajevo', country: 'Bosnia' },

  // Turkey
  { iata: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey' },
  { iata: 'AYT', name: 'Antalya', city: 'Antalya', country: 'Turkey' },
  { iata: 'BJV', name: 'Bodrum', city: 'Bodrum', country: 'Turkey' },
  { iata: 'DLM', name: 'Dalaman', city: 'Fethiye', country: 'Turkey' },
  { iata: 'ASR', name: 'Kayseri', city: 'Cappadocia', country: 'Turkey' },

  // Cyprus & Malta
  { iata: 'PFO', name: 'Paphos', city: 'Paphos', country: 'Cyprus' },
  { iata: 'LCA', name: 'Larnaca', city: 'Larnaca', country: 'Cyprus' },
  { iata: 'MLA', name: 'Malta', city: 'Malta', country: 'Malta' },
]

// USA airports
const usaAirports: Airport[] = [
  { iata: 'JFK', name: 'John F Kennedy', city: 'New York', country: 'USA' },
  { iata: 'EWR', name: 'Newark', city: 'New York', country: 'USA' },
  { iata: 'LAX', name: 'Los Angeles', city: 'Los Angeles', country: 'USA' },
  { iata: 'MIA', name: 'Miami', city: 'Miami', country: 'USA' },
  { iata: 'LAS', name: 'Harry Reid', city: 'Las Vegas', country: 'USA' },
  { iata: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA' },
  { iata: 'ORD', name: "O'Hare", city: 'Chicago', country: 'USA' },
  { iata: 'MCO', name: 'Orlando', city: 'Orlando', country: 'USA' },
  { iata: 'BNA', name: 'Nashville', city: 'Nashville', country: 'USA' },
  { iata: 'AUS', name: 'Austin-Bergstrom', city: 'Austin', country: 'USA' },
  { iata: 'MSY', name: 'Louis Armstrong', city: 'New Orleans', country: 'USA' },
  { iata: 'BOS', name: 'Logan', city: 'Boston', country: 'USA' },
  { iata: 'IAD', name: 'Dulles', city: 'Washington DC', country: 'USA' },
  { iata: 'DCA', name: 'Reagan', city: 'Washington DC', country: 'USA' },
  { iata: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'USA' },
  { iata: 'SAN', name: 'San Diego', city: 'San Diego', country: 'USA' },
  { iata: 'DEN', name: 'Denver', city: 'Denver', country: 'USA' },
  { iata: 'HNL', name: 'Daniel K Inouye', city: 'Honolulu', country: 'USA' },
  { iata: 'PDX', name: 'Portland', city: 'Portland', country: 'USA' },
  { iata: 'SAV', name: 'Savannah', city: 'Savannah', country: 'USA' },
  { iata: 'CHS', name: 'Charleston', city: 'Charleston', country: 'USA' },
  { iata: 'PHX', name: 'Sky Harbor', city: 'Phoenix', country: 'USA' },
  { iata: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'USA' },
  { iata: 'DFW', name: 'Dallas Fort Worth', city: 'Dallas', country: 'USA' },
  { iata: 'IAH', name: 'George Bush', city: 'Houston', country: 'USA' },
  { iata: 'PHL', name: 'Philadelphia', city: 'Philadelphia', country: 'USA' },
  { iata: 'MSP', name: 'Minneapolis-St Paul', city: 'Minneapolis', country: 'USA' },
  { iata: 'DTW', name: 'Detroit Metro', city: 'Detroit', country: 'USA' },
  { iata: 'SLC', name: 'Salt Lake City', city: 'Salt Lake City', country: 'USA' },
  { iata: 'ASE', name: 'Aspen', city: 'Aspen', country: 'USA' },
  { iata: 'EYW', name: 'Key West', city: 'Key West', country: 'USA' },
  { iata: 'OGG', name: 'Kahului', city: 'Maui', country: 'USA' },
  { iata: 'PSP', name: 'Palm Springs', city: 'Palm Springs', country: 'USA' },
]

// Canada airports
const canadaAirports: Airport[] = [
  { iata: 'YYZ', name: 'Pearson', city: 'Toronto', country: 'Canada' },
  { iata: 'YVR', name: 'Vancouver', city: 'Vancouver', country: 'Canada' },
  { iata: 'YUL', name: 'Trudeau', city: 'Montreal', country: 'Canada' },
  { iata: 'YYC', name: 'Calgary', city: 'Calgary', country: 'Canada' },
  { iata: 'YOW', name: 'Ottawa', city: 'Ottawa', country: 'Canada' },
  { iata: 'YQB', name: 'Jean Lesage', city: 'Quebec City', country: 'Canada' },
  { iata: 'YHZ', name: 'Halifax', city: 'Halifax', country: 'Canada' },
  { iata: 'YYJ', name: 'Victoria', city: 'Victoria', country: 'Canada' },
]

// Caribbean & Mexico airports
const caribbeanAirports: Airport[] = [
  { iata: 'CUN', name: 'Cancun', city: 'Cancun', country: 'Mexico' },
  { iata: 'MEX', name: 'Mexico City', city: 'Mexico City', country: 'Mexico' },
  { iata: 'SJD', name: 'Los Cabos', city: 'Cabo San Lucas', country: 'Mexico' },
  { iata: 'PVR', name: 'Puerto Vallarta', city: 'Puerto Vallarta', country: 'Mexico' },
  { iata: 'MBJ', name: 'Sangster', city: 'Jamaica', country: 'Jamaica' },
  { iata: 'BGI', name: 'Grantley Adams', city: 'Barbados', country: 'Barbados' },
  { iata: 'NAS', name: 'Nassau', city: 'Bahamas', country: 'Bahamas' },
  { iata: 'PUJ', name: 'Punta Cana', city: 'Punta Cana', country: 'Dominican Republic' },
  { iata: 'UVF', name: 'Hewanorra', city: 'St Lucia', country: 'St Lucia' },
  { iata: 'AUA', name: 'Queen Beatrix', city: 'Aruba', country: 'Aruba' },
  { iata: 'PLS', name: 'Providenciales', city: 'Turks & Caicos', country: 'Turks & Caicos' },
  { iata: 'ANU', name: 'V.C. Bird', city: 'Antigua', country: 'Antigua' },
  { iata: 'HAV', name: 'Jose Marti', city: 'Cuba', country: 'Cuba' },
  { iata: 'SJU', name: 'Luis Munoz Marin', city: 'Puerto Rico', country: 'Puerto Rico' },
  { iata: 'CUR', name: 'Hato', city: 'Curacao', country: 'Curacao' },
  { iata: 'GND', name: "Maurice Bishop", city: 'Grenada', country: 'Grenada' },
  { iata: 'GCM', name: 'Owen Roberts', city: 'Cayman Islands', country: 'Cayman Islands' },
  { iata: 'POS', name: 'Piarco', city: 'Trinidad & Tobago', country: 'Trinidad & Tobago' },
  { iata: 'SKB', name: 'Robert L Bradshaw', city: 'St Kitts', country: 'St Kitts & Nevis' },
]

// South America airports
const southAmericaAirports: Airport[] = [
  { iata: 'GIG', name: 'Galeao', city: 'Rio de Janeiro', country: 'Brazil' },
  { iata: 'GRU', name: 'Guarulhos', city: 'Sao Paulo', country: 'Brazil' },
  { iata: 'EZE', name: 'Ezeiza', city: 'Buenos Aires', country: 'Argentina' },
  { iata: 'MDZ', name: 'El Plumerillo', city: 'Mendoza', country: 'Argentina' },
  { iata: 'LIM', name: 'Jorge Chavez', city: 'Lima', country: 'Peru' },
  { iata: 'CUZ', name: 'Alejandro Velasco', city: 'Cusco', country: 'Peru' },
  { iata: 'BOG', name: 'El Dorado', city: 'Bogota', country: 'Colombia' },
  { iata: 'CTG', name: 'Rafael Nunez', city: 'Cartagena', country: 'Colombia' },
  { iata: 'MDE', name: 'Jose Maria Cordova', city: 'Medellin', country: 'Colombia' },
  { iata: 'SCL', name: 'Arturo Merino', city: 'Santiago', country: 'Chile' },
  { iata: 'UIO', name: 'Mariscal Sucre', city: 'Quito', country: 'Ecuador' },
  { iata: 'GPS', name: 'Seymour', city: 'Galapagos Islands', country: 'Ecuador' },
  { iata: 'MVD', name: 'Carrasco', city: 'Montevideo', country: 'Uruguay' },
]

// Asia airports (massively expanded)
const asiaAirports: Airport[] = [
  // Japan
  { iata: 'NRT', name: 'Narita', city: 'Tokyo', country: 'Japan' },
  { iata: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan' },
  { iata: 'KIX', name: 'Kansai', city: 'Osaka', country: 'Japan' },
  // Thailand
  { iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { iata: 'HKT', name: 'Phuket', city: 'Phuket', country: 'Thailand' },
  { iata: 'USM', name: 'Koh Samui', city: 'Koh Samui', country: 'Thailand' },
  { iata: 'CNX', name: 'Chiang Mai', city: 'Chiang Mai', country: 'Thailand' },
  { iata: 'KBV', name: 'Krabi', city: 'Krabi', country: 'Thailand' },
  // Indonesia
  { iata: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'Indonesia' },
  { iata: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia' },
  // Singapore, HK, Korea
  { iata: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
  { iata: 'HKG', name: 'Chek Lap Kok', city: 'Hong Kong', country: 'Hong Kong' },
  { iata: 'ICN', name: 'Incheon', city: 'Seoul', country: 'South Korea' },
  { iata: 'PUS', name: 'Gimhae', city: 'Busan', country: 'South Korea' },
  // Vietnam
  { iata: 'HAN', name: 'Noi Bai', city: 'Hanoi', country: 'Vietnam' },
  { iata: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { iata: 'DAD', name: 'Da Nang', city: 'Da Nang', country: 'Vietnam' },
  // Malaysia
  { iata: 'KUL', name: 'KLIA', city: 'Kuala Lumpur', country: 'Malaysia' },
  { iata: 'LGK', name: 'Langkawi', city: 'Langkawi', country: 'Malaysia' },
  { iata: 'PEN', name: 'Penang', city: 'Penang', country: 'Malaysia' },
  // Philippines
  { iata: 'MNL', name: 'Ninoy Aquino', city: 'Manila', country: 'Philippines' },
  { iata: 'MPH', name: 'Caticlan', city: 'Boracay', country: 'Philippines' },
  { iata: 'CEB', name: 'Mactan-Cebu', city: 'Cebu', country: 'Philippines' },
  { iata: 'PPS', name: 'Puerto Princesa', city: 'Palawan', country: 'Philippines' },
  // Maldives & Sri Lanka
  { iata: 'MLE', name: 'Velana', city: 'Maldives', country: 'Maldives' },
  { iata: 'CMB', name: 'Bandaranaike', city: 'Sri Lanka', country: 'Sri Lanka' },
  // India
  { iata: 'GOI', name: 'Dabolim', city: 'Goa', country: 'India' },
  { iata: 'DEL', name: 'Indira Gandhi', city: 'Delhi', country: 'India' },
  { iata: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'India' },
  { iata: 'JAI', name: 'Jaipur', city: 'Jaipur', country: 'India' },
  { iata: 'BLR', name: 'Kempegowda', city: 'Bangalore', country: 'India' },
  { iata: 'COK', name: 'Cochin', city: 'Kerala', country: 'India' },
  { iata: 'AGR', name: 'Agra', city: 'Agra', country: 'India' },
  // China & Taiwan
  { iata: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China' },
  { iata: 'PVG', name: 'Pudong', city: 'Shanghai', country: 'China' },
  { iata: 'TPE', name: 'Taoyuan', city: 'Taipei', country: 'Taiwan' },
  // Cambodia, Laos, Nepal, Myanmar
  { iata: 'PNH', name: 'Phnom Penh', city: 'Phnom Penh', country: 'Cambodia' },
  { iata: 'REP', name: 'Siem Reap', city: 'Siem Reap', country: 'Cambodia' },
  { iata: 'LPQ', name: 'Luang Prabang', city: 'Luang Prabang', country: 'Laos' },
  { iata: 'KTM', name: 'Tribhuvan', city: 'Kathmandu', country: 'Nepal' },
  { iata: 'RGN', name: 'Mingaladon', city: 'Yangon', country: 'Myanmar' },
]

// Oceania airports
const oceaniaAirports: Airport[] = [
  { iata: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia' },
  { iata: 'MEL', name: 'Tullamarine', city: 'Melbourne', country: 'Australia' },
  { iata: 'BNE', name: 'Brisbane', city: 'Brisbane', country: 'Australia' },
  { iata: 'PER', name: 'Perth', city: 'Perth', country: 'Australia' },
  { iata: 'OOL', name: 'Gold Coast', city: 'Gold Coast', country: 'Australia' },
  { iata: 'CNS', name: 'Cairns', city: 'Cairns', country: 'Australia' },
  { iata: 'AKL', name: 'Auckland', city: 'Auckland', country: 'New Zealand' },
  { iata: 'ZQN', name: 'Queenstown', city: 'Queenstown', country: 'New Zealand' },
  { iata: 'WLG', name: 'Wellington', city: 'Wellington', country: 'New Zealand' },
  { iata: 'NAN', name: 'Nadi', city: 'Fiji', country: 'Fiji' },
  { iata: 'BOB', name: 'Bora Bora', city: 'Bora Bora', country: 'French Polynesia' },
]

// Middle East airports
const middleEastAirports: Airport[] = [
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { iata: 'AUH', name: 'Abu Dhabi', city: 'Abu Dhabi', country: 'UAE' },
  { iata: 'DOH', name: 'Hamad', city: 'Doha', country: 'Qatar' },
  { iata: 'RUH', name: 'King Khalid', city: 'Riyadh', country: 'Saudi Arabia' },
  { iata: 'JED', name: 'King Abdulaziz', city: 'Jeddah', country: 'Saudi Arabia' },
  { iata: 'MCT', name: 'Muscat', city: 'Muscat', country: 'Oman' },
  { iata: 'BAH', name: 'Bahrain', city: 'Bahrain', country: 'Bahrain' },
  { iata: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'Israel' },
  { iata: 'AMM', name: 'Queen Alia', city: 'Amman', country: 'Jordan' },
]

// Africa airports
const africaAirports: Airport[] = [
  { iata: 'CPT', name: 'Cape Town', city: 'Cape Town', country: 'South Africa' },
  { iata: 'JNB', name: 'O.R. Tambo', city: 'Johannesburg', country: 'South Africa' },
  { iata: 'RAK', name: 'Menara', city: 'Marrakech', country: 'Morocco' },
  { iata: 'FEZ', name: 'Fez-Saiss', city: 'Fez', country: 'Morocco' },
  { iata: 'CMN', name: 'Mohammed V', city: 'Casablanca', country: 'Morocco' },
  { iata: 'ZNZ', name: 'Abeid Amani Karume', city: 'Zanzibar', country: 'Tanzania' },
  { iata: 'DAR', name: 'Julius Nyerere', city: 'Dar es Salaam', country: 'Tanzania' },
  { iata: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya' },
  { iata: 'MBA', name: 'Moi', city: 'Mombasa', country: 'Kenya' },
  { iata: 'CAI', name: 'Cairo', city: 'Cairo', country: 'Egypt' },
  { iata: 'SSH', name: 'Sharm El Sheikh', city: 'Sharm El Sheikh', country: 'Egypt' },
  { iata: 'HRG', name: 'Hurghada', city: 'Hurghada', country: 'Egypt' },
  { iata: 'ACC', name: 'Kotoka', city: 'Accra', country: 'Ghana' },
  { iata: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigeria' },
  { iata: 'MRU', name: 'Sir Seewoosagur', city: 'Mauritius', country: 'Mauritius' },
  { iata: 'SEZ', name: 'Seychelles', city: 'Seychelles', country: 'Seychelles' },
  { iata: 'VFA', name: 'Victoria Falls', city: 'Victoria Falls', country: 'Zimbabwe' },
  { iata: 'WDH', name: 'Hosea Kutako', city: 'Windhoek', country: 'Namibia' },
  { iata: 'KGL', name: 'Kigali', city: 'Kigali', country: 'Rwanda' },
  { iata: 'ADD', name: 'Bole', city: 'Addis Ababa', country: 'Ethiopia' },
  { iata: 'TUN', name: 'Tunis-Carthage', city: 'Tunis', country: 'Tunisia' },
]

export const allAirports: Airport[] = [
  ...ukAirports,
  ...spainAirports,
  ...franceAirports,
  ...italyAirports,
  ...germanyAirports,
  ...restEuropeAirports,
  ...usaAirports,
  ...canadaAirports,
  ...caribbeanAirports,
  ...southAmericaAirports,
  ...asiaAirports,
  ...oceaniaAirports,
  ...middleEastAirports,
  ...africaAirports,
]

/**
 * Find the best IATA code match for a city name from our destinations list
 * e.g. "Barcelona, Spain" → "BCN"
 */
export function cityToIATA(cityString: string): string | null {
  const city = cityString.split(',')[0].trim().toLowerCase()

  const match = allAirports.find(
    a => a.city.toLowerCase() === city || a.name.toLowerCase() === city
  )

  return match?.iata || null
}

/**
 * Find the best IATA code for an airport string the user typed
 * e.g. "Heathrow" → "LHR", "Manchester" → "MAN"
 */
export function airportToIATA(input: string): string | null {
  const search = input.trim().toLowerCase()

  // Try exact match on name or city
  const exact = allAirports.find(
    a =>
      a.name.toLowerCase() === search ||
      a.city.toLowerCase() === search ||
      a.iata.toLowerCase() === search
  )
  if (exact) return exact.iata

  // Try partial match
  const partial = allAirports.find(
    a =>
      a.name.toLowerCase().includes(search) ||
      a.city.toLowerCase().includes(search) ||
      search.includes(a.name.toLowerCase()) ||
      search.includes(a.city.toLowerCase())
  )
  return partial?.iata || null
}

/**
 * Get airport details by IATA code
 */
export function getAirportByIATA(iata: string): Airport | null {
  return allAirports.find(a => a.iata === iata) || null
}

// =====================================================
// FALLBACK AIRPORTS
// =====================================================
// When a member's preferred airport has no flights to the destination,
// we try nearby alternatives in order. Heathrow is always the top London
// fallback because it has the widest route network.

const AIRPORT_FALLBACKS: Record<string, string[]> = {
  // London airports — Heathrow has the most routes, then Gatwick, Stansted, Luton, City
  LHR: ['LGW', 'STN', 'LTN', 'LCY'],
  LGW: ['LHR', 'STN', 'LTN', 'LCY'],
  STN: ['LHR', 'LGW', 'LTN', 'LCY'],
  LTN: ['LHR', 'LGW', 'STN', 'LCY'],
  LCY: ['LHR', 'LGW', 'STN', 'LTN'],

  // North West England
  LPL: ['MAN', 'LHR'],        // Liverpool → Manchester → Heathrow
  MAN: ['LPL', 'LBA', 'LHR'], // Manchester → Liverpool → Leeds → Heathrow

  // Midlands
  BHX: ['EMA', 'MAN', 'LHR'], // Birmingham → East Midlands → Manchester → Heathrow
  EMA: ['BHX', 'MAN', 'LHR'], // East Midlands → Birmingham → Manchester → Heathrow

  // North East
  NCL: ['EDI', 'LBA', 'MAN'], // Newcastle → Edinburgh → Leeds → Manchester
  LBA: ['MAN', 'NCL', 'BHX'], // Leeds → Manchester → Newcastle → Birmingham

  // Scotland
  EDI: ['GLA', 'NCL', 'LHR'], // Edinburgh → Glasgow → Newcastle → Heathrow
  GLA: ['EDI', 'NCL', 'LHR'], // Glasgow → Edinburgh → Newcastle → Heathrow
  ABZ: ['EDI', 'GLA', 'LHR'], // Aberdeen → Edinburgh → Glasgow → Heathrow
  INV: ['EDI', 'GLA', 'ABZ'], // Inverness → Edinburgh → Glasgow → Aberdeen

  // South / South West
  BRS: ['LHR', 'LGW', 'BHX'],      // Bristol → Heathrow → Gatwick → Birmingham
  SOU: ['LHR', 'LGW', 'BRS'],      // Southampton → Heathrow → Gatwick → Bristol
  EXT: ['BRS', 'LHR', 'LGW'],      // Exeter → Bristol → Heathrow → Gatwick
  BOH: ['LHR', 'LGW', 'SOU'],      // Bournemouth → Heathrow → Gatwick → Southampton
  NQY: ['EXT', 'BRS', 'LHR'],      // Newquay → Exeter → Bristol → Heathrow
  CWL: ['BRS', 'LHR', 'BHX'],      // Cardiff → Bristol → Heathrow → Birmingham

  // Northern Ireland
  BFS: ['DUB', 'EDI', 'GLA'],       // Belfast → Dublin → Edinburgh → Glasgow

  // Channel Islands
  JER: ['LGW', 'LHR', 'SOU'],      // Jersey → Gatwick → Heathrow → Southampton

  // Ireland
  DUB: ['SNN', 'ORK', 'LHR'],      // Dublin → Shannon → Cork → Heathrow
  SNN: ['DUB', 'ORK'],              // Shannon → Dublin → Cork
  ORK: ['DUB', 'SNN'],              // Cork → Dublin → Shannon

  // Paris
  CDG: ['ORY'],
  ORY: ['CDG'],

  // New York
  JFK: ['EWR'],
  EWR: ['JFK'],

  // Washington DC
  IAD: ['DCA'],
  DCA: ['IAD'],

  // Milan
  MXP: ['LIN', 'BGY'],

  // Rome
  FCO: ['CIA'],

  // Tokyo
  NRT: ['HND'],
  HND: ['NRT'],

  // Brussels
  BRU: ['CRL'],
  CRL: ['BRU'],
}

/**
 * Get ordered list of fallback airport IATA codes for a given airport.
 * Returns the primary airport first, followed by fallbacks.
 * e.g. getFallbackAirports('LGW') → ['LGW', 'LHR', 'STN', 'LTN', 'LCY']
 */
export function getFallbackAirports(iata: string): string[] {
  const fallbacks = AIRPORT_FALLBACKS[iata] || []
  return [iata, ...fallbacks]
}

/**
 * Get a human-readable airport label from an IATA code.
 * e.g. 'LHR' → 'Heathrow (LHR)'
 */
export function getAirportLabel(iata: string): string {
  const airport = getAirportByIATA(iata)
  if (!airport) return iata
  return `${airport.name} (${iata})`
}
