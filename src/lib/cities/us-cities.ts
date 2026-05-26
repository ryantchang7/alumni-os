/**
 * Curated list of US cities for the profile autocomplete. Hand-picked
 * to cover the metros + finance / Penn-alumni hubs where alumni are
 * most likely to live. Free-text input still accepted for anything off
 * the list — autocomplete is a convenience, not a constraint.
 */

export interface UsCity {
  city: string
  state: string  // 2-letter USPS code
}

// Top metros + finance hubs + classic Penn Golf alumni territory.
// Loose ordering: northeast first (most alumni density), then southeast,
// midwest, west.
export const US_CITIES: UsCity[] = [
  // New York metro + finance
  { city: 'New York', state: 'NY' },
  { city: 'Brooklyn', state: 'NY' },
  { city: 'Queens', state: 'NY' },
  { city: 'Manhattan', state: 'NY' },
  { city: 'Bronx', state: 'NY' },
  { city: 'Staten Island', state: 'NY' },
  { city: 'Long Island City', state: 'NY' },
  { city: 'Yonkers', state: 'NY' },
  { city: 'White Plains', state: 'NY' },
  { city: 'Bronxville', state: 'NY' },
  { city: 'Scarsdale', state: 'NY' },
  { city: 'Larchmont', state: 'NY' },
  { city: 'Mamaroneck', state: 'NY' },
  { city: 'Rye', state: 'NY' },
  { city: 'Garden City', state: 'NY' },
  { city: 'Manhasset', state: 'NY' },
  { city: 'Great Neck', state: 'NY' },
  { city: 'Roslyn', state: 'NY' },
  { city: 'Buffalo', state: 'NY' },
  { city: 'Rochester', state: 'NY' },
  { city: 'Syracuse', state: 'NY' },
  { city: 'Albany', state: 'NY' },

  // New Jersey
  { city: 'Hoboken', state: 'NJ' },
  { city: 'Jersey City', state: 'NJ' },
  { city: 'Newark', state: 'NJ' },
  { city: 'Princeton', state: 'NJ' },
  { city: 'Short Hills', state: 'NJ' },
  { city: 'Summit', state: 'NJ' },
  { city: 'Montclair', state: 'NJ' },
  { city: 'Morristown', state: 'NJ' },
  { city: 'Far Hills', state: 'NJ' },
  { city: 'Bernardsville', state: 'NJ' },
  { city: 'Ridgewood', state: 'NJ' },
  { city: 'Westfield', state: 'NJ' },
  { city: 'Hoboken', state: 'NJ' },

  // Connecticut
  { city: 'Greenwich', state: 'CT' },
  { city: 'Stamford', state: 'CT' },
  { city: 'Darien', state: 'CT' },
  { city: 'New Canaan', state: 'CT' },
  { city: 'Westport', state: 'CT' },
  { city: 'Fairfield', state: 'CT' },
  { city: 'Hartford', state: 'CT' },
  { city: 'New Haven', state: 'CT' },

  // Pennsylvania (Penn home)
  { city: 'Philadelphia', state: 'PA' },
  { city: 'Bryn Mawr', state: 'PA' },
  { city: 'Wayne', state: 'PA' },
  { city: 'Villanova', state: 'PA' },
  { city: 'Gladwyne', state: 'PA' },
  { city: 'Haverford', state: 'PA' },
  { city: 'Pittsburgh', state: 'PA' },
  { city: 'King of Prussia', state: 'PA' },
  { city: 'Conshohocken', state: 'PA' },

  // Massachusetts
  { city: 'Boston', state: 'MA' },
  { city: 'Cambridge', state: 'MA' },
  { city: 'Brookline', state: 'MA' },
  { city: 'Newton', state: 'MA' },
  { city: 'Wellesley', state: 'MA' },
  { city: 'Weston', state: 'MA' },
  { city: 'Lexington', state: 'MA' },
  { city: 'Concord', state: 'MA' },
  { city: 'Hingham', state: 'MA' },
  { city: 'Nantucket', state: 'MA' },
  { city: "Martha's Vineyard", state: 'MA' },
  { city: 'Worcester', state: 'MA' },

  // DC area
  { city: 'Washington', state: 'DC' },
  { city: 'Arlington', state: 'VA' },
  { city: 'Alexandria', state: 'VA' },
  { city: 'McLean', state: 'VA' },
  { city: 'Bethesda', state: 'MD' },
  { city: 'Chevy Chase', state: 'MD' },
  { city: 'Potomac', state: 'MD' },
  { city: 'Baltimore', state: 'MD' },
  { city: 'Annapolis', state: 'MD' },
  { city: 'Richmond', state: 'VA' },

  // Southeast
  { city: 'Miami', state: 'FL' },
  { city: 'Miami Beach', state: 'FL' },
  { city: 'Coral Gables', state: 'FL' },
  { city: 'Palm Beach', state: 'FL' },
  { city: 'West Palm Beach', state: 'FL' },
  { city: 'Boca Raton', state: 'FL' },
  { city: 'Naples', state: 'FL' },
  { city: 'Tampa', state: 'FL' },
  { city: 'Orlando', state: 'FL' },
  { city: 'Jacksonville', state: 'FL' },
  { city: 'Jupiter', state: 'FL' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Charleston', state: 'SC' },
  { city: 'Charlotte', state: 'NC' },
  { city: 'Raleigh', state: 'NC' },
  { city: 'Durham', state: 'NC' },
  { city: 'Nashville', state: 'TN' },
  { city: 'New Orleans', state: 'LA' },
  { city: 'Pinehurst', state: 'NC' },

  // Midwest
  { city: 'Chicago', state: 'IL' },
  { city: 'Lake Forest', state: 'IL' },
  { city: 'Winnetka', state: 'IL' },
  { city: 'Evanston', state: 'IL' },
  { city: 'Wilmette', state: 'IL' },
  { city: 'Naperville', state: 'IL' },
  { city: 'Minneapolis', state: 'MN' },
  { city: 'Detroit', state: 'MI' },
  { city: 'Bloomfield Hills', state: 'MI' },
  { city: 'Cleveland', state: 'OH' },
  { city: 'Columbus', state: 'OH' },
  { city: 'Cincinnati', state: 'OH' },
  { city: 'Indianapolis', state: 'IN' },
  { city: 'St. Louis', state: 'MO' },
  { city: 'Kansas City', state: 'MO' },
  { city: 'Milwaukee', state: 'WI' },

  // Texas
  { city: 'Dallas', state: 'TX' },
  { city: 'Houston', state: 'TX' },
  { city: 'Austin', state: 'TX' },
  { city: 'San Antonio', state: 'TX' },
  { city: 'Fort Worth', state: 'TX' },
  { city: 'Plano', state: 'TX' },
  { city: 'Highland Park', state: 'TX' },

  // West coast
  { city: 'San Francisco', state: 'CA' },
  { city: 'Palo Alto', state: 'CA' },
  { city: 'Menlo Park', state: 'CA' },
  { city: 'Atherton', state: 'CA' },
  { city: 'San Jose', state: 'CA' },
  { city: 'Berkeley', state: 'CA' },
  { city: 'Oakland', state: 'CA' },
  { city: 'Marin', state: 'CA' },
  { city: 'Sausalito', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Beverly Hills', state: 'CA' },
  { city: 'Santa Monica', state: 'CA' },
  { city: 'Pasadena', state: 'CA' },
  { city: 'Manhattan Beach', state: 'CA' },
  { city: 'Newport Beach', state: 'CA' },
  { city: 'San Diego', state: 'CA' },
  { city: 'La Jolla', state: 'CA' },
  { city: 'Sacramento', state: 'CA' },
  { city: 'Carmel', state: 'CA' },
  { city: 'Pebble Beach', state: 'CA' },

  // Pacific NW + Mountain
  { city: 'Seattle', state: 'WA' },
  { city: 'Bellevue', state: 'WA' },
  { city: 'Portland', state: 'OR' },
  { city: 'Denver', state: 'CO' },
  { city: 'Boulder', state: 'CO' },
  { city: 'Aspen', state: 'CO' },
  { city: 'Vail', state: 'CO' },
  { city: 'Salt Lake City', state: 'UT' },
  { city: 'Park City', state: 'UT' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Scottsdale', state: 'AZ' },
  { city: 'Tucson', state: 'AZ' },
  { city: 'Las Vegas', state: 'NV' },
  { city: 'Reno', state: 'NV' },
  { city: 'Honolulu', state: 'HI' },

  // Other / NH / VT / Maine
  { city: 'Portland', state: 'ME' },
  { city: 'Bar Harbor', state: 'ME' },
  { city: 'Manchester', state: 'NH' },
  { city: 'Hanover', state: 'NH' },
  { city: 'Burlington', state: 'VT' },
  { city: 'Stowe', state: 'VT' },
  { city: 'Providence', state: 'RI' },
  { city: 'Newport', state: 'RI' },
]

/**
 * Returns city suggestions matching the query, ordered by:
 * 1. Exact city-name prefix match
 * 2. City-name contains
 * 3. State-name match (so typing "ny" surfaces NY cities)
 */
export function searchCities(query: string, limit = 8): UsCity[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const seen = new Set<string>()
  const exact: UsCity[] = []
  const prefix: UsCity[] = []
  const contains: UsCity[] = []

  for (const c of US_CITIES) {
    const key = `${c.city}|${c.state}`
    if (seen.has(key)) continue
    const cityLower = c.city.toLowerCase()
    if (cityLower === q) {
      seen.add(key)
      exact.push(c)
    } else if (cityLower.startsWith(q)) {
      seen.add(key)
      prefix.push(c)
    } else if (cityLower.includes(q)) {
      seen.add(key)
      contains.push(c)
    }
  }

  return [...exact, ...prefix, ...contains].slice(0, limit)
}
