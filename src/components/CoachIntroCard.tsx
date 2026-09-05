'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

/**
 * A standing introduction for a new member of the coaching staff, shown in
 * the "From the box" block next to the Penn Athletics feed.
 *
 * It sits outside the news strip on purpose: an arrival is not a headline
 * and would fall off the feed within a week, but it is the thing an alum
 * who has been away for ten years most wants told to them.
 *
 * Facts here are limited to what her Penn Athletics staff page states.
 */

const COACH = {
  name: 'Ivana Shah',
  role: 'Volunteer Assistant Coach',
  blurb:
    'Joined the program in August 2026. Four years on Akron’s golf team, a ' +
    'four-time WCGA All-American Scholar, and one of 30 national honorees for ' +
    'the NCAA Woman of the Year award out of 225,000 student-athletes. She has ' +
    'a biomedical engineering degree, works at Johnson & Johnson MedTech, and ' +
    'co-founded Call To Action, a volunteer group in the Akron area.',
  profileUrl: 'https://pennathletics.com/staff-directory/ivana-shah/2996',
  // Sidearm's CDN blocks hot-linking from some origins, so this goes through
  // the same wsrv proxy the news thumbnails use.
  photoUrl:
    'https://dxbhsrqyrr690.cloudfront.net/sidearm.nextgen.sites/penn.sidearmsports.com/images/2026/8/25/SHAH.jpg',
}

function CoachPhoto() {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span className="flex-shrink-0 w-16 h-16 rounded-full bg-[#0a1628] flex items-center justify-center">
        <span className="text-[#c8a84b] text-base font-semibold">IS</span>
      </span>
    )
  }
  const stripped = COACH.photoUrl.replace(/^https?:\/\//, '')
  const proxied = `https://wsrv.nl/?url=${encodeURIComponent(stripped)}&w=160&h=160&fit=cover&a=top&output=jpg&q=85`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxied}
      alt={COACH.name}
      width={64}
      height={64}
      loading="lazy"
      onError={() => setErrored(true)}
      className="flex-shrink-0 w-16 h-16 rounded-full object-cover border border-[rgba(180,168,150,0.5)] bg-[#0a1628]"
    />
  )
}

export default function CoachIntroCard() {
  return (
    <a
      href={COACH.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-4 hover:border-[#0a1628]/40 hover:shadow-md transition-all h-full"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
        New on staff
      </p>
      <div className="flex items-center gap-3.5">
        <CoachPhoto />
        <div className="min-w-0">
          <p className="text-[#0a1628] text-[15px] font-semibold font-heading leading-tight group-hover:text-[#990000] transition-colors">
            {COACH.name}
          </p>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted mt-0.5">
            {COACH.role}
          </p>
        </div>
      </div>
      <p className="text-[12.5px] text-[#3d4a5c] leading-relaxed mt-3">{COACH.blurb}</p>
      <span className="text-[11px] font-semibold text-[#0a1628] mt-2.5 inline-flex items-center gap-1 group-hover:text-[#990000] transition-colors">
        Full bio on pennathletics.com
        <ArrowUpRight className="w-3 h-3" />
      </span>
    </a>
  )
}
