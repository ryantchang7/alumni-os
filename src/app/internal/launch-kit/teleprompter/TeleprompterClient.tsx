'use client'

/**
 * Minimal teleprompter. Big readable text, length switcher (60 / 90 /
 * 2min), font-size + dark-mode toggles, copy button, estimated read
 * time. No autoscroll for now — Ryan is reading off-camera and can
 * pace himself. Future iteration could add a paced scroller.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, Sun, Moon, Type, Copy, Check } from 'lucide-react'
import { SCRIPTS, getScript, type ScriptLength } from '@/lib/launch-kit/content'

const READING_WPM = 160

export default function TeleprompterClient() {
  const params = useSearchParams()
  const initial = (params?.get('length') ?? '90') as ScriptLength
  const [length, setLength] = useState<ScriptLength>(
    SCRIPTS.some(s => s.id === initial) ? initial : '90',
  )
  const [fontSize, setFontSize] = useState(36)
  const [dark, setDark] = useState(true)
  const [copied, setCopied] = useState(false)

  const script = useMemo(() => getScript(length), [length])
  const estimatedSeconds = Math.round((script.wordCount / READING_WPM) * 60)

  useEffect(() => {
    setCopied(false)
  }, [length])

  const bgClass = dark ? 'bg-[#0a1628]' : 'bg-[#f8f5f0]'
  const textClass = dark ? 'text-white' : 'text-[#0a1628]'
  const mutedClass = dark ? 'text-white/55' : 'text-[#8a7f70]'
  const borderClass = dark ? 'border-white/20' : 'border-[#0a1628]/20'
  const chipActive = dark
    ? 'bg-white text-[#0a1628]'
    : 'bg-[#0a1628] text-white'
  const chipInactive = dark
    ? 'border border-white/25 text-white/80 hover:border-white/50'
    : 'border border-[#0a1628]/25 text-[#0a1628] hover:border-[#0a1628]/50'

  return (
    <div className={`min-h-[calc(100dvh-60px)] ${bgClass} ${textClass}`}>
      {/* Control bar */}
      <div className={`sticky top-0 z-10 ${bgClass} border-b ${borderClass} px-5 sm:px-8 py-4`}>
        <div className="max-w-[1080px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/internal/launch-kit"
              className={`inline-flex items-center gap-1 text-[12px] font-medium ${mutedClass} hover:opacity-80`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Launch Kit
            </Link>
            <span className={mutedClass}>·</span>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em]">
              Teleprompter
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Length chips */}
            <div className="flex gap-1.5">
              {SCRIPTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setLength(s.id)}
                  className={`text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full transition-colors ${
                    length === s.id ? chipActive : chipInactive
                  }`}
                >
                  {s.targetSeconds === 120 ? '2 min' : `${s.targetSeconds} sec`}
                </button>
              ))}
            </div>

            <span className={`hidden sm:inline ${mutedClass}`}>·</span>

            {/* Font size */}
            <div className="flex items-center gap-1">
              <Type className={`w-3.5 h-3.5 ${mutedClass}`} />
              <button
                type="button"
                onClick={() => setFontSize(v => Math.max(20, v - 4))}
                className={`text-[12px] font-semibold w-7 h-7 rounded ${chipInactive}`}
                aria-label="Smaller"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setFontSize(v => Math.min(64, v + 4))}
                className={`text-[12px] font-semibold w-7 h-7 rounded ${chipInactive}`}
                aria-label="Larger"
              >
                +
              </button>
            </div>

            {/* Dark toggle */}
            <button
              type="button"
              onClick={() => setDark(v => !v)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${chipInactive}`}
              aria-label={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Copy */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(script.text).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1600)
                })
              }}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1.5 rounded ${chipInactive}`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="max-w-[1080px] mx-auto mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className={`text-[11px] font-medium ${mutedClass}`}>
            {script.label}
          </p>
          <p className={`text-[11px] font-mono ${mutedClass}`}>
            {script.wordCount} words · ~{estimatedSeconds}s at {READING_WPM} wpm
          </p>
        </div>
      </div>

      {/* Script */}
      <div className="px-5 sm:px-10 py-12 sm:py-16">
        <div className="max-w-[920px] mx-auto">
          <article
            className="whitespace-pre-line leading-[1.45]"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: 'var(--font-source-serif, var(--font-playfair))',
            }}
          >
            {script.text}
          </article>
        </div>
      </div>
    </div>
  )
}
