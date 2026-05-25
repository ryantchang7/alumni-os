export interface ProfileForScoring {
  personId: string
  canonicalName: string
  firstName?: string
  memberRole: 'current_player' | 'alumni'
  career?: { currentRole?: string; currentCompany?: string; city?: string }
  helpTopics?: string[]
  openToCoffee?: boolean
  openToMentorship?: boolean
  openToWarmIntroductions?: boolean
  openToGolfRounds?: boolean
  availabilityLevel?: string
  contactPreference?: string
  hometown?: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
}

export interface ScoredProfile extends ProfileForScoring {
  score: number
  whyLine: string
}

const PURPOSE_PRIMARY_OPEN: Record<string, keyof ProfileForScoring> = {
  career_advice: 'openToMentorship',
  mentorship: 'openToMentorship',
  resume_review: 'openToMentorship',
  internship_guidance: 'openToMentorship',
  interview_prep: 'openToCoffee',
  coffee_chat: 'openToCoffee',
  city_advice: 'openToCoffee',
  warm_introduction: 'openToWarmIntroductions',
  golf_round: 'openToGolfRounds',
}

const PURPOSE_KEYWORDS: Record<string, string[]> = {
  career_advice: ['career', 'finance', 'consulting', 'banking', 'tech', 'strategy', 'business'],
  mentorship: ['mentor', 'advice', 'career', 'guidance'],
  resume_review: ['resume', 'career', 'recruiting', 'apply'],
  internship_guidance: ['internship', 'summer', 'recruiting', 'finance', 'tech'],
  interview_prep: ['interview', 'recruiting', 'consulting', 'banking', 'prep'],
  coffee_chat: ['coffee', 'chat', 'connect', 'meet'],
  city_advice: ['city', 'local', 'move', 'live'],
  warm_introduction: ['intro', 'introduction', 'network', 'connect'],
  golf_round: ['golf', 'round', 'play'],
}

const OPEN_FIELD_LABEL: Record<string, string> = {
  openToMentorship: 'open to mentorship',
  openToCoffee: 'open to coffee chats',
  openToWarmIntroductions: 'open to warm introductions',
  openToGolfRounds: 'open to golf rounds',
}

const CAREER_PURPOSES = new Set([
  'career_advice', 'mentorship', 'interview_prep', 'resume_review',
  'internship_guidance', 'warm_introduction',
])

export function scoreProfile(
  profile: ProfileForScoring,
  purpose: string,
  contextKey: string,
): { score: number; whyLine: string } {
  let score = 0
  const reasons: string[] = []

  // Alumni score higher for career-oriented purposes
  if (profile.memberRole === 'alumni') {
    score += 1
    if (CAREER_PURPOSES.has(purpose)) score += 1
  } else if (CAREER_PURPOSES.has(purpose)) {
    score -= 2
  }

  // Primary open-to signal
  const primaryField = PURPOSE_PRIMARY_OPEN[purpose] as keyof ProfileForScoring | undefined
  if (primaryField && profile[primaryField]) {
    score += 4
    const label = OPEN_FIELD_LABEL[primaryField as string]
    if (label) reasons.push(label)
  }

  // Help topics keyword match
  const keywords = PURPOSE_KEYWORDS[purpose] ?? []
  const topicHit = profile.helpTopics?.find(t =>
    keywords.some(kw => t.toLowerCase().includes(kw)),
  )
  if (topicHit) {
    score += 3
    reasons.push(`profile mentions "${topicHit}"`)
  }

  // Verified career info
  if (profile.career) {
    score += 1
    if (reasons.length === 0) reasons.push('has career information available')
  }

  // Availability
  if (profile.availabilityLevel === 'open') score += 2
  else if (profile.availabilityLevel === 'two_per_month') score += 1

  // Not opted out
  if (profile.contactPreference === 'not_available') score -= 5

  // City context
  if (contextKey === 'in_their_city' && profile.career?.city) {
    score += 2
    reasons.push(`located in ${profile.career.city}`)
  }

  // Build why line
  let whyLine: string
  if (reasons.length >= 2) {
    whyLine = `Good fit — ${reasons[0]} and ${reasons[1]}.`
  } else if (reasons.length === 1) {
    whyLine = `Good fit — ${reasons[0]}.`
  } else if (profile.memberRole === 'alumni') {
    whyLine = 'Penn Golf alumnus who may be able to help.'
  } else {
    whyLine = 'Penn Golf member.'
  }

  return { score, whyLine }
}

export function scoreAndSort(
  profiles: ProfileForScoring[],
  purpose: string,
  contextKey: string,
): ScoredProfile[] {
  return profiles
    .map(p => ({ ...p, ...scoreProfile(p, purpose, contextKey) }))
    .filter(p => p.score > -2)
    .sort((a, b) => b.score - a.score)
}

// ── Draft generation ──────────────────────────────────────────────────────────

export interface DraftParams {
  purpose: string
  contextKey: string
  additionalContext: string
  fromName: string
  profile: ProfileForScoring
}

const CONTEXT_SENTENCE: Record<string, string> = {
  exploring_field: "I'm still in the early stages of exploring this field.",
  applying_to_role: "I'm currently going through the recruiting process.",
  in_their_city: "I'll be spending time in your city and thought it might be a chance to connect in person.",
  learn_their_path: "I'd love to hear how your path has unfolded since Penn Golf.",
  referred: "I was referred by a teammate and thought it was worth reaching out.",
  want_to_play: "I've been hoping to get a round in with an alum.",
  summer_advice: "I'm thinking ahead to the summer and trying to make the most of it.",
  preparing_interviews: "I'm actively preparing for recruiting and any real perspective would be invaluable.",
}

function purposeLines(purpose: string, profile: ProfileForScoring): { intro: string; ask: string } {
  const careerLine = profile.career?.currentRole && profile.career?.currentCompany
    ? ` — I came across your background in ${profile.career.currentRole} at ${profile.career.currentCompany}`
    : profile.career?.currentRole
      ? ` — I saw you work in ${profile.career.currentRole}`
      : profile.career?.currentCompany
        ? ` — I saw you work at ${profile.career.currentCompany}`
        : ''

  const topicsNote = profile.helpTopics && profile.helpTopics.length > 0
    ? ` and saw that you're open to helping with ${profile.helpTopics.slice(0, 2).join(' and ')}`
    : ''

  switch (purpose) {
    case 'career_advice':
      return {
        intro: `I'm a current Penn Golf player exploring careers after Penn${careerLine}${topicsNote}`,
        ask: `I'd be grateful for 20 minutes to hear about your path and any advice you'd offer someone just getting started.`,
      }
    case 'coffee_chat':
      return {
        intro: `I'm a current Penn Golf player who would love the chance to connect${topicsNote}`,
        ask: `If you're open to it, I'd love to grab a quick coffee — virtual or in person if we're ever in the same city.`,
      }
    case 'mentorship':
      return {
        intro: `I'm a current Penn Golf player looking to find a mentor as I start thinking seriously about my career${careerLine}`,
        ask: `I'd be honored to connect and hear your perspective as I figure out my path after Penn.`,
      }
    case 'interview_prep':
      return {
        intro: `I'm a current Penn Golf player preparing for recruiting${careerLine}${topicsNote}`,
        ask: `I'd be grateful for 20 minutes to hear about your experience and any advice on the interview process.`,
      }
    case 'resume_review':
      return {
        intro: `I'm a current Penn Golf player working on my resume for upcoming recruiting${topicsNote}`,
        ask: `If you're open to it, even a few minutes of your feedback would be incredibly helpful.`,
      }
    case 'internship_guidance':
      return {
        intro: `I'm a current Penn Golf player exploring internship opportunities${careerLine}`,
        ask: `I'd love 20 minutes to hear about your experience and any advice for landing a strong internship.`,
      }
    case 'warm_introduction':
      return {
        intro: `I'm a current Penn Golf player hoping to build connections in your field${careerLine}`,
        ask: `If you know anyone who might be worth a conversation, I'd be very grateful for an introduction.`,
      }
    case 'golf_round':
      return {
        intro: `I'm a current Penn Golf player who would love to get on the course with a Penn alum`,
        ask: `If you're ever open to a round, I'd love to play together.`,
      }
    case 'city_advice': {
      const city = profile.career?.city ? ` in ${profile.career.city}` : ''
      return {
        intro: `I'm a current Penn Golf player who may be spending time${city} and thought you'd be a great person to ask`,
        ask: `Any advice on the area — neighborhoods, things to know, or people worth meeting — would mean a lot.`,
      }
    }
    default:
      return {
        intro: `I'm a current Penn Golf player reaching out`,
        ask: `I'd love to connect and hear about your experience since Penn Golf.`,
      }
  }
}

export function generateDraft(params: DraftParams): string {
  const { purpose, contextKey, additionalContext, fromName, profile } = params
  const first = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const { intro, ask } = purposeLines(purpose, profile)
  const contextSentence = CONTEXT_SENTENCE[contextKey] ?? ''
  const extra = additionalContext.trim()

  const bodyParts: string[] = [`${intro}.`]
  if (contextSentence) bodyParts.push(contextSentence)
  if (extra) {
    const extraFormatted = extra.endsWith('.') || extra.endsWith('!') || extra.endsWith('?')
      ? extra
      : `${extra}.`
    bodyParts.push(extraFormatted)
  }
  bodyParts.push(ask)

  const body = bodyParts.join(' ')
  const sign = fromName.trim() ? `\n\n${fromName.trim()}` : ''

  return `Hi ${first},\n\n${body}\n\nThank you for your support of Penn Golf.${sign}`
}
