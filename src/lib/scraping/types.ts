export interface DiscoveryPreviewInput {
  teamName: string
  schoolName?: string
  sport?: string
  gender?: string
  website: string
}

export type PageType =
  | 'current_roster'
  | 'historical_roster'
  | 'player_bio'
  | 'schedule'
  | 'results'
  | 'stats'
  | 'news'
  | 'staff'
  | 'recruits'
  | 'media_guide'
  | 'unknown'

export interface FetchedPage {
  url: string
  finalUrl: string
  status: number
  title?: string
  html: string
  text: string
  contentType?: string | null
  warnings: string[]
}

export interface DiscoveredPagePreview {
  url: string
  label: string
  pageType: PageType
  season?: string
  confidence: number
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export interface RosterEntryPreview {
  fullName: string
  classLabel?: string
  hometown?: string
  highSchool?: string
  bioUrl?: string
  sourceUrl: string
  extractionConfidence: number
  rawText?: string
}

export interface DiscoveryPreviewResponse {
  team: {
    teamName: string
    schoolName?: string
    sport?: string
    gender?: string
    website: string
  }
  rootPage?: {
    url: string
    finalUrl: string
    title?: string
    status: number
    contentType?: string | null
  }
  discoveredPages: DiscoveredPagePreview[]
  rosterEntriesFromRootIfAny: RosterEntryPreview[]
  warnings: string[]
  trustNotes: string[]
}
