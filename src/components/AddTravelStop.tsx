'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteTravelStop({ stopId }: { stopId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    try {
      await fetch(`/api/team-travel?id=${stopId}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={[
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40',
        confirming
          ? 'bg-[#990000] text-white border-[#990000] hover:bg-[#7a0000]'
          : 'text-[#8a7f70] border-[rgba(180,168,150,0.55)] hover:text-[#990000] hover:border-[#990000]/40 bg-transparent',
      ].join(' ')}
    >
      <Trash2 size={12} />
      {confirming ? 'Confirm delete' : 'Delete stop'}
    </button>
  )
}

export default function AddTravelStop() {
  const [open, setOpen] = useState(false)
  const [eventName, setEventName] = useState('')
  const [locationText, setLocationText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  function reset() {
    setEventName('')
    setLocationText('')
    setStartDate('')
    setEndDate('')
    setNote('')
    setStatus('idle')
    setErrorMsg('')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/team-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          locationText: locationText.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })
      if (res.ok) {
        reset()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not reach the server.')
      setStatus('error')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.6)] bg-white hover:bg-[#f8f5f0] px-4 py-2.5 rounded-lg transition-colors"
      >
        <span aria-hidden="true">+</span> Add a travel stop
      </button>
    )
  }

  return (
    <div
      className="bg-white border border-[#c8a84b]/40 rounded-xl p-5"
      style={{ boxShadow: '0 2px 8px rgba(200,168,75,0.12), 0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8a84b] mb-3">
        New travel stop
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5">
              Event name
            </label>
            <input
              type="text"
              required
              value={eventName}
              onChange={e => setEventName(e.target.value.slice(0, 120))}
              placeholder="e.g. Ivy Championship"
              className="w-full rounded-lg border border-[#d9c8a8] bg-[#faf7f2] px-3 py-2 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5">
              Location
            </label>
            <input
              type="text"
              required
              value={locationText}
              onChange={e => setLocationText(e.target.value.slice(0, 200))}
              placeholder="e.g. Princeton, NJ"
              className="w-full rounded-lg border border-[#d9c8a8] bg-[#faf7f2] px-3 py-2 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5">
              Start date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#d9c8a8] bg-[#faf7f2] px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5">
              End date <span className="normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[#d9c8a8] bg-[#faf7f2] px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5">
            Note <span className="normal-case font-normal tracking-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 400))}
            rows={2}
            placeholder="Any context for alumni near this stop..."
            className="w-full rounded-lg border border-[#d9c8a8] bg-[#faf7f2] px-3 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
          />
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-flex items-center px-5 py-2.5 bg-[#0a1628] text-white text-xs font-semibold rounded-lg hover:bg-[#0f1f3d] disabled:opacity-50 transition-colors"
          >
            {status === 'submitting' ? 'Adding...' : 'Add stop'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
