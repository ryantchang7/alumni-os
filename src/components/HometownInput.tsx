'use client'

import { useEffect, useRef, useState } from 'react'
import { searchCities, type UsCity } from '@/lib/cities/us-cities'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

/**
 * Single-field hometown autocomplete. Suggestions match the curated
 * US-cities list; selecting "Boston · MA" sets the value to "Boston, MA".
 * Free text still accepted for off-list places (small towns, abroad).
 */
export default function HometownInput({
  value,
  onChange,
  placeholder = 'e.g. Boston, MA',
  required = false,
  className = '',
}: Props) {
  const [suggestions, setSuggestions] = useState<UsCity[]>([])
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Use the part of the string before the first comma as the lookup
  // ("Brookline, MA" → "Brookline"). That way once the user has selected
  // a city we don't keep suggesting variants of "Brookline, MA".
  useEffect(() => {
    const cityPart = value.split(',')[0]?.trim() ?? ''
    setSuggestions(searchCities(cityPart, 8))
    setHighlightIdx(0)
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function select(s: UsCity) {
    onChange(`${s.city}, ${s.state}`)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(suggestions[highlightIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[rgba(180,168,150,0.55)] rounded-lg shadow-lg max-h-72 overflow-auto"
        >
          {suggestions.map((s, idx) => {
            const highlighted = idx === highlightIdx
            return (
              <li key={`${s.city}-${s.state}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    select(s)
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    highlighted ? 'bg-[#faf7f2] text-[#0a1628]' : 'text-[#0a1628] hover:bg-[#faf7f2]'
                  }`}
                >
                  <span className="font-medium">{s.city}</span>
                  <span className="text-ink-muted ml-2 text-xs">{s.state}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
