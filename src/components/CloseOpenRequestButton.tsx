'use client'

/**
 * Owner-only "Close request" button rendered on the poster's own card in
 * the Open Requests strip. Soft-closes via /api/open-requests/[id]/close
 * (status → 'closed') and refreshes the server page so the card drops out.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  requestId: string
}

export default function CloseOpenRequestButton({ requestId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleClose() {
    setBusy(true)
    setFailed(false)
    try {
      const res = await fetch(
        `/api/open-requests/${encodeURIComponent(requestId)}/close`,
        { method: 'POST' },
      )
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      disabled={busy}
      className="w-full text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg border border-[#0a1628]/25 text-[#3d4a5c] hover:bg-[#0a1628] hover:text-white transition-colors disabled:opacity-60"
    >
      {busy ? 'Closing…' : failed ? 'Could not close — try again' : 'Close request'}
    </button>
  )
}
