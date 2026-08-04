import { NextRequest, NextResponse } from 'next/server'
import { requireApprovedMember, requireFounder } from '@/lib/auth/guards'
import { checkRateLimit, ipFromRequest } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { notify } from '@/lib/notifications/notify'
import type { PlayerAlumniRequest } from '@/lib/store/types'

const PURPOSE_LABELS: Record<string, string> = {
  career_advice: 'Career advice',
  coffee_chat: 'Coffee chat',
  mentorship: 'Mentorship',
  warm_introduction: 'Warm introduction',
  internship_guidance: 'Internship guidance',
  interview_prep: 'Interview prep',
  resume_review: 'Resume review',
  golf_round: 'Golf round',
  city_advice: 'City advice',
  golf_connection: 'Golf connection',
  drinks_informal: 'Drinks / informal meet',
  general_intro: 'General intro',
}

const CONTEXT_LABELS: Record<string, string> = {
  exploring_field: 'Exploring this field',
  applying_to_role: 'Applying to a role',
  in_their_city: 'Will be in your city',
  learn_their_path: 'Wants to learn about your path',
  referred: 'Referred by a teammate or coach',
  want_to_play: 'Wants to play a round',
  summer_advice: 'Looking for summer advice',
  preparing_interviews: 'Preparing for interviews',
}

export async function GET(request: NextRequest) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')
  const fromName = searchParams.get('fromName')

  if (!teamSlug || !fromName) {
    return NextResponse.json({ error: 'teamSlug and fromName are required' }, { status: 400 })
  }

  const { getTeamBySlug, readStore } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const store = await readStore()

  // Scope to the caller's own sent requests. These carry private free-text
  // messages, and the `fromName` filter would otherwise let any signed-in
  // member enumerate another person's outreach by guessing their name. We
  // bind the lookup to the caller's authoritative linked-person name; a
  // member may only read requests they themselves sent. Founders may query
  // any name.
  const linkedPerson = store.people.find(p => p.id === g.session.linkedPersonId)
  const callerName = (linkedPerson?.canonicalName ?? g.session.user?.name ?? '').trim().toLowerCase()
  const requested = fromName.trim().toLowerCase()
  if (requested !== callerName) {
    const founder = await requireFounder()
    if (!founder.ok) {
      return NextResponse.json(
        { error: 'You can only view requests you sent' },
        { status: 403 },
      )
    }
  }

  const needle = fromName.trim().toLowerCase()

  const rawRequests = store.playerAlumniRequests
    .filter(r => r.teamId === team.id && r.fromName.toLowerCase() === needle)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const requests = rawRequests.map(r => {
    const person = store.people.find(p => p.id === r.alumniPersonId)
    return {
      id: r.id,
      alumniPersonId: r.alumniPersonId,
      alumniName: person?.canonicalName ?? r.alumniPersonId,
      purposeKey: r.purpose,
      purposeLabel: PURPOSE_LABELS[r.purpose] ?? r.purpose,
      contextKey: r.context,
      contextLabel: r.context ? (CONTEXT_LABELS[r.context] ?? r.context) : undefined,
      additionalContext: r.additionalContext,
      message: r.message,
      status: r.status,
      responseMessage: r.responseMessage,
      suggestedPersonId: r.suggestedPersonId,
      suggestedPersonName: r.suggestedPersonName,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
      closedAt: r.closedAt,
    }
  })

  return NextResponse.json({ requests })
}

const VALID_PURPOSES: PlayerAlumniRequest['purpose'][] = [
  'career_advice',
  'coffee_chat',
  'mentorship',
  'golf_connection',
  'warm_introduction',
  'internship_guidance',
  'interview_prep',
  'resume_review',
  'golf_round',
  'city_advice',
  'drinks_informal',
  'general_intro',
  // These three were offered by the Ask UI but rejected here, so the flow
  // 400'd at the final click after the user had written their whole note.
  'job_referral',
  'grad_school',
  'custom',
]

export async function POST(request: NextRequest) {
  // Approved members only. This writes a request record AND fires a
  // notification into a member's inbox, so it must not be anonymous.
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  // Rate-limit per IP before any heavy work —
  // rate-limit per IP before any heavy work. Generous window so no real user
  // hits it; the limiter fails open if Redis is down.
  const ip = ipFromRequest(request)
  const { ok } = await checkRateLimit(`player-request:${ip}`, 6, 600)
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests — please try again in a few minutes.' },
      { status: 429 },
    )
  }

  let body: {
    teamSlug?: string
    alumniPersonId?: string
    fromName?: string
    fromEmail?: string
    purpose?: string
    context?: string
    additionalContext?: string
    message?: string
    turnstileToken?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // CAPTCHA (Cloudflare Turnstile). No-op fail-open until TURNSTILE_SECRET_KEY
  // is set — behavior is identical to today until keys exist.
  const captchaOk = await verifyTurnstile(body.turnstileToken, ip)
  if (!captchaOk) {
    return NextResponse.json(
      { error: 'Verification failed — please try again.' },
      { status: 403 },
    )
  }

  const { teamSlug, alumniPersonId, fromName, purpose, context, additionalContext, message, fromEmail } = body

  if (!teamSlug || !alumniPersonId || !fromName || !purpose || !message) {
    return NextResponse.json(
      { error: 'teamSlug, alumniPersonId, fromName, purpose, and message are required' },
      { status: 400 },
    )
  }

  if (!VALID_PURPOSES.includes(purpose as PlayerAlumniRequest['purpose'])) {
    return NextResponse.json({ error: 'Invalid purpose value' }, { status: 400 })
  }

  const trimmedName = fromName.trim()
  if (trimmedName.length < 2) {
    return NextResponse.json({ error: 'fromName must be at least 2 characters' }, { status: 400 })
  }
  if (trimmedName.length > 100) {
    return NextResponse.json({ error: 'fromName must be 100 characters or fewer' }, { status: 400 })
  }

  const trimmedMessage = message.trim()
  if (trimmedMessage.length < 10) {
    return NextResponse.json({ error: 'message must be at least 10 characters' }, { status: 400 })
  }
  if (trimmedMessage.length > 2000) {
    return NextResponse.json({ error: 'message must be 2000 characters or fewer' }, { status: 400 })
  }

  if (fromEmail) {
    const email = fromEmail.trim()
    if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'fromEmail is not a valid email address' }, { status: 400 })
    }
  }

  if (additionalContext && additionalContext.trim().length > 1000) {
    return NextResponse.json({ error: 'additionalContext must be 1000 characters or fewer' }, { status: 400 })
  }

  const {
    getTeamBySlug,
    getTeamMembershipsForTeam,
    readStore,
    createPlayerAlumniRequest,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === alumniPersonId)

  if (!membership) {
    return NextResponse.json({ error: 'Member not found on this team' }, { status: 404 })
  }

  if (!membership.publishedToNetwork) {
    return NextResponse.json(
      { error: 'This member is not available for requests' },
      { status: 403 },
    )
  }

  const store = await readStore()
  const enrichment = store.personEnrichments.find(
    e => e.personId === alumniPersonId && e.teamId === team.id,
  )

  if (enrichment?.visibleToPlayers === false) {
    return NextResponse.json(
      { error: 'This member is not available for requests' },
      { status: 403 },
    )
  }

  const req = await createPlayerAlumniRequest({
    teamId: team.id,
    alumniPersonId,
    fromName: trimmedName,
    fromEmail: fromEmail?.trim() || undefined,
    purpose: purpose as PlayerAlumniRequest['purpose'],
    // `context` is free-text (not enum-validated like `purpose`), so cap it
    // before it lands in the single JSON blob. fromName/message/additionalContext
    // already enforce length above.
    context: context?.trim().slice(0, 400) || undefined,
    additionalContext: additionalContext?.trim() || undefined,
    message: trimmedMessage,
  })

  // Notify the target alumnus (if their account is linked). Additive — a
  // notification failure never blocks the request itself. notify() handles
  // its own errors so we just await it.
  const recipient = store.accounts.find(
    a => a.linkedPersonId === alumniPersonId && a.teamId === team.id,
  )
  const purposeLabel = PURPOSE_LABELS[purpose as string] ?? 'a request'
  if (recipient) {
    await notify(recipient.id, {
      type: 'request',
      title: `${trimmedName} reached out`,
      body: `${purposeLabel} — open your inbox to respond.`,
      href: '/alumni/requests',
    })
    // Email too. The bell + web push alone meant asks were effectively silent
    // (almost nobody has push enabled), while the sender was told it landed.
    try {
      const { renderAskEmail } = await import('@/lib/email/templates')
      const { sendEmail } = await import('@/lib/email/send')
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
      const { subject, html } = renderAskEmail({
        recipientFirstName: recipient.name?.split(/\s+/)[0] ?? null,
        fromName: trimmedName,
        purposeLabel,
        message: trimmedMessage,
        url: `${baseUrl}/alumni/requests`,
      })
      if (recipient.email) await sendEmail({ to: recipient.email, subject, html })
    } catch (e) {
      console.warn('[ask-email] send failed:', e)
    }
  }

  return NextResponse.json({
    request: {
      id: req.id,
      alumniPersonId: req.alumniPersonId,
      fromName: req.fromName,
      purpose: req.purpose,
      status: req.status,
      createdAt: req.createdAt,
    },
  })
}
