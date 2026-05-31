'use client'

/**
 * Internal launch kit. Captain-only. Everything Ryan needs to record
 * the launch video and push the marketing campaign, on one page.
 *
 * Sections (anchor links at top):
 *   - Plan
 *   - Scripts (60 / 90 / 120 with copy + teleprompter link)
 *   - Storyboard
 *   - Recording checklist
 *   - Marketing copy blocks
 *   - AI B-roll prompts
 *   - Assets + sizes
 *
 * Self-check banner at the top runs `getProhibitedHits()` against
 * every script + copy block so the corporate-vocab guarantee is
 * visible, not hidden in a test file.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  SCRIPTS,
  STORYBOARD,
  RECORDING_CHECKLIST,
  COPY_BLOCKS,
  AI_VIDEO_PROMPTS,
  AI_VIDEO_WARNINGS,
  RECORDING_SIZES,
  RECORDING_FLOW,
  ASSET_REFS,
  PROHIBITED_WORDS,
  ACCESS_AFFIRMATION,
  TAGLINE,
  DAY_BEFORE_CHECKLIST,
  SHOOT_DAY_PHASES,
  SCREEN_CAPTURE_PLAYBOOK,
  TALKING_HEAD_PLAYBOOK,
  TOOL_COMPARISON,
  POST_PRODUCTION_LAYOUT,
  POST_PRODUCTION_REVIEW_PASSES,
  COMMON_MISTAKES,
  getProhibitedHits,
} from '@/lib/launch-kit/content'

const SECTIONS = [
  { id: 'plan', label: 'Plan' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'storyboard', label: 'Storyboard' },
  { id: 'shoot', label: 'Shoot Day' },
  { id: 'recording', label: 'Recording' },
  { id: 'copy', label: 'Copy blocks' },
  { id: 'broll', label: 'AI B-roll' },
  { id: 'assets', label: 'Assets' },
] as const

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1600)
        })
      }}
      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] px-3 py-1.5 rounded border border-[#0a1628]/30 text-[#0a1628] hover:bg-[#0a1628]/5 transition-colors"
    >
      {done ? 'Copied' : label}
    </button>
  )
}

export default function LaunchKitClient() {
  const prohibitedHits = useMemo(() => getProhibitedHits(), [])
  const accessOk = ACCESS_AFFIRMATION.appears

  return (
    <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] pb-32">
      {/* Header */}
      <div className="bg-[#0a1628] text-white px-5 sm:px-8 py-10 sm:py-14">
        <div className="max-w-[1180px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55 mb-3">
            Internal · Launch Kit
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Ship the launch.
          </h1>
          <p className="text-white/65 text-sm sm:text-base max-w-2xl mt-3">
            Script, storyboard, recording checklist, social copy, and asset
            references. Everything you need to record and share, one page.
          </p>
          <p className="mt-5 inline-block text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55 px-3 py-1.5 border border-white/15 rounded-full">
            {TAGLINE}
          </p>

          {/* Quick nav */}
          <nav className="mt-7 flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[11.5px] font-medium px-3 py-1.5 rounded-full border border-white/20 text-white/75 hover:text-white hover:border-white/40 transition-colors"
              >
                {s.label}
              </a>
            ))}
            <Link
              href="/internal/launch-kit/teleprompter"
              className="text-[11.5px] font-semibold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full bg-[#f5f0e8] text-[#0a1628] hover:bg-white transition-colors"
            >
              Teleprompter &rarr;
            </Link>
            <Link
              href="/launch"
              className="text-[11.5px] font-medium px-3 py-1.5 rounded-full border border-white/20 text-white/75 hover:text-white hover:border-white/40 transition-colors"
            >
              View /launch
            </Link>
          </nav>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-10">
        {/* Self-check banner */}
        <div
          className={`mb-10 rounded-xl border px-5 py-4 ${
            prohibitedHits.length === 0 && accessOk
              ? 'bg-[#2d6a4f]/8 border-[#2d6a4f]/30'
              : 'bg-[#990000]/8 border-[#990000]/30'
          }`}
        >
          <p
            className={`text-[10.5px] font-semibold uppercase tracking-[0.22em] mb-2 ${
              prohibitedHits.length === 0 && accessOk ? 'text-[#2d6a4f]' : 'text-[#990000]'
            }`}
          >
            Copy self-check
          </p>
          {prohibitedHits.length === 0 ? (
            <p className="text-[13px] text-[#0a1628]">
              No corporate vocabulary detected
              {' ('}
              {PROHIBITED_WORDS.join(', ')}
              {'). '}
              {accessOk ? (
                <span>
                  &ldquo;Approval-based, not paywalled&rdquo; framing is present.
                </span>
              ) : (
                <span className="text-[#990000] font-semibold">
                  Missing the &ldquo;approval-based, not paywalled&rdquo; line — fix in content.ts.
                </span>
              )}
            </p>
          ) : (
            <ul className="text-[13px] text-[#0a1628] space-y-1.5">
              {prohibitedHits.map((hit, i) => (
                <li key={i}>
                  <span className="font-semibold">{hit.word}</span> in <code>{hit.where}</code>: &ldquo;{hit.excerpt}&rdquo;
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Plan */}
        <section id="plan" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                Target length
              </p>
              <p className="text-[#0a1628] text-base font-medium">90 seconds (main launch).</p>
              <p className="text-[12.5px] text-[#8a7f70] mt-1">60s short cut + 2min founder walkthrough also ready.</p>
            </div>
            <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                Goal
              </p>
              <p className="text-[#0a1628] text-base font-medium">
                Claim. Explore. Feel proud.
              </p>
              <p className="text-[12.5px] text-[#8a7f70] mt-1">Alumni claim their card, look around, and feel the Penn Golf family come alive.</p>
            </div>
            <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                Distribution
              </p>
              <p className="text-[#0a1628] text-base font-medium">Email + group text + LinkedIn + Instagram.</p>
              <p className="text-[12.5px] text-[#8a7f70] mt-1">Email carries the long version. Social carries the 60s + caption.</p>
            </div>
          </div>
        </section>

        {/* Scripts */}
        <section id="scripts" className="mb-16 scroll-mt-24">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
            <h2
              className="text-[#0a1628] text-2xl sm:text-3xl font-medium"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Scripts
            </h2>
            <Link
              href="/internal/launch-kit/teleprompter"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1.5 rounded border border-[#0a1628]/30 text-[#0a1628] hover:bg-[#0a1628]/5 transition-colors"
            >
              Open teleprompter &rarr;
            </Link>
          </div>
          <div className="space-y-5">
            {SCRIPTS.map(s => (
              <article
                key={s.id}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-1">
                      Target {s.targetSeconds}s · {s.wordCount} words
                    </p>
                    <h3
                      className="text-[#0a1628] text-xl font-medium"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {s.label}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton value={s.text} label="Copy script" />
                    <Link
                      href={`/internal/launch-kit/teleprompter?length=${s.id}`}
                      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] px-3 py-1.5 rounded border border-[#0a1628]/30 text-[#0a1628] hover:bg-[#0a1628]/5 transition-colors"
                    >
                      Teleprompt
                    </Link>
                  </div>
                </div>
                <div className="text-[14.5px] text-[#0a1628] leading-relaxed whitespace-pre-line">
                  {s.text}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Storyboard */}
        <section id="storyboard" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Storyboard
          </h2>
          <p className="text-[13px] text-[#8a7f70] mb-5">
            Mapped to the 90-second main cut. Each beat lists the voiceover line, what to show on screen, the route to record, and a production note.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden text-[13px]">
              <thead>
                <tr className="bg-[#0a1628] text-white text-left">
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px] whitespace-nowrap">Time</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Voiceover</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Visual</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px] whitespace-nowrap">Route</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {STORYBOARD.map((b, i) => (
                  <tr key={i} className="border-t border-[rgba(180,168,150,0.35)] align-top">
                    <td className="px-4 py-4 font-semibold text-[#990000] whitespace-nowrap">{b.timestamp}</td>
                    <td className="px-4 py-4 text-[#0a1628] italic max-w-md">{b.voiceover}</td>
                    <td className="px-4 py-4 text-[#0a1628]">{b.visual}</td>
                    <td className="px-4 py-4 font-mono text-[12px] text-[#0a1628] whitespace-nowrap">{b.route}</td>
                    <td className="px-4 py-4 text-[#8a7f70]">{b.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Shoot Day playbook */}
        <section id="shoot" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Shoot Day
          </h2>
          <p className="text-[13px] text-[#8a7f70] mb-7">
            Open this on your phone during the shoot. Day-before prep, day-of running order, per-route directing notes, talking-head playbook, tool comparison, edit workflow, and the six gotchas to avoid.
          </p>

          {/* Day-before checklist */}
          <div className="mb-8">
            <h3
              className="text-[#0a1628] text-lg font-medium mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              The night before
            </h3>
            <ol className="space-y-2">
              {DAY_BEFORE_CHECKLIST.map((c, i) => (
                <li
                  key={i}
                  className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4 flex items-start gap-4"
                >
                  <div className="flex-none w-7 h-7 rounded-full border-2 border-[#0a1628]/30 text-[#0a1628] text-[12px] font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#0a1628] font-medium text-[14px]">{c.label}</p>
                    <p className="text-[12.5px] text-[#8a7f70] leading-relaxed mt-1">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Day-of phases */}
          <div className="mb-8">
            <h3
              className="text-[#0a1628] text-lg font-medium mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Day-of running order
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {SHOOT_DAY_PHASES.map(phase => (
                <article
                  key={phase.number}
                  className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-5"
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                    Phase {phase.number} · {phase.duration}
                  </p>
                  <h4
                    className="text-[#0a1628] text-lg font-medium mb-1"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {phase.label}
                  </h4>
                  <p className="text-[12.5px] text-[#8a7f70] italic mb-3">{phase.goal}</p>
                  <ul className="space-y-1.5 text-[12.5px] text-[#0a1628]">
                    {phase.steps.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#990000] flex-none">·</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          {/* Per-route screen capture playbook */}
          <div className="mb-8">
            <h3
              className="text-[#0a1628] text-lg font-medium mb-1"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Screen capture playbook
            </h3>
            <p className="text-[12.5px] text-[#8a7f70] mb-4">
              Per-route directing notes. Pre-state, cursor move, dwell, what to hide, whether to add cursor highlight in post.
            </p>
            <div className="space-y-2">
              {SCREEN_CAPTURE_PLAYBOOK.map((cap, i) => (
                <details
                  key={i}
                  className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-3 group"
                >
                  <summary className="cursor-pointer flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <code className="text-[11.5px] font-semibold text-[#990000]">{cap.route}</code>
                      <span className="text-[#0a1628] font-medium" style={{ fontFamily: 'var(--font-playfair)' }}>
                        {cap.pageName}
                      </span>
                    </div>
                    <span className="text-[10.5px] uppercase tracking-[0.16em] text-[#8a7f70]">
                      {cap.dwellSeconds}
                    </span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-[rgba(180,168,150,0.35)] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[12.5px] text-[#0a1628]">
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-1">Pre-state</p>
                      <p>{cap.preState}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-1">Move</p>
                      <p>{cap.move}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-1">What to hide</p>
                      <p>{cap.hide}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-1">Cursor highlight</p>
                      <p>{cap.cursorHighlight.startsWith('yes') ? `Yes — ${cap.cursorHighlight.replace(/^yes\s*\(?/, '').replace(/\)$/, '')}` : 'No — keep cursor still or off-frame'}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Talking head playbook */}
          <div className="mb-8">
            <h3
              className="text-[#0a1628] text-lg font-medium mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Talking head playbook
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TALKING_HEAD_PLAYBOOK.map((rule, i) => (
                <div key={i} className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                    {rule.label}
                  </p>
                  <p className="text-[12.5px] text-[#0a1628] leading-relaxed">{rule.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tool comparison */}
          <div className="mb-8">
            <h3
              className="text-[#0a1628] text-lg font-medium mb-1"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Screen capture tool — pick one
            </h3>
            <p className="text-[12.5px] text-[#8a7f70] mb-4">
              Four common options. The recommended pick is in the first row.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden text-[13px]">
                <thead>
                  <tr className="bg-[#0a1628] text-white text-left">
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Tool</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Cost</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Best for</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Watch out</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px]">Pick if</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOL_COMPARISON.map((t, i) => (
                    <tr key={i} className="border-t border-[rgba(180,168,150,0.35)] align-top">
                      <td className="px-4 py-3 font-semibold text-[#0a1628] whitespace-nowrap">{t.tool}</td>
                      <td className="px-4 py-3 text-[#8a7f70] whitespace-nowrap">{t.cost}</td>
                      <td className="px-4 py-3 text-[#0a1628]">{t.bestFor}</td>
                      <td className="px-4 py-3 text-[#8a7f70]">{t.watchOut}</td>
                      <td className="px-4 py-3 text-[#0a1628]">{t.pickIf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Post-production */}
          <div className="mb-8">
            <h3
              className="text-[#0a1628] text-lg font-medium mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Post-production in CapCut
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {POST_PRODUCTION_LAYOUT.map((step, i) => (
                <div key={i} className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                    {step.label}
                  </p>
                  <p className="text-[12.5px] text-[#0a1628] leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
                Three review passes
              </p>
              <ul className="space-y-2 text-[12.5px] text-[#0a1628]">
                {POST_PRODUCTION_REVIEW_PASSES.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[#990000] font-semibold flex-none">{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Common mistakes */}
          <div>
            <h3
              className="text-[#0a1628] text-lg font-medium mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Don&rsquo;t do this
            </h3>
            <div className="bg-[#990000]/8 border border-[#990000]/25 rounded-2xl p-5">
              <ul className="space-y-2 text-[13px] text-[#0a1628]">
                {COMMON_MISTAKES.map((m, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[#990000] flex-none">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Recording checklist */}
        <section id="recording" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Recording checklist
          </h2>
          <p className="text-[13px] text-[#8a7f70] mb-5">
            Go in this order. Each line is one screen-capture take. Don&rsquo;t worry about perfect runs &mdash; you&rsquo;ll cherry-pick the best segments in the edit.
          </p>
          <ol className="space-y-2">
            {RECORDING_CHECKLIST.map((c, i) => (
              <li
                key={i}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4 flex items-start gap-4"
              >
                <div className="flex-none w-7 h-7 rounded-full bg-[#0a1628] text-white text-[12px] font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="text-[#0a1628] font-medium" style={{ fontFamily: 'var(--font-playfair)' }}>
                      {c.pageName}
                    </p>
                    <code className="text-[11.5px] text-[#990000]">{c.route}</code>
                  </div>
                  <p className="text-[13px] text-[#0a1628] mt-1">{c.action}</p>
                  <p className="text-[11.5px] text-[#8a7f70] italic mt-1">{c.why}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-7 bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6">
            <h3
              className="text-[#0a1628] text-xl font-medium mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Production flow
            </h3>
            <ul className="space-y-2 text-[13px] text-[#0a1628]">
              {RECORDING_FLOW.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#990000] font-semibold flex-none">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Marketing copy blocks */}
        <section id="copy" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Marketing copy
          </h2>
          <p className="text-[13px] text-[#8a7f70] mb-5">
            Ready to paste. Each block is sized for its channel. Personalize the bracketed pieces before sending.
          </p>
          <div className="space-y-5">
            {COPY_BLOCKS.map(block => (
              <article key={block.id} className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-1">
                      {block.surface}
                    </p>
                    <h3
                      className="text-[#0a1628] text-xl font-medium"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {block.label}
                    </h3>
                  </div>
                  <CopyButton value={block.body} />
                </div>
                <pre className="text-[13px] text-[#0a1628] leading-relaxed whitespace-pre-wrap font-sans">
                  {block.body}
                </pre>
              </article>
            ))}
          </div>
        </section>

        {/* AI B-roll */}
        <section id="broll" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            AI B-roll prompts
          </h2>
          <p className="text-[13px] text-[#8a7f70] mb-5">
            Drop these into Higgsfield, Runway, or CapCut to generate short atmosphere clips. Real screen recordings and Ryan&rsquo;s piece-to-camera carry the video; AI is texture only.
          </p>

          <div className="bg-[#990000]/8 border border-[#990000]/25 rounded-2xl p-5 mb-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
              Hard rules
            </p>
            <ul className="space-y-1.5 text-[13px] text-[#0a1628]">
              {AI_VIDEO_WARNINGS.map((w, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#990000] flex-none">·</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {AI_VIDEO_PROMPTS.map((p, i) => (
              <div
                key={i}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5 flex items-start gap-4"
              >
                <div className="flex-none w-7 h-7 rounded-full bg-[#0a1628] text-white text-[12px] font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[13px] text-[#0a1628] leading-relaxed italic flex-1">
                  &ldquo;{p}&rdquo;
                </p>
                <CopyButton value={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Assets + sizes */}
        <section id="assets" className="mb-16 scroll-mt-24">
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Assets &amp; sizes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
            {RECORDING_SIZES.map(s => (
              <div key={s.ratio} className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
                  {s.ratio}
                </p>
                <p className="text-[#0a1628] font-medium">{s.pixels}</p>
                <p className="text-[12.5px] text-[#8a7f70] mt-1">{s.where}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#0a1628]/[0.03] border-b border-[rgba(180,168,150,0.35)] text-left">
                  <th className="px-5 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px] text-[#8a7f70]">
                    Asset
                  </th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px] text-[#8a7f70]">
                    Value
                  </th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-[0.14em] text-[10.5px] text-[#8a7f70]">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {ASSET_REFS.map((a, i) => (
                  <tr key={i} className="border-t border-[rgba(180,168,150,0.25)] align-top">
                    <td className="px-5 py-3 text-[#0a1628] font-medium whitespace-nowrap">{a.label}</td>
                    <td className="px-5 py-3 font-mono text-[#0a1628]">{a.value}</td>
                    <td className="px-5 py-3 text-[#8a7f70]">{a.note ?? ''}</td>
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
