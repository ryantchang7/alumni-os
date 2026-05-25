export interface PlaceCoords {
  x: number // % from left
  y: number // % from top
  region: 'northeast' | 'southeast' | 'midwest' | 'south' | 'southwest' | 'west'
}

export const PLACE_COORDS: Record<string, PlaceCoords> = {
  // Northeast
  'Brookline, Mass.':    { x: 84, y: 17, region: 'northeast' },
  'Short Hills, N.J.':  { x: 81, y: 24, region: 'northeast' },
  'Newtown Square, Pa.':{ x: 79, y: 26, region: 'northeast' },
  'Boston, Mass.':       { x: 84, y: 17, region: 'northeast' },
  'New York, N.Y.':      { x: 81, y: 22, region: 'northeast' },
  'Philadelphia, Pa.':   { x: 79, y: 26, region: 'northeast' },

  // South / Midwest-South
  'Lexington, Ky.':     { x: 68, y: 36, region: 'south' },
  'Suwanee, Ga.':       { x: 70, y: 46, region: 'southeast' },

  // Southeast
  'Miami, Fla.':        { x: 73, y: 62, region: 'southeast' },
  'Atlanta, Ga.':       { x: 70, y: 46, region: 'southeast' },
  'Charlotte, N.C.':    { x: 73, y: 38, region: 'southeast' },

  // Midwest
  'Chicago, Ill.':      { x: 63, y: 24, region: 'midwest' },
  'Columbus, Ohio':     { x: 71, y: 28, region: 'midwest' },

  // Southwest
  'Scottsdale, Ariz.':  { x: 24, y: 46, region: 'southwest' },
  'Phoenix, Ariz.':     { x: 23, y: 47, region: 'southwest' },
  'Dallas, Texas':      { x: 50, y: 52, region: 'south' },
  'Houston, Texas':     { x: 52, y: 58, region: 'south' },
  'Austin, Texas':      { x: 50, y: 56, region: 'south' },

  // West
  'San Diego, Calif.':  { x: 15, y: 47, region: 'west' },
  'Hillsborough, Calif.':{ x: 10, y: 37, region: 'west' },
  'Los Angeles, Calif.':{ x: 13, y: 46, region: 'west' },
  'San Francisco, Calif.':{ x: 10, y: 38, region: 'west' },
  'Seattle, Wash.':     { x: 12, y: 12, region: 'west' },
  'Denver, Colo.':      { x: 34, y: 33, region: 'west' },
}

export function findCoords(hometown: string | undefined): PlaceCoords | null {
  if (!hometown) return null
  const direct = PLACE_COORDS[hometown]
  if (direct) return direct
  // Try matching by state abbreviation to a major city
  const stateMatch = hometown.match(/,\s*([A-Z][a-z]+\.)$/)
  if (!stateMatch) return null
  return null
}

export const REGION_COLORS: Record<string, string> = {
  northeast: '#1a3a5c',
  southeast: '#2d6a4f',
  south:     '#5c3a1a',
  midwest:   '#3a4a5c',
  southwest: '#7a4a1a',
  west:      '#1a4a5c',
}
