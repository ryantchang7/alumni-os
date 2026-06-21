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
  photoUrl?: string | null
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
    whyLine = `Good fit. ${reasons[0]} and ${reasons[1]}.`
  } else if (reasons.length === 1) {
    whyLine = `Good fit. ${reasons[0]}.`
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
  /** Sender's role on the team. Drives whether the intro reads as a
   * current-player-to-alum reach-out or alum-to-anyone reach-out.
   * Defaults to 'current_player' to preserve historical behavior. */
  senderRole?: 'current_player' | 'alumni' | 'parent'
}

const CONTEXT_SENTENCE: Record<string, string> = {
  exploring_field: "Still figuring out where I want to land.",
  applying_to_role: "I'm in the middle of recruiting right now.",
  in_their_city: "I'll be in your city soon and figured it'd be worth saying hi.",
  learn_their_path: "I'd love to hear where Penn Golf took you.",
  referred: "A teammate pointed me your way.",
  want_to_play: "Been hoping to get a round in with an alum.",
  summer_advice: "Thinking about the summer and trying to make the most of it.",
  preparing_interviews: "Heads-down on interview prep. Any real perspective goes a long way.",
}

function purposeLines(
  purpose: string,
  profile: ProfileForScoring,
  senderRole: 'current_player' | 'alumni' | 'parent' = 'current_player',
): { intro: string; ask: string } {
  // Self-identifying opener swaps based on who's sending. Default is the
  // most common case (current player asking an alum).
  const selfId =
    senderRole === 'alumni'
      ? 'a Penn Golf alum'
      : senderRole === 'parent'
        ? 'part of the Penn Golf family'
        : 'on the Penn Golf team'

  const careerLine = profile.career?.currentRole && profile.career?.currentCompany
    ? `. Saw you're doing ${profile.career.currentRole} at ${profile.career.currentCompany}`
    : profile.career?.currentRole
      ? `. Saw you're in ${profile.career.currentRole}`
      : profile.career?.currentCompany
        ? `. Saw you're at ${profile.career.currentCompany}`
        : ''

  const topicsNote = profile.helpTopics && profile.helpTopics.length > 0
    ? ` and that you're open to ${profile.helpTopics.slice(0, 2).join(' and ')}`
    : ''

  // Open-ended template used by the "Something else" purpose. Lets the
  // sender write their own body in step 4.
  if (purpose === 'custom') {
    return {
      intro: `I'm ${selfId} and wanted to reach out`,
      ask: `[Write what you want to say here.]`,
    }
  }

  switch (purpose) {
    case 'career_advice':
      return {
        intro: `I'm ${selfId} and starting to think about life after Penn${careerLine}${topicsNote}`,
        ask: `Any chance you'd be up for 20 minutes? Would love to hear about your path and whatever advice you'd give your younger self.`,
      }
    case 'coffee_chat':
      return {
        intro: `I'm ${selfId} and just wanted to say hi${topicsNote}`,
        ask: `If you're up for a quick coffee, virtual or in person if we end up in the same city, I'd love that.`,
      }
    case 'mentorship':
      return {
        intro: `I'm ${selfId} and starting to think seriously about what comes next${careerLine}`,
        ask: `Looking for someone who'd be willing to stay in touch as I figure things out. Would love to hear how you'd approach it from where I'm sitting.`,
      }
    case 'interview_prep':
      return {
        intro: `I'm ${selfId} and deep in recruiting${careerLine}${topicsNote}`,
        ask: `Could I steal 20 minutes? Trying to get the real story on the process from someone who's actually been through it.`,
      }
    case 'resume_review':
      return {
        intro: `I'm ${selfId} and tightening up my resume before I start sending it out${topicsNote}`,
        ask: `If you have a few minutes to give it a quick once-over, I'd really appreciate it.`,
      }
    case 'internship_guidance':
      return {
        intro: `I'm ${selfId} and starting to line up summer plans${careerLine}`,
        ask: `Would love 20 minutes if you'd be up for it. Figuring out how to land a strong internship and any advice from your route would go a long way.`,
      }
    case 'job_referral':
      return {
        intro: `I'm ${selfId} and seriously interested in ${profile.career?.currentCompany ?? 'where you work'}${careerLine ? '' : ''}`,
        ask: `If there's an open role I'd be a fit for, I'd be incredibly grateful for a referral. Happy to send over my resume so you can take a look first.`,
      }
    case 'warm_introduction':
      return {
        intro: `I'm ${selfId} and trying to build some real connections in your field${careerLine}`,
        ask: `If anyone in your network would be worth a quick chat, I'd really appreciate the intro.`,
      }
    case 'grad_school':
      return {
        intro: `I'm ${selfId} and starting to think about grad school${careerLine ? careerLine : ''}`,
        ask: `Would love 20 minutes to hear how you decided on your path, when you applied, and anything you wish you'd known going in.`,
      }
    case 'golf_round':
      return {
        intro: `I'm ${selfId} and would love to get out on the course with a Penn alum`,
        ask: `If you're ever up for a round, I'm in. Happy to drive to wherever you play.`,
      }
    case 'city_advice': {
      const city = profile.career?.city ? ` in ${profile.career.city}` : ''
      return {
        intro: `I'm ${selfId} and might be spending time${city} soon. Thought you'd be the right person to ask`,
        ask: `Any tips on the city, neighborhoods, places to go, people worth meeting, would be huge.`,
      }
    }
    default:
      return {
        intro: `I'm ${selfId} and figured I'd reach out`,
        ask: `Would love to hear where Penn Golf has taken you since.`,
      }
  }
}

export function generateDraft(params: DraftParams): string {
  const { purpose, contextKey, additionalContext, fromName, profile, senderRole } = params
  const first = profile.firstName ?? profile.canonicalName.split(' ')[0]
  const sign = fromName.trim() ? `\n\n${fromName.trim()}` : ''

  // Custom flow: the sender's freeform text becomes the body. We still
  // wrap it in a clean Hey / Thanks so it reads as a real note.
  if (purpose === 'custom') {
    const extra = additionalContext.trim()
    const body = extra ? extra : '[Write your message here.]'
    return `Hey ${first},\n\n${body}\n\nThanks,${sign}`
  }

  const { intro, ask } = purposeLines(purpose, profile, senderRole)
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

  return `Hey ${first},\n\n${body}\n\nThanks, appreciate it.${sign}`
}
