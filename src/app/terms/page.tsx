import Link from 'next/link'

export const metadata = {
  title: 'Terms',
}

export default function TermsPage() {
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
          Terms
        </h1>
        <p className="text-[12.5px] text-[#8a7f70] mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            These Terms govern use of the Penn Golf Clubhouse (&ldquo;the Clubhouse&rdquo;), a private, approval-based community for the Penn Men&rsquo;s Golf family. By creating an account or using the Clubhouse you agree to these Terms.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Eligibility &amp; membership
          </h2>
          <p>
            The Clubhouse is open to current players, alumni, coaches, and family &amp; friends of Penn Men&rsquo;s Golf. Membership is approval-based. A captain or the founder reviews and approves profile claims, and may decline or revoke access.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your account
          </h2>
          <p>
            You sign in with Google. You are responsible for all activity that occurs on your account. You may hold only one account, and you may only claim a profile that is yours.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Acceptable use
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be honest about who you are. Don&rsquo;t claim a card that isn&rsquo;t yours.</li>
            <li>Be respectful to every member. The Penn Golf family includes generations who never overlapped on a roster.</li>
            <li>Don&rsquo;t scrape, export, or copy other members&rsquo; information for outside use.</li>
            <li>Don&rsquo;t use the Clubhouse to spam, harass, or pitch unsolicited products.</li>
            <li>Don&rsquo;t use the Member Book or Member Map to build contact lists for anything outside the Penn Golf community.</li>
            <li>Don&rsquo;t upload photos of other people without their consent.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your content
          </h2>
          <p>
            You own the content you post. You grant the Clubhouse a limited license to display it within approved-members-only areas of the site. You can edit or remove your content at any time. Deleting your account removes it.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Moderation &amp; enforcement
          </h2>
          <p>
            Captains and the founder may decline a claim, remove content that violates these Terms, or suspend an account causing harm. If it&rsquo;s your account, we&rsquo;ll tell you why.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            No paywall &mdash; optional support
          </h2>
          <p>
            Access to the Clubhouse is free and approval-based. Membership and access are never gated by payment. Optional support contributions (processed by Stripe) help fund Penn Men&rsquo;s Golf (70% of every dollar) and Clubhouse operating costs (30%). Support is voluntary, does not affect your access or standing beyond an optional supporter badge, and can be canceled any time.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Disclaimers
          </h2>
          <p>
            The Clubhouse is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. It is an independent project built and run by Ryan Chang and is not an official Penn Athletics system unless and until Penn Athletics says so. It is not a substitute for official Penn tools.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, the Clubhouse and its operator are not liable for indirect, incidental, or consequential damages arising from your use of the Clubhouse.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Changes to these Terms
          </h2>
          <p>
            We may update these Terms from time to time. We&rsquo;ll note material changes on the site or by email. Continued use of the Clubhouse after an update means you accept the revised Terms.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Contact
          </h2>
          <p>
            Questions about these Terms: email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-[#8a7f70]">
          See also: <Link href="/privacy" className="text-[#0a1628] hover:text-[#990000] hover:underline">Privacy</Link>
        </p>
      </article>
    </div>
  )
}
