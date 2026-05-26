/**
 * Curated list of US golf courses for the profile autocomplete. Focuses
 * on classic private clubs Penn Golf alumni would play, plus Top-100
 * publics and noteworthy resort + college courses. Free text still
 * accepted for anything off the list.
 */

export interface GolfCourse {
  name: string
  state: string  // 2-letter USPS code
}

export const US_GOLF_COURSES: GolfCourse[] = [
  // Northeast — classic privates (where most Penn alumni play)
  { name: 'Winged Foot Golf Club', state: 'NY' },
  { name: 'Quaker Ridge Golf Club', state: 'NY' },
  { name: 'Sleepy Hollow Country Club', state: 'NY' },
  { name: 'Westchester Country Club', state: 'NY' },
  { name: 'Fenway Golf Club', state: 'NY' },
  { name: 'Maidstone Club', state: 'NY' },
  { name: 'National Golf Links of America', state: 'NY' },
  { name: 'Shinnecock Hills Golf Club', state: 'NY' },
  { name: 'Friar’s Head', state: 'NY' },
  { name: 'Sebonack Golf Club', state: 'NY' },
  { name: 'The Bridge', state: 'NY' },
  { name: 'Atlantic Golf Club', state: 'NY' },
  { name: 'Garden City Golf Club', state: 'NY' },
  { name: 'Piping Rock Club', state: 'NY' },
  { name: 'The Creek Club', state: 'NY' },
  { name: 'Meadow Brook Club', state: 'NY' },
  { name: 'Engineers Country Club', state: 'NY' },
  { name: 'Apawamis Club', state: 'NY' },
  { name: 'Century Country Club', state: 'NY' },
  { name: 'Old Oaks Country Club', state: 'NY' },
  { name: 'Bonnie Briar Country Club', state: 'NY' },
  { name: 'Brae Burn Country Club', state: 'NY' },
  { name: 'Bethpage Black', state: 'NY' },
  { name: 'Bethpage State Park', state: 'NY' },

  // New Jersey
  { name: 'Pine Valley Golf Club', state: 'NJ' },
  { name: 'Baltusrol Golf Club', state: 'NJ' },
  { name: 'Plainfield Country Club', state: 'NJ' },
  { name: 'Ridgewood Country Club', state: 'NJ' },
  { name: 'Somerset Hills Country Club', state: 'NJ' },
  { name: 'Hollywood Golf Club', state: 'NJ' },
  { name: 'Trump National Golf Club Bedminster', state: 'NJ' },
  { name: 'Liberty National Golf Club', state: 'NJ' },
  { name: 'Galloping Hill Golf Course', state: 'NJ' },
  { name: 'Mountain Ridge Country Club', state: 'NJ' },
  { name: 'Hidden Creek Golf Club', state: 'NJ' },
  { name: 'Atlantic City Country Club', state: 'NJ' },

  // Connecticut
  { name: 'The Country Club of Fairfield', state: 'CT' },
  { name: 'Wee Burn Country Club', state: 'CT' },
  { name: 'Round Hill Club', state: 'CT' },
  { name: 'Greenwich Country Club', state: 'CT' },
  { name: 'Stanwich Club', state: 'CT' },
  { name: 'Innis Arden Golf Club', state: 'CT' },
  { name: 'Tamarack Country Club', state: 'CT' },
  { name: 'Brooklawn Country Club', state: 'CT' },
  { name: 'Yale Golf Course', state: 'CT' },

  // Pennsylvania — Penn's home turf
  { name: 'Merion Golf Club', state: 'PA' },
  { name: 'Aronimink Golf Club', state: 'PA' },
  { name: 'Philadelphia Cricket Club', state: 'PA' },
  { name: 'Huntingdon Valley Country Club', state: 'PA' },
  { name: 'Gulph Mills Golf Club', state: 'PA' },
  { name: 'Philadelphia Country Club', state: 'PA' },
  { name: 'Whitemarsh Valley Country Club', state: 'PA' },
  { name: 'Saucon Valley Country Club', state: 'PA' },
  { name: 'Lehigh Country Club', state: 'PA' },
  { name: 'Lookaway Golf Club', state: 'PA' },
  { name: 'Manufacturers’ Golf and Country Club', state: 'PA' },
  { name: 'Sunnehanna Country Club', state: 'PA' },
  { name: 'Oakmont Country Club', state: 'PA' },
  { name: 'Laurel Valley Golf Club', state: 'PA' },
  { name: 'Applebrook Golf Club', state: 'PA' },
  { name: 'Cobbs Creek Golf Course', state: 'PA' },

  // Massachusetts
  { name: 'The Country Club (Brookline)', state: 'MA' },
  { name: 'Myopia Hunt Club', state: 'MA' },
  { name: 'Charles River Country Club', state: 'MA' },
  { name: 'Brae Burn Country Club (Newton)', state: 'MA' },
  { name: 'Salem Country Club', state: 'MA' },
  { name: 'Eastward Ho! Country Club', state: 'MA' },
  { name: 'Old Sandwich Golf Club', state: 'MA' },
  { name: 'Boston Golf Club', state: 'MA' },
  { name: 'Essex County Club', state: 'MA' },
  { name: 'Kittansett Club', state: 'MA' },
  { name: 'Hyannisport Club', state: 'MA' },
  { name: 'Nantucket Golf Club', state: 'MA' },
  { name: 'Sankaty Head Golf Club', state: 'MA' },
  { name: 'Vineyard Golf Club', state: 'MA' },
  { name: 'Farm Neck Golf Club', state: 'MA' },

  // Rhode Island
  { name: 'Newport Country Club', state: 'RI' },

  // Maine / NH / VT
  { name: 'Cape Arundel Golf Club', state: 'ME' },
  { name: 'Sebasco Harbor Resort', state: 'ME' },
  { name: 'Belgrade Lakes Golf Club', state: 'ME' },
  { name: 'The Country Club at Mount Desert', state: 'ME' },
  { name: 'Lake Sunapee Country Club', state: 'NH' },
  { name: 'Bald Peak Colony Club', state: 'NH' },
  { name: 'Ekwanok Country Club', state: 'VT' },
  { name: 'Manchester Country Club', state: 'VT' },

  // DC area
  { name: 'Congressional Country Club', state: 'MD' },
  { name: 'Burning Tree Club', state: 'MD' },
  { name: 'Chevy Chase Club', state: 'MD' },
  { name: 'Columbia Country Club', state: 'MD' },
  { name: 'Kenwood Golf and Country Club', state: 'MD' },
  { name: 'Bethesda Country Club', state: 'MD' },
  { name: 'Argyle Country Club', state: 'MD' },
  { name: 'Caves Valley Golf Club', state: 'MD' },
  { name: 'Five Farms (Baltimore Country Club)', state: 'MD' },

  // Virginia
  { name: 'Robert Trent Jones Golf Club', state: 'VA' },
  { name: 'Belle Haven Country Club', state: 'VA' },
  { name: 'Army Navy Country Club', state: 'VA' },
  { name: 'The Country Club of Virginia', state: 'VA' },
  { name: 'Kinloch Golf Club', state: 'VA' },
  { name: 'Independence Golf Club', state: 'VA' },

  // North & South Carolina
  { name: 'Pinehurst No. 2', state: 'NC' },
  { name: 'Pinehurst No. 4', state: 'NC' },
  { name: 'Pinehurst No. 8', state: 'NC' },
  { name: 'Old Town Club', state: 'NC' },
  { name: 'Country Club of North Carolina', state: 'NC' },
  { name: 'Charlotte Country Club', state: 'NC' },
  { name: 'Eagle Point Golf Club', state: 'NC' },
  { name: 'Quail Hollow Club', state: 'NC' },
  { name: 'Forest Creek Golf Club', state: 'NC' },
  { name: 'Wade Hampton Golf Club', state: 'NC' },
  { name: 'Mountain Lake', state: 'NC' },
  { name: 'Yeamans Hall Club', state: 'SC' },
  { name: 'Kiawah Island Ocean Course', state: 'SC' },
  { name: 'Harbour Town Golf Links', state: 'SC' },
  { name: 'May River Golf Club', state: 'SC' },
  { name: 'Sage Valley Golf Club', state: 'SC' },
  { name: 'Long Cove Club', state: 'SC' },
  { name: 'Secession Golf Club', state: 'SC' },

  // Georgia
  { name: 'Augusta National Golf Club', state: 'GA' },
  { name: 'East Lake Golf Club', state: 'GA' },
  { name: 'Peachtree Golf Club', state: 'GA' },
  { name: 'Ohoopee Match Club', state: 'GA' },
  { name: 'Sea Island Golf Club', state: 'GA' },
  { name: 'Atlanta Athletic Club', state: 'GA' },
  { name: 'Capital City Club', state: 'GA' },

  // Florida
  { name: 'Seminole Golf Club', state: 'FL' },
  { name: 'The Bear’s Club', state: 'FL' },
  { name: 'Medalist Golf Club', state: 'FL' },
  { name: 'Trump National Doral', state: 'FL' },
  { name: 'TPC Sawgrass', state: 'FL' },
  { name: 'Streamsong Resort', state: 'FL' },
  { name: 'Calusa Pines Golf Club', state: 'FL' },
  { name: 'Naples National Golf Club', state: 'FL' },
  { name: 'Indian Creek Country Club', state: 'FL' },
  { name: 'Riviera Country Club (Coral Gables)', state: 'FL' },
  { name: 'Mountain Lake (Lake Wales)', state: 'FL' },
  { name: 'Jupiter Hills Club', state: 'FL' },
  { name: 'The Floridian', state: 'FL' },

  // Midwest
  { name: 'Chicago Golf Club', state: 'IL' },
  { name: 'Shoreacres', state: 'IL' },
  { name: 'Old Elm Club', state: 'IL' },
  { name: 'Onwentsia Club', state: 'IL' },
  { name: 'Skokie Country Club', state: 'IL' },
  { name: 'Olympia Fields Country Club', state: 'IL' },
  { name: 'Medinah Country Club', state: 'IL' },
  { name: 'Butler National Golf Club', state: 'IL' },
  { name: 'Rich Harvest Farms', state: 'IL' },
  { name: 'Crystal Downs Country Club', state: 'MI' },
  { name: 'Oakland Hills Country Club', state: 'MI' },
  { name: 'Country Club of Detroit', state: 'MI' },
  { name: 'Lost Dunes Golf Club', state: 'MI' },
  { name: 'Camargo Club', state: 'OH' },
  { name: 'Muirfield Village Golf Club', state: 'OH' },
  { name: 'Inverness Club', state: 'OH' },
  { name: 'Scioto Country Club', state: 'OH' },
  { name: 'NCR Country Club', state: 'OH' },
  { name: 'Whistling Straits', state: 'WI' },
  { name: 'Erin Hills', state: 'WI' },
  { name: 'Sand Valley Golf Resort', state: 'WI' },
  { name: 'Milwaukee Country Club', state: 'WI' },
  { name: 'Hazeltine National Golf Club', state: 'MN' },
  { name: 'Interlachen Country Club', state: 'MN' },
  { name: 'Prairie Dunes Country Club', state: 'KS' },

  // Texas
  { name: 'Dallas Country Club', state: 'TX' },
  { name: 'Brook Hollow Golf Club', state: 'TX' },
  { name: 'Trinity Forest Golf Club', state: 'TX' },
  { name: 'Whispering Pines Golf Club', state: 'TX' },
  { name: 'Champions Golf Club (Cypress Creek)', state: 'TX' },
  { name: 'River Oaks Country Club', state: 'TX' },
  { name: 'Colonial Country Club', state: 'TX' },
  { name: 'Austin Country Club', state: 'TX' },

  // California
  { name: 'Cypress Point Club', state: 'CA' },
  { name: 'Pebble Beach Golf Links', state: 'CA' },
  { name: 'Spyglass Hill Golf Course', state: 'CA' },
  { name: 'Monterey Peninsula Country Club', state: 'CA' },
  { name: 'The Olympic Club', state: 'CA' },
  { name: 'San Francisco Golf Club', state: 'CA' },
  { name: 'Lake Merced Golf Club', state: 'CA' },
  { name: 'California Golf Club of San Francisco', state: 'CA' },
  { name: 'Meadow Club', state: 'CA' },
  { name: 'Marin Country Club', state: 'CA' },
  { name: 'Mayacama Golf Club', state: 'CA' },
  { name: 'CordeValle', state: 'CA' },
  { name: 'Stanford Golf Course', state: 'CA' },
  { name: 'Pasatiempo Golf Club', state: 'CA' },
  { name: 'The Preserve Golf Club', state: 'CA' },
  { name: 'Diablo Country Club', state: 'CA' },
  { name: 'Claremont Country Club', state: 'CA' },
  { name: 'Half Moon Bay Golf Links', state: 'CA' },
  { name: 'Riviera Country Club', state: 'CA' },
  { name: 'Bel-Air Country Club', state: 'CA' },
  { name: 'Los Angeles Country Club', state: 'CA' },
  { name: 'Wilshire Country Club', state: 'CA' },
  { name: 'Brentwood Country Club', state: 'CA' },
  { name: 'Hillcrest Country Club', state: 'CA' },
  { name: 'Lakeside Golf Club', state: 'CA' },
  { name: 'Sherwood Country Club', state: 'CA' },
  { name: 'North Ranch Country Club', state: 'CA' },
  { name: 'Annandale Golf Club', state: 'CA' },
  { name: 'Newport Beach Country Club', state: 'CA' },
  { name: 'Big Canyon Country Club', state: 'CA' },
  { name: 'Pelican Hill Golf Club', state: 'CA' },
  { name: 'Shady Canyon Golf Club', state: 'CA' },
  { name: 'Monarch Beach Golf Links', state: 'CA' },
  { name: 'The Bridges at Rancho Santa Fe', state: 'CA' },
  { name: 'The Farms Golf Club', state: 'CA' },
  { name: 'Rancho Santa Fe Golf Club', state: 'CA' },
  { name: 'La Jolla Country Club', state: 'CA' },
  { name: 'Torrey Pines Golf Course', state: 'CA' },
  { name: 'The Vintage Club', state: 'CA' },
  { name: 'Stone Eagle Golf Club', state: 'CA' },
  { name: 'The Quarry at La Quinta', state: 'CA' },
  { name: 'Madison Club', state: 'CA' },
  { name: 'Toscana Country Club', state: 'CA' },
  { name: 'The Reserve Club at Indian Wells', state: 'CA' },
  { name: 'Mission Hills Country Club', state: 'CA' },
  { name: 'PGA West', state: 'CA' },
  { name: 'La Quinta Resort & Club', state: 'CA' },

  // PNW + Mountain
  { name: 'Sahalee Country Club', state: 'WA' },
  { name: 'Chambers Bay', state: 'WA' },
  { name: 'Bandon Dunes', state: 'OR' },
  { name: 'Pacific Dunes', state: 'OR' },
  { name: 'Old Macdonald', state: 'OR' },
  { name: 'Sheep Ranch', state: 'OR' },
  { name: 'Pumpkin Ridge', state: 'OR' },
  { name: 'Castle Pines Golf Club', state: 'CO' },
  { name: 'Cherry Hills Country Club', state: 'CO' },
  { name: 'Ballyneal', state: 'CO' },
  { name: 'Roaring Fork Club', state: 'CO' },
  { name: 'Maroon Creek Club', state: 'CO' },
  { name: 'Promontory Club', state: 'UT' },
  { name: 'Glenwild Golf Club', state: 'UT' },
  { name: 'Estancia Club', state: 'AZ' },
  { name: 'Whisper Rock Golf Club', state: 'AZ' },
  { name: 'Desert Forest Golf Club', state: 'AZ' },
  { name: 'Desert Mountain Club', state: 'AZ' },
  { name: 'Boulders Club', state: 'AZ' },
  { name: 'Bandon Trails', state: 'OR' },
  { name: 'Tetherow Golf Club', state: 'OR' },
  { name: 'Crosswater Club', state: 'OR' },
  { name: 'Aldarra Golf Club', state: 'WA' },
  { name: 'Broadmoor Golf Club (Seattle)', state: 'WA' },
  { name: 'Wine Valley Golf Club', state: 'WA' },
  { name: 'Shadow Creek Golf Course', state: 'NV' },
  { name: 'Wynn Golf Club', state: 'NV' },
  { name: 'Cascata Golf Course', state: 'NV' },
  { name: 'The Summit Club', state: 'NV' },
  { name: 'Edgewood Tahoe', state: 'NV' },
  { name: 'Martis Camp Club', state: 'CA' },
  { name: 'Lahontan Golf Club', state: 'CA' },
  { name: 'Forest Highlands Golf Club', state: 'AZ' },
  { name: 'Desert Highlands Golf Club', state: 'AZ' },
  { name: 'Troon Country Club', state: 'AZ' },
  { name: 'Mirabel Club', state: 'AZ' },
  { name: 'Silverleaf Club', state: 'AZ' },
  { name: 'Talking Stick Golf Club', state: 'AZ' },
  { name: 'We-Ko-Pa Golf Club', state: 'AZ' },
  { name: 'TPC Scottsdale', state: 'AZ' },
  { name: 'Phoenix Country Club', state: 'AZ' },
  { name: 'Arizona Country Club', state: 'AZ' },
  { name: 'Paradise Valley Country Club', state: 'AZ' },
  { name: 'Princeville Makai Golf Club', state: 'HI' },
  { name: 'Kapalua Plantation Course', state: 'HI' },
  { name: 'Mauna Kea Golf Course', state: 'HI' },
  { name: 'Hualalai Golf Club', state: 'HI' },
  { name: 'Wailea Golf Club', state: 'HI' },
  { name: 'Waialae Country Club', state: 'HI' },
  { name: 'Oahu Country Club', state: 'HI' },
  // More Florida
  { name: 'Old Marsh Golf Club', state: 'FL' },
  { name: 'Loblolly Pines Golf Club', state: 'FL' },
  { name: 'The Lost Tree Club', state: 'FL' },
  { name: 'Frenchman’s Creek Beach and Country Club', state: 'FL' },
  { name: 'Old Palm Golf Club', state: 'FL' },
  { name: 'Boca West Country Club', state: 'FL' },
  { name: 'St. Andrews Country Club', state: 'FL' },
  { name: 'Mizner Country Club', state: 'FL' },
  { name: 'Quail Ridge Country Club', state: 'FL' },
  { name: 'Ibis Golf and Country Club', state: 'FL' },
  { name: 'Wycliffe Golf and Country Club', state: 'FL' },
  { name: 'Bear Lakes Country Club', state: 'FL' },
  { name: 'BallenIsles Country Club', state: 'FL' },
  { name: 'PGA National Resort', state: 'FL' },
  { name: 'McArthur Golf Club', state: 'FL' },
  { name: 'Old Marsh Golf Club', state: 'FL' },
  { name: 'Sailfish Point', state: 'FL' },
  { name: 'Loxahatchee Club', state: 'FL' },
  { name: 'Old Memorial Golf Club', state: 'FL' },
  { name: 'World Woods (Pine Barrens / Rolling Oaks)', state: 'FL' },
  { name: 'Concession Golf Club', state: 'FL' },
  { name: 'Quail Valley Golf Club', state: 'FL' },
  { name: 'Pelican’s Nest Golf Club', state: 'FL' },
  { name: 'Bonita Bay Club', state: 'FL' },
  { name: 'Long Boat Key Club', state: 'FL' },
  { name: 'TPC Tampa Bay', state: 'FL' },
  { name: 'Black Diamond Ranch', state: 'FL' },
  { name: 'Mountain Lake (Lake Wales, FL)', state: 'FL' },
  { name: 'Ocean Reef Club', state: 'FL' },
  { name: 'The Floridian National', state: 'FL' },

  // Hawaii
  { name: 'Manele Golf Course', state: 'HI' },
  { name: 'Nanea Golf Club', state: 'HI' },
  { name: 'Hokuli‘a', state: 'HI' },
]

export function searchCourses(query: string, limit = 8): GolfCourse[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const exact: GolfCourse[] = []
  const prefix: GolfCourse[] = []
  const contains: GolfCourse[] = []
  const seen = new Set<string>()

  for (const c of US_GOLF_COURSES) {
    const key = `${c.name}|${c.state}`
    if (seen.has(key)) continue
    const lower = c.name.toLowerCase()
    if (lower === q) {
      seen.add(key)
      exact.push(c)
    } else if (lower.startsWith(q)) {
      seen.add(key)
      prefix.push(c)
    } else if (lower.includes(q)) {
      seen.add(key)
      contains.push(c)
    }
  }

  return [...exact, ...prefix, ...contains].slice(0, limit)
}
