'use client'

import { useEffect, useRef, useState } from 'react'
import { searchCourses, type GolfCourse } from '@/lib/courses/us-golf-courses'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Single-field golf course autocomplete. Suggestions come from the
 * curated US courses list. Selecting "Winged Foot Golf Club · NY"
 * sets the value to "Winged Foot Golf Club". Free text accepted for
 * off-list places (local munis, abroad).
 */
export default function CourseAutocomplete({
  value,
  onChange,
  placeholder = 'e.g. Winged Foot Golf Club',
  required = false,
  disabled = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<GolfCourse[]>([])
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSuggestions(searchCourses(value, 8))
    setHighlightIdx(0)
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function select(s: GolfCourse) {
    onChange(s.name)
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
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => !disabled && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        required={required && !disabled}
        disabled={disabled}
        className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 disabled:bg-[#faf7f2] disabled:text-[#8a7f70] disabled:cursor-not-allowed"
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[rgba(180,168,150,0.55)] rounded-lg shadow-lg max-h-72 overflow-auto"
        >
          {suggestions.map((s, idx) => {
            const highlighted = idx === highlightIdx
            return (
              <li key={`${s.name}-${s.state}`}>
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
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[#8a7f70] ml-2 text-xs">{s.state}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
