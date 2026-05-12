'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function BuilderNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    teamName: "Penn Men's Golf",
    schoolName: 'University of Pennsylvania',
    sport: "Men's Golf",
    gender: 'Men',
    website: 'https://pennathletics.com/sports/mens-golf',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: form.schoolName,
          teamName: form.teamName,
          sport: form.sport,
          gender: form.gender,
          websiteUrl: form.website,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        router.push('/builder/workspace?teamSlug=' + data.slug)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col">
      {/* Navy top strip */}
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-xl mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
            ← Builder
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mb-2">New Team Graph</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Enter your team info and we&apos;ll discover your alumni network using public roster data.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="teamName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={form.teamName}
                onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                placeholder="e.g. Penn Men's Golf"
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schoolName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                School Name
              </Label>
              <Input
                id="schoolName"
                value={form.schoolName}
                onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
                placeholder="e.g. University of Pennsylvania"
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sport" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Sport
                </Label>
                <Input
                  id="sport"
                  value={form.sport}
                  onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                  placeholder="e.g. Men's Golf"
                  required
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Gender
                </Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v ?? 'Men' }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Official Team Website
              </Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://athletics.university.edu/sports/golf"
                required
                className="text-sm font-mono"
              />
              <p className="text-xs text-gray-400">Use the official athletics department URL. Must be publicly accessible.</p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#990000] hover:bg-[#b30000] text-white font-semibold py-3 h-auto text-sm transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating team…
                  </span>
                ) : (
                  'Create Team →'
                )}
              </Button>
            </div>

            <p className="text-xs text-[#8a7f70] text-center leading-relaxed pt-1">
              Team data is saved locally for development. No external accounts are created.
            </p>
          </form>

          {/* Trust note */}
          <div className="mt-6 pt-5 border-t border-[rgba(180,168,150,0.35)]">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Alumni OS uses public data only — team rosters, public profiles, and permissioned sources.
              No login-gated scraping. No private data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
