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
        <p className="text-[12.5px] text-[#8a7f70] mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            The Penn Golf Clubhouse is a private, approval-gated community for the Penn Men&rsquo;s Golf family. This policy explains what we collect, how we use it, where it&rsquo;s stored, and your choices.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Information we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Profile information you add to your member card &mdash; name, class year, city and state, hometown, home course, handicap, contact preferences, bio, and how you want to help.</li>
            <li>Photos and videos you upload to your profile or to Moments.</li>
            <li>Messages and requests you send or receive inside the Clubhouse.</li>
            <li>Sign-in information from Google OAuth: your name, email address, and profile photo.</li>
            <li>Subscription state if you choose to support the Clubhouse (handled by Stripe).</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            How we use your information
          </h2>
          <p>
            We use your information to operate the Clubhouse, authenticate you, display your profile to approved members, send relevant notifications and emails, and process optional support contributions. We do not use your information for advertising.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Where your information is stored
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Member profiles, requests, gatherings, and Moments are stored in Upstash (Vercel KV).</li>
            <li>Photos and videos are stored in Vercel Blob.</li>
            <li>Sign-in is handled by Google through NextAuth.</li>
            <li>Email is delivered by Resend.</li>
            <li>Payments are handled by Stripe &mdash; card details never reach our servers.</li>
            <li>The site is hosted on Vercel.</li>
            <li>Data is processed and stored in the United States.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Security
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Connections are encrypted in transit with HTTPS/TLS.</li>
            <li>Sign-in uses Google OAuth, so the Clubhouse never sees or stores your password.</li>
            <li>All member content is restricted to approved members only.</li>
            <li>Administrative and data-management functions are restricted to the founder.</li>
            <li>Public forms are protected by rate limiting and an automated bot challenge.</li>
            <li>The member database is backed up privately and is not publicly accessible.</li>
          </ul>
          <p>
            No online service can be guaranteed 100% secure, but we take reasonable measures and review them regularly. If we become aware of a breach affecting your information, we will notify the members affected.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Who can see what
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only approved members of the Clubhouse can see member profiles, the Member Map, gatherings, Open Requests, Moments, and chat threads.</li>
            <li>The Member Book may list names, years, and hometowns from public roster and historical sources before a card is claimed.</li>
            <li>You decide how you want other members to reach you (email, intro through the captain, LinkedIn, or not available right now).</li>
            <li>Captain and founder roles can see the admin queue (pending claims, roster edits). They cannot read your private chats.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your rights &amp; choices
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Edit anything on your member card any time from your profile.</li>
            <li>Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a> to correct or remove a pre-claim Member Book entry, or to request a copy or deletion of your data.</li>
            <li>Sign out any time. Deleting your account removes your profile, your Moments, and your messages.</li>
            <li>Cancel optional support any time from the Support page.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Data retention
          </h2>
          <p>
            We keep your information while your account is active. When you delete your account we remove your profile and content, though copies may remain in private backups for a limited period before they rotate out. Payment records held by Stripe are retained as required for financial and legal purposes.
          </p>

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
            Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a> with questions, data requests, or anything that seems off. The Clubhouse is run by Ryan Chang, Penn Men&rsquo;s Golf, Class of 2028.
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
