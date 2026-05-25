'use client'

import { useState } from 'react'
import type { RelationshipStatus } from '@/lib/types'

interface RelationshipTrackerProps {
  currentStatus?: RelationshipStatus
  alumniName: string
}

interface StatusStep {
  value: RelationshipStatus
  label: string
  shortLabel: string
}

const steps: StatusStep[] = [
  { value: 'saved', label: 'Saved', shortLabel: 'Saved' },
  { value: 'planning_to_contact', label: 'Planning to Contact', shortLabel: 'Planning' },
  { value: 'contacted', label: 'Contacted', shortLabel: 'Contacted' },
  { value: 'replied', label: 'Replied', shortLabel: 'Replied' },
  { value: 'call_scheduled', label: 'Call Scheduled', shortLabel: 'Call Sched.' },
  { value: 'met', label: 'Met', shortLabel: 'Met' },
  { value: 'played_golf', label: 'Played Golf', shortLabel: 'Played' },
  { value: 'follow_up_due', label: 'Follow Up Due', shortLabel: 'Follow Up' },
  { value: 'thanked', label: 'Thanked', shortLabel: 'Thanked' },
  { value: 'relationship_established', label: 'Relationship Established', shortLabel: 'Established' },
]

export default function RelationshipTracker({ currentStatus, alumniName }: RelationshipTrackerProps) {
  const [selected, setSelected] = useState<RelationshipStatus>(currentStatus ?? 'saved')

  const currentIndex = steps.findIndex(s => s.value === selected)
  const firstName = alumniName.split(' ')[0]

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#0a1628] mb-1">Relationship with {firstName}</h3>
      <p className="text-xs text-gray-400 mb-4">Track where this connection stands</p>

      {/* Current status display */}
      <div className="bg-[#0a1628] rounded-lg px-4 py-3 mb-4">
        <p className="text-gray-400 text-xs mb-0.5">Current Status</p>
        <p className="text-white font-semibold text-sm">{steps[currentIndex]?.label ?? 'Unknown'}</p>
      </div>

      {/* Step selector */}
      <div className="grid grid-cols-2 gap-1.5">
        {steps.map((step, i) => {
          const isSelected = step.value === selected
          const isPast = i < currentIndex
          return (
            <button
              key={step.value}
              onClick={() => setSelected(step.value)}
              className={`text-left px-3 py-2 rounded text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-[#0a1628] text-white border-[#0a1628]'
                  : isPast
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isPast && !isSelected && (
                  <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSelected && (
                  <span className="w-3 h-3 rounded-full bg-[#990000] inline-block flex-shrink-0" />
                )}
                {step.shortLabel}
              </span>
            </button>
          )
        })}
      </div>

      <button className="w-full mt-3 text-xs text-white bg-[#990000] hover:bg-[#cc0000] px-4 py-2 rounded font-medium transition-colors">
        Update Status
      </button>
    </div>
  )
}
