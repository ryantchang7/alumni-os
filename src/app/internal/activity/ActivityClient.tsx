'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export interface MemberRow {
  name: string
  joinedAt: string
  profile: boolean
  messages: number
  moments: number
  comments: number
  rsvps: number
  hosted: number
  asks: number
  openReqs: number
  questions: number
  total: number
}

export interface UnclaimedRow {
  accountId: string
  name: string | null
  email: string
  signedUpAt: string
  matchName: string | null
  matchClassLabel: string | null
  matchBookId: string | null
  matchClaimedByOther: boolean
  clubYearsDetail: string | null
  nudgedAt: string | null
}

const day = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y ? `${m}/${d}/${y.slice(2)}` : iso
}

const COLS: { key: keyof MemberRow; label: string }[] = [
  { key: 'messages', label: 'Msgs' },
  { key: 'moments', label: 'Posts' },
  { key: 'comments', label: 'Cmts' },
  { key: 'rsvps', label: 'RSVPs' },
  { key: 'hosted', label: 'Hosted' },
  { key: 'openReqs', label: 'Reqs' },
  { key: 'asks', label: 'Asks' },
  { key: 'questions', label: 'Qs' },
]

export default function ActivityClient({
  members,
  unclaimed,
}: {
  members: MemberRow[]
  unclaimed: UnclaimedRow[]
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ email: string; variant: string; subject: string }[] | null>(null)

  const active = members.filter(m => m.total > 0).length
  const withProfile = members.filter(m => m.profile).length
  // Mirrors the route's own exclusions, so the count on the button is the
  // number of emails that will actually go out.
  const pending = unclaimed.filter(u => !u.nudgedAt && !u.matchClaimedByOther)
  const skipped = unclaimed.filter(u => u.matchClaimedByOther)

  async function run(send: boolean) {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/internal/claim-nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(send ? { send: true } : {}),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error ?? `Failed (${res.status})`)
      if (send) {
        setPreview(null)
        setResult(`Sent ${j.sent}.${j.errors?.length ? ` Errors: ${j.errors.join('; ')}` : ''}`)
      } else {
        setPreview(j.planned ?? [])
        setResult(`${j.wouldSend} would be written to. Nothing sent.`)
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[1100px] mx-auto">
          <Link
            href="/internal"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Internal
          </Link>
          <h1 className="text-white text-2xl font-medium font-heading mt-2">Who is actually doing anything</h1>
          <p className="text-white/60 text-[13px] mt-1">
            {members.length} claimed &middot; {withProfile} filled in a card &middot; {active} have
            done something &middot; {unclaimed.length} signed in and never claimed
          </p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-8 space-y-10">
        {/* Members */}
        <section>
          <h2 className="text-[#0a1628] text-lg font-medium font-heading mb-3">Members</h2>
          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl overflow-x-auto">
            <table className="w-full text-[13px] min-w-[680px]">
              <thead>
                <tr className="border-b border-[rgba(180,168,150,0.35)] bg-[#fdfcf9]">
                  <th className="text-left px-4 py-2.5 font-semibold text-ink-muted text-[10px] uppercase tracking-[0.14em]">
                    Name
                  </th>
                  <th className="text-left px-2 py-2.5 font-semibold text-ink-muted text-[10px] uppercase tracking-[0.14em]">
                    Card
                  </th>
                  {COLS.map(c => (
                    <th
                      key={c.key}
                      className="text-right px-2 py-2.5 font-semibold text-ink-muted text-[10px] uppercase tracking-[0.14em]"
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-2.5 font-semibold text-ink-muted text-[10px] uppercase tracking-[0.14em]">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr
                    key={m.name + m.joinedAt}
                    className={`border-b border-[rgba(180,168,150,0.18)] ${m.total === 0 ? 'opacity-55' : ''}`}
                  >
                    <td className="px-4 py-2 text-[#0a1628] whitespace-nowrap">{m.name}</td>
                    <td className="px-2 py-2">
                      {m.profile ? (
                        <span className="text-[#2d6a4f] font-semibold">yes</span>
                      ) : (
                        <span className="text-ink-muted">empty</span>
                      )}
                    </td>
                    {COLS.map(c => {
                      const v = m[c.key] as number
                      return (
                        <td
                          key={c.key}
                          className={`px-2 py-2 text-right tabular-nums ${v > 0 ? 'text-[#0a1628] font-semibold' : 'text-[#c9c2b6]'}`}
                        >
                          {v || '·'}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-right text-ink-muted tabular-nums whitespace-nowrap">
                      {day(m.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Signed in, never claimed */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
            <div>
              <h2 className="text-[#0a1628] text-lg font-medium font-heading">
                Signed in, never claimed
              </h2>
              <p className="text-[12.5px] text-ink-muted">
                They already have an account. {pending.length} will be written to
                {skipped.length > 0
                  ? `, ${skipped.length} skipped because the card is already claimed`
                  : ''}
                .
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(false)}
                className="text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg border border-[#0a1628]/25 text-[#0a1628] hover:bg-[#0a1628] hover:text-white transition-colors disabled:opacity-50"
              >
                Preview
              </button>
              <button
                type="button"
                disabled={busy || pending.length === 0}
                onClick={() => {
                  if (
                    window.confirm(
                      `Send a real email to ${pending.length} ${pending.length === 1 ? 'person' : 'people'}? This cannot be undone.`,
                    )
                  )
                    void run(true)
                }}
                className="text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg bg-[#990000] text-white hover:bg-[#7a0000] transition-colors disabled:opacity-40"
              >
                Send {pending.length > 0 ? pending.length : ''}
              </button>
            </div>
          </div>

          {result && (
            <p className="text-[13px] text-[#0a1628] mb-3 bg-[#c8a84b]/10 border border-[#c8a84b]/30 rounded-lg px-4 py-2.5">
              {result}
            </p>
          )}
          {preview && preview.length > 0 && (
            <ul className="mb-4 text-[12px] text-[#3d4a5c] bg-white border border-[rgba(180,168,150,0.4)] rounded-xl divide-y divide-[rgba(180,168,150,0.2)]">
              {preview.map(p => (
                <li key={p.email} className="px-4 py-2 flex gap-3 flex-wrap">
                  <span className="font-semibold text-[#0a1628]">{p.email}</span>
                  <span className="text-ink-muted">[{p.variant}]</span>
                  <span>{p.subject}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl overflow-x-auto">
            <table className="w-full text-[13px] min-w-[620px]">
              <thead>
                <tr className="border-b border-[rgba(180,168,150,0.35)] bg-[#fdfcf9]">
                  {['Name', 'Email', 'Likely card', 'Signed up', 'Written to'].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 font-semibold text-ink-muted text-[10px] uppercase tracking-[0.14em]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unclaimed.map(u => (
                  <tr key={u.accountId} className="border-b border-[rgba(180,168,150,0.18)]">
                    <td className="px-4 py-2 text-[#0a1628] whitespace-nowrap">{u.name ?? '—'}</td>
                    <td className="px-4 py-2 text-ink-muted">{u.email}</td>
                    <td className="px-4 py-2">
                      {u.matchBookId ? (
                        <>
                          <Link
                            href={`/member-book/${u.matchBookId}`}
                            className="text-[#990000] hover:underline"
                          >
                            {u.matchName}
                            {u.matchClassLabel ? ` · ${u.matchClassLabel}` : ''}
                          </Link>
                          {u.matchClaimedByOther && (
                            <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#990000]">
                              card taken, skipped
                            </span>
                          )}
                        </>
                      ) : u.clubYearsDetail ? (
                        <span className="text-[#0a1628]">
                          Club years, {u.clubYearsDetail}
                        </span>
                      ) : (
                        <span className="text-ink-muted">no match, gets the Join email</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-muted tabular-nums whitespace-nowrap">
                      {day(u.signedUpAt)}
                    </td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">
                      {u.nudgedAt ? (
                        <span className="text-ink-muted">{day(u.nudgedAt)}</span>
                      ) : (
                        <span className="text-[#990000] font-semibold">not yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
