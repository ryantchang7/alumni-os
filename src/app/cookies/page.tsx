import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy',
}

export default function CookiesPage() {
  return (
    <div className="bg-[#fbf9f6] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2 font-heading"
        >
          Cookie Policy
        </h1>
        <p className="text-[12.5px] text-ink-muted mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            This Cookie Policy explains how the Penn Golf Clubhouse uses cookies and similar technologies. We keep it simple: we use as few cookies as possible and never for advertising or cross-site tracking.
          </p>
          
          <h2 className="text-xl font-medium pt-2 font-heading">
            Cookies we use
          </h2>
          <p>
            The Clubhouse sets <strong>one category of cookies</strong>: essential session cookies set by our authentication provider, NextAuth / Auth.js, to keep you signed in. These cookies are strictly necessary to operate the service &mdash; without them, the Clubhouse cannot identify you as a signed-in member.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Session cookie (NextAuth / Auth.js).</strong> A JSON Web Token (JWT) session cookie with an approximate 30-day expiry. It contains an encrypted reference to your session and is used exclusively to authenticate your requests. It is a first-party cookie scoped to this domain.
            </li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            What we do NOT use
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>No advertising cookies or ad-network pixels.</li>
            <li>No cross-site tracking cookies.</li>
            <li>No third-party analytics pixels (e.g., Google Analytics, Meta Pixel, Mixpanel).</li>
            <li>No persistent preference cookies beyond what is strictly necessary to keep you signed in.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Cloudflare Turnstile
          </h2>
          <p>
            Public-facing forms on the Clubhouse (such as the profile claim form) are protected by a Cloudflare Turnstile bot challenge to prevent automated abuse. As part of that verification, Cloudflare may set its own cookie or use your IP address and browser signals. That processing is governed by{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#990000] hover:underline"
            >
              Cloudflare&rsquo;s Privacy Policy
            </a>
            . We do not control or receive the data Cloudflare collects for its bot-challenge; we only receive a pass/fail signal.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Managing cookies
          </h2>
          <p>
            You can clear or block cookies through your browser&rsquo;s settings. Most browsers allow you to view, delete, and block cookies on a per-site basis. Instructions vary by browser:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Chrome: Settings &rsaquo; Privacy and security &rsaquo; Cookies and other site data</li>
            <li>Safari: Settings &rsaquo; Privacy &rsaquo; Manage Website Data</li>
            <li>Firefox: Settings &rsaquo; Privacy &amp; Security &rsaquo; Cookies and Site Data</li>
          </ul>
          <p>
            Please note: if you block or delete the essential session cookie, you will be signed out and will not be able to sign back in until you allow the cookie again. Because it is strictly necessary, there is no opt-out mechanism that preserves full functionality.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Contact
          </h2>
          <p>
            Questions about this policy: email{' '}
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>
            . The Clubhouse is operated by Ryan Chang, Penn Men&rsquo;s Golf, Class of 2028.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-ink-muted">
          See also:{' '}
          <Link href="/privacy" className="text-[#0a1628] hover:text-[#990000] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </article>
    </div>
  )
}
