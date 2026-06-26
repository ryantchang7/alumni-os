'use client'

/**
 * SuggestTrigger — a "Suggest an idea" button that opens a modal containing
 * the SuggestIdeaForm. Lives in the NavBar so it's reachable from every page.
 *
 * Identity prefill: we do a lightweight fetch of /api/me/access on open (only
 * once) and pass name + email into the form. Falls back to editable fields if
 * the user is signed out or the fetch fails.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import SuggestIdeaForm from '@/components/SuggestIdeaForm'

interface MeData {
  name?: string
  email?: string
  isSignedIn?: boolean
}

export default function SuggestTrigger() {
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<MeData | null>(null)
  const fetchedRef = useRef(false)

  // Fetch identity once when the modal first opens.
  useEffect(() => {
    if (!open || fetchedRef.current) return
    fetchedRef.current = true
    fetch('/api/me/access')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { name?: string; email?: string } | null) => {
        if (d) {
          setMe({ name: d.name ?? '', email: d.email ?? '', isSignedIn: true })
        } else {
          setMe({ isSignedIn: false })
        }
      })
      .catch(() => setMe({ isSignedIn: false }))
  }, [open])

  // Escape-to-close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  const modal =
    open && typeof window !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Suggest an idea"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#f8f5f0] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.22), 0 2px 8px rgba(10,22,40,0.12)' }}
            >
              {/* Header */}
              <div className="bg-[#0a1628] px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-1">
                    Penn Golf Clubhouse
                  </p>
                  <h2
                    className="text-white text-xl font-medium leading-snug"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Suggest an idea
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white/50 hover:text-white transition-colors mt-0.5 flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Gold accent line */}
              <div className="h-[2px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

              {/* Form body */}
              <div className="px-6 py-6">
                <SuggestIdeaForm
                  prefillName={me?.name}
                  prefillEmail={me?.email}
                  isSignedIn={me?.isSignedIn}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] font-medium text-gray-300 hover:text-white transition-colors px-2 py-1 rounded flex items-center gap-1.5"
        aria-label="Suggest an idea"
      >
        <span aria-hidden="true">💡</span>
        <span className="hidden lg:inline">Suggest</span>
      </button>
      {modal}
    </>
  )
}
