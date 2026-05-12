import type { OutreachDraft } from '@/lib/types'

interface ScamCheckPanelProps {
  check: OutreachDraft['scamCheck']
}

interface CheckItem {
  key: keyof OutreachDraft['scamCheck']
  label: string
  description: string
}

const checks: CheckItem[] = [
  { key: 'humanTone', label: 'Human tone', description: 'Reads like a real person wrote it' },
  { key: 'specificReason', label: 'Specific reason', description: 'Includes a source-supported reason for reaching out' },
  { key: 'noReferralAsk', label: 'No referral ask', description: 'Does not ask for a referral in the first message' },
  { key: 'noAutomationMention', label: 'No automation mention', description: 'Does not mention AI, databases, or automation' },
  { key: 'noPressureClose', label: 'No-pressure close', description: 'Includes a low-pressure, no-obligation close' },
  { key: 'sourceSupported', label: 'Source-supported facts', description: 'Every claim is backed by public source data' },
]

export default function ScamCheckPanel({ check }: ScamCheckPanelProps) {
  const allPass = Object.values(check).every(Boolean)
  const failCount = Object.values(check).filter(v => !v).length

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
      {/* Status banner */}
      {allPass ? (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-emerald-700">Message looks good</span>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium text-amber-700">Review before sending — {failCount} check{failCount !== 1 ? 's' : ''} failed</span>
        </div>
      )}

      {/* Check list */}
      <div className="p-4 space-y-2">
        {checks.map((item) => {
          const passes = check[item.key]
          return (
            <div key={item.key} className="flex items-start gap-3">
              {passes ? (
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div>
                <span className={`text-xs font-medium ${passes ? 'text-gray-700' : 'text-red-700'}`}>{item.label}</span>
                <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
