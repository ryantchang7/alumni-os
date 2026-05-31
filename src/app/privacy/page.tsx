import Link from 'next/link'

export const metadata = {
  title: 'Privacy',
}

export default function PrivacyPage() {
  return (
    <div className="bg-[#f8f5f0] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#8a7f70] mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Privacy
        </h1>
        <p className="text-[12.5px] text-[#8a7f70] mb-8">Last updated 2026-05-31</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            The Penn Golf Clubhouse is a private, approval-gated space for the Penn Men&rsquo;s Golf family. We treat your information the way a club would treat your locker. This page explains what we collect, where it lives, and what you can do about it.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            What we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Profile information you add to your member card &mdash; name, class year, city and state, hometown, home course, handicap, contact preferences, bio, and how you want to help.</li>
            <li>Photos and videos you upload to your profile or to Moments.</li>
            <li>Messages and requests you send or receive inside the Clubhouse.</li>
            <li>Sign-in information from Google OAuth (your name, email, profile photo).</li>
            <li>Subscription state if you choose to support the Clubhouse (handled by Stripe).</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Where it lives
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Member profiles, requests, gatherings, and Moments are stored in Upstash (Vercel KV).</li>
            <li>Photos and videos are stored in Vercel Blob.</li>
            <li>Sign-in is handled by Google through NextAuth.</li>
            <li>Email is delivered by Resend.</li>
            <li>Payments are handled by Stripe. We never see or store your card details.</li>
            <li>The site is hosted on Vercel.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Who can see what
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only approved members of the Clubhouse can see member profiles, the Member Map, gatherings, Open Requests, Moments, and chat threads. Approval is decided by the captain.</li>
            <li>The Member Book is the registry of every player I could compile from public roster and historical sources. Names, years, and hometowns may appear in the book before someone has claimed their card.</li>
            <li>You decide how you want other members to reach you (email, intro through the captain, LinkedIn, or not available right now).</li>
            <li>Captain and founder roles can see the admin queue (pending claims, roster edits). They cannot read your private chats.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            What you can do
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Edit anything on your member card any time from your profile.</li>
            <li>Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a> to request edits to the Member Book entry that pre-existed your claim, or to ask for removal.</li>
            <li>Sign out any time. Removing your account removes your profile, your Moments, and your messages.</li>
            <li>Cancel an optional support membership any time from the Support page.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            What we don&rsquo;t do
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We don&rsquo;t sell your information.</li>
            <li>We don&rsquo;t use third-party advertising or tracking pixels.</li>
            <li>We don&rsquo;t share member data with Penn Athletics unless you ask us to.</li>
            <li>We don&rsquo;t require payment to join. Access is approval-based; support is optional.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Contact
          </h2>
          <p>
            Questions, requests, or anything that feels off? Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>. The Clubhouse is run by Ryan Chang, Penn Men&rsquo;s Golf &lsquo;27.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-[#8a7f70]">
          See also: <Link href="/terms" className="text-[#0a1628] hover:text-[#990000] hover:underline">Terms</Link>
        </p>
      </article>
    </div>
  )
}
