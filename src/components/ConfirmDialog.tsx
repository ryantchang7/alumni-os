'use client'

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  /** When true, the confirm button renders in Penn red (destructive action). */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * In-page confirm dialog — replaces window.confirm(), which is silently
 * blocked in iOS standalone PWA mode.
 *
 * Usage:
 *   const [dialogOpen, setDialogOpen] = useState(false)
 *   ...
 *   <ConfirmDialog
 *     open={dialogOpen}
 *     title="Take this down?"
 *     message="It will be removed for everyone."
 *     confirmLabel="Take down"
 *     destructive
 *     onConfirm={handleConfirm}
 *     onCancel={() => setDialogOpen(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Focus the confirm button when the dialog opens.
  useEffect(() => {
    if (open) {
      // Slight delay so the element is visible before receiving focus.
      const id = setTimeout(() => confirmRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
      aria-hidden="false"
    >
      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-sm rounded-2xl bg-[#fbf9f6] border border-[rgba(180,168,150,0.4)] px-6 py-6"
        style={{
          boxShadow: '0 4px 16px rgba(10,22,40,0.18), 0 24px 48px rgba(10,22,40,0.14)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Penn red top accent bar */}
        <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full bg-gradient-to-r from-[#990000] via-[#bb0000] to-[#990000]" />

        <h2
          id="confirm-dialog-title"
          className="mt-2 text-[17px] font-semibold text-[#0a1628] leading-snug font-heading"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mt-2 text-[13.5px] text-[#3a4657] leading-relaxed"
        >
          {message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-white hover:border-[#0a1628]/40 transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors ${
              destructive
                ? 'bg-[#990000] hover:bg-[#aa0000]'
                : 'bg-[#0a1628] hover:bg-[#112240]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
