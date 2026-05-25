'use client'

import { useState } from 'react'
import type { OutreachDraft } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface OutreachDraftCardProps {
  draft: OutreachDraft
}

export default function OutreachDraftCard({ draft }: OutreachDraftCardProps) {
  const [copied, setCopied] = useState(false)
  const [activeVariant, setActiveVariant] = useState(0)

  const allVariants = [
    { label: 'Primary', body: draft.body, wordCount: draft.wordCount },
    ...draft.variants,
  ]

  const current = allVariants[activeVariant]

  const handleCopy = async () => {
    const textToCopy = draft.subject
      ? `Subject: ${draft.subject}\n\n${current.body}`
      : current.body
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
      {/* Draft header */}
      <div className="bg-[#0a1628] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-medium capitalize">{draft.purpose.replace(/_/g, ' ')}</span>
          <span className="text-gray-500 text-xs">·</span>
          <span className="text-gray-300 text-xs capitalize">{draft.channel.replace(/_/g, ' ')}</span>
          <span className="text-gray-500 text-xs">·</span>
          <span className="text-gray-300 text-xs capitalize">{draft.tone}</span>
        </div>
        <span className="text-gray-400 text-xs">{current.wordCount} words</span>
      </div>

      <div className="p-5">
        {/* Variant tabs */}
        <Tabs
          value={String(activeVariant)}
          onValueChange={(v) => setActiveVariant(Number(v))}
          className="mb-4"
        >
          <TabsList className="bg-gray-100 h-8">
            {allVariants.map((v, i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs px-3 h-7">
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {allVariants.map((v, i) => (
            <TabsContent key={i} value={String(i)} className="mt-0" />
          ))}
        </Tabs>

        {/* Subject line */}
        {draft.subject && (
          <div className="mb-3 pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Subject</span>
            <p className="text-sm text-gray-800 font-medium mt-1">{draft.subject}</p>
          </div>
        )}

        {/* Body */}
        <Textarea
          value={current.body}
          readOnly
          className="text-sm text-gray-700 leading-relaxed min-h-[140px] resize-none border-gray-100 bg-gray-50 font-sans"
        />

        {/* Word count */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">{current.wordCount} words</span>
          <Button
            onClick={handleCopy}
            size="sm"
            className={`text-xs h-8 ${copied ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-[#990000] hover:bg-[#cc0000]'} text-white transition-colors`}
          >
            {copied ? '✓ Copied' : 'Copy to Clipboard'}
          </Button>
        </div>
      </div>
    </div>
  )
}
