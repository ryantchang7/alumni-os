'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'
import type { PipelineStage } from '@/lib/types'

interface PipelineStageCardProps {
  stage: PipelineStage
  index: number
  isVisible: boolean
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 22,
  mass: 0.8,
}

function StageNumber({ order, status }: { order: number; status: PipelineStage['status'] }) {
  if (status === 'complete') {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        {order}
      </div>
    )
  }
  if (status === 'running') {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 bg-[#990000]/20 text-[#cc0000] border border-[#990000]/30 animate-pulse">
        {order}
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 bg-white/5 text-gray-500 border border-white/10">
      {order}
    </div>
  )
}

function StatusIcon({ status }: { status: PipelineStage['status'] }) {
  if (status === 'complete') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <CheckCircle2 className="text-emerald-400 w-4 h-4 flex-shrink-0" />
      </motion.div>
    )
  }
  if (status === 'running') {
    return <Loader2 className="text-[#cc0000] w-4 h-4 flex-shrink-0 animate-spin" />
  }
  return <Circle className="text-gray-600 w-4 h-4 flex-shrink-0" />
}

export default function PipelineStageCard({ stage, index, isVisible }: PipelineStageCardProps) {
  if (!isVisible) {
    return (
      <div className="bg-[#112240] border border-white/[0.08] rounded-lg p-4 opacity-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex-shrink-0" />
          <div className="flex-1 h-4 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springTransition, delay: index * 0.04 }}
      className="bg-[#112240] border border-white/[0.08] rounded-lg p-4"
    >
      <div className="flex items-center gap-3">
        <StageNumber order={stage.order} status={stage.status} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white tracking-tight leading-tight">{stage.label}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{stage.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {stage.metric && stage.status === 'complete' && (
            <div className="flex items-center gap-1.5">
              <span className="bg-white/10 rounded-full px-2.5 py-0.5 text-xs font-mono text-white">
                {stage.metric}
              </span>
              {stage.metricLabel && (
                <span className="text-[10px] text-gray-500 hidden sm:block max-w-[80px] truncate">
                  {stage.metricLabel}
                </span>
              )}
            </div>
          )}
          <AnimatePresence mode="wait">
            <StatusIcon status={stage.status} />
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
