'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: number
  sublabel?: string
  icon?: React.ReactNode
  accentColor?: 'red' | 'green' | 'amber' | 'navy'
}

const leftBorderColors: Record<string, string> = {
  red: 'border-l-[#990000]',
  navy: 'border-l-[#0a1628]',
  green: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
}

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  accentColor = 'red',
}: StatCardProps) {
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = numRef.current
    if (!node) return
    const start = performance.now()
    const duration = 1800
    const raf = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      node.textContent = Math.round(value * eased).toLocaleString()
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5 border-l-[3px] ${leftBorderColors[accentColor]}`}
      style={{
        boxShadow:
          '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-muted font-medium mt-0 leading-none mb-3">
            {label}
          </p>
          <span
            ref={numRef}
            className="block text-4xl font-bold tracking-tight text-[#0a1628] leading-none"
          >
            0
          </span>
          {sublabel && (
            <p className="text-xs text-ink-muted mt-1.5">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-[#0a1628] opacity-25 mt-0.5">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
