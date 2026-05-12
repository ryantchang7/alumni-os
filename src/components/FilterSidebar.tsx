'use client'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'

interface FilterSidebarProps {
  onFiltersChange?: (filters: unknown) => void
}

const relationshipModes = [
  { value: 'play_golf', label: 'Play Golf' },
  { value: 'career_chat', label: 'Career Chat' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'finance_advice', label: 'Finance Advice' },
  { value: 'founder_advice', label: 'Founder Advice' },
  { value: 'grad_school_advice', label: 'Grad School' },
  { value: 'city_advice', label: 'City Advice' },
  { value: 'warm_intro', label: 'Warm Intro' },
  { value: 'team_events', label: 'Team Events' },
]

const industries = [
  'Private Equity',
  'Investment Banking',
  'Venture Capital',
  'Consulting',
  'Law',
  'Medicine',
  'Technology',
  'Real Estate',
]

const sortOptions = [
  { value: 'best_tie', label: 'Best Tie' },
  { value: 'verified_first', label: 'Verified First' },
  { value: 'open_golf', label: 'Open to Golf' },
  { value: 'newest_class', label: 'Newest Class' },
  { value: 'oldest_class', label: 'Oldest Class' },
  { value: 'city', label: 'City' },
  { value: 'industry', label: 'Industry' },
]

export default function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  const [selectedModes, setSelectedModes] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [classYearMin, setClassYearMin] = useState('')
  const [classYearMax, setClassYearMax] = useState('')
  const [openToGolf, setOpenToGolf] = useState(false)
  const [openToCareer, setOpenToCareer] = useState(false)
  const [openToMentorship, setOpenToMentorship] = useState(false)
  const [minConfidence, setMinConfidence] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('')
  const [sortBy, setSortBy] = useState('best_tie')

  const toggleMode = (mode: string) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
  }

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    )
  }

  const handleReset = () => {
    setSelectedModes([])
    setSelectedIndustries([])
    setCity('')
    setClassYearMin('')
    setClassYearMax('')
    setOpenToGolf(false)
    setOpenToCareer(false)
    setOpenToMentorship(false)
    setMinConfidence('')
    setVerificationStatus('')
    setSortBy('best_tie')
    onFiltersChange?.({})
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm space-y-5">
      {/* Sort */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Sort By</h3>
        <div className="space-y-1">
          {sortOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sortBy === opt.value}
                onChange={() => setSortBy(opt.value)}
                className="accent-[#990000]"
              />
              <span className="text-xs text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Relationship Mode */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Relationship Mode</h3>
        <div className="space-y-1.5">
          {relationshipModes.map(mode => (
            <label key={mode.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedModes.includes(mode.value)}
                onChange={() => toggleMode(mode.value)}
                className="accent-[#990000]"
              />
              <span className="text-xs text-gray-700">{mode.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Industry */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Industry</h3>
        <div className="space-y-1.5">
          {industries.map(ind => (
            <label key={ind} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIndustries.includes(ind)}
                onChange={() => toggleIndustry(ind)}
                className="accent-[#990000]"
              />
              <span className="text-xs text-gray-700">{ind}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* City */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">City / State</h3>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. New York, NY"
          className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
        />
      </div>

      <Separator />

      {/* Class Year */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Class Year Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={classYearMin}
            onChange={e => setClassYearMin(e.target.value)}
            placeholder="2010"
            className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
          />
          <span className="text-gray-400 text-xs flex-shrink-0">to</span>
          <input
            type="number"
            value={classYearMax}
            onChange={e => setClassYearMax(e.target.value)}
            placeholder="2024"
            className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
          />
        </div>
      </div>

      <Separator />

      {/* Toggles */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Open To</h3>
        <div className="space-y-2">
          {[
            { label: 'Golf Rounds', value: openToGolf, set: setOpenToGolf },
            { label: 'Career Chats', value: openToCareer, set: setOpenToCareer },
            { label: 'Mentorship', value: openToMentorship, set: setOpenToMentorship },
          ].map(toggle => (
            <label key={toggle.label} className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-700">{toggle.label}</span>
              <button
                type="button"
                onClick={() => toggle.set(!toggle.value)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  toggle.value ? 'bg-[#0a1628]' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block w-3 h-3 mt-1 rounded-full bg-white shadow transition-transform ${
                  toggle.value ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Confidence + Verification */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Min Confidence</label>
          <select
            value={minConfidence}
            onChange={e => setMinConfidence(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
          >
            <option value="">Any</option>
            <option value="high">High only</option>
            <option value="medium">Medium+</option>
            <option value="low">Low+</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Verification Status</label>
          <select
            value={verificationStatus}
            onChange={e => setVerificationStatus(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0a1628] bg-white"
          >
            <option value="">Any</option>
            <option value="verified">Verified</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onFiltersChange?.({ selectedModes, selectedIndustries, city, classYearMin, classYearMax, openToGolf, openToCareer, openToMentorship, minConfidence, verificationStatus, sortBy })}
          className="w-full text-xs text-white bg-[#990000] hover:bg-[#cc0000] px-4 py-2.5 rounded font-medium transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}
