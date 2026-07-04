'use client'

import { useEffect, useRef, useState } from 'react'
import { searchCities, type UsCity } from '@/lib/cities/us-cities'

interface Props {
  city: string
  state: string
  onChange: (next: { city: string; state: string }) => void
  cityPlaceholder?: string
  className?: string
}

/**
 * Combined city + state input with type-ahead suggestions backed by the
 * curated US cities list. Selecting a suggestion fills both fields at
 * once. Both are still independently editable (free text accepted) so
 * users can type anything not on the list.
 */
export default function CityStateInput({
  city,
  state,
  onChange,
  cityPlaceholder = 'City — e.g. New York',
  className = '',
}: Props) {
  const [suggestions, setSuggestions] = useState<UsCity[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSuggestions(searchCities(city, 8))
    setHighlightIdx(0)
  }, [city])

  // Close suggestions on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function selectSuggestion(s: UsCity) {
    onChange({ city: s.city, state: s.state })
    setShowSuggestions(false)
  }

  function onCityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectSuggestion(suggestions[highlightIdx])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative grid grid-cols-[1fr_88px] gap-2 ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={city}
          onChange={(e) => {
            onChange({ city: e.target.value, state })
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={onCityKeyDown}
          placeholder={cityPlaceholder}
          autoComplete="off"
          className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
        />
        {showSuggestions && suggestions.length > 0 && (
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
                      selectSuggestion(s)
                    }}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      highlighted
                        ? 'bg-[#faf7f2] text-[#0a1628]'
                        : 'text-[#0a1628] hover:bg-[#faf7f2]'
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
      <input
        type="text"
        value={state}
        onChange={(e) =>
          onChange({ city, state: e.target.value.toUpperCase().slice(0, 2) })
        }
        placeholder="ST"
        maxLength={2}
        className="border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm uppercase text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
      />
    </div>
  )
}
