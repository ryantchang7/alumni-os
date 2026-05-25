'use client'

import { motion } from 'framer-motion'
import { Globe, FileText, User, Link2, Zap, Eye } from 'lucide-react'
import type { AgentFinding } from '@/lib/types'

interface AgentFindingFeedProps {
  findings: AgentFinding[]
  maxVisible?: number
}

type FindingType = AgentFinding['type']

const typeIconMap: Record<FindingType, React.ComponentType<{ className?: string }>> = {
  page_found: Globe,
  entry_extracted: FileText,
  person_normalized: User,
  candidate_found: Link2,
  hook_generated: Zap,
  review_queued: Eye,
}

const typeIconColors: Record<FindingType, string> = {
  page_found: 'text-blue-400',
  entry_extracted: 'text-emerald-400',
  person_normalized: 'text-purple-400',
  candidate_found: 'text-amber-400',
  hook_generated: 'text-[#cc0000]',
  review_queued: 'text-gray-400',
}

const confidenceColors: Record<string, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-orange-400',
  unverified: 'text-gray-500',
}

export default function AgentFindingFeed({ findings, maxVisible }: AgentFindingFeedProps) {
  const displayed = maxVisible ? findings.slice(0, maxVisible) : findings

  return (
    <div className="bg-[#112240] border border-white/[0.08] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#990000] animate-pulse flex-shrink-0" />
        <span className="text-xs font-mono text-gray-400 tracking-wider uppercase">Agent Log</span>
      </div>

      {/* Feed */}
      <div
        className="h-[400px] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {displayed.map((finding, index) => {
          const Icon = typeIconMap[finding.type]
          const iconColor = typeIconColors[finding.type]

          return (
            <motion.div
              key={finding.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 22 }}
              className="px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`${iconColor} flex-shrink-0 mt-0.5 w-[14px] h-[14px]`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[10px] text-gray-600">{finding.timestamp}</span>
                    {finding.confidence && (
                      <span className={`${confidenceColors[finding.confidence]} text-[10px] font-mono`}>
                        · {finding.confidence}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-snug">{finding.summary}</p>
                  {finding.detail && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{finding.detail}</p>
                  )}
                  {finding.url && (
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">{finding.url}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}

        {displayed.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-600">Waiting for agent activity...</p>
          </div>
        )}
      </div>
    </div>
  )
}
