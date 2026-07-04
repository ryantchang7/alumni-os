import Link from 'next/link'

export const metadata = {
  title: 'Legal',
}

export default function LegalPage() {
  return (
    <div className="bg-[#f8f5f0] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2 font-heading"
        >
          Legal
        </h1>
        <p className="text-[12.5px] text-ink-muted mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            All of the Clubhouse&rsquo;s policies in one place. These documents govern your use of the Penn Golf Clubhouse, operated by Ryan Chang.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            <Link href="/terms" className="hover:text-[#990000] hover:underline transition-colors">Terms of Use</Link>
          </h2>
          <p>
            The rules of the road: eligibility, acceptable use, your content, our intellectual property, moderation, and the legal framework governing your use of the Clubhouse.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            <Link href="/privacy" className="hover:text-[#990000] hover:underline transition-colors">Privacy Policy</Link>
          </h2>
          <p>
            What personal information we collect, how we use and store it, who can see it, your rights, and how to request deletion.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            <Link href="/cookies" className="hover:text-[#990000] hover:underline transition-colors">Cookie Policy</Link>
          </h2>
          <p>
            The Clubhouse uses only essential session cookies to keep you signed in. No advertising cookies, no cross-site tracking, no third-party analytics pixels.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            <Link href="/community-guidelines" className="hover:text-[#990000] hover:underline transition-colors">Community Guidelines</Link>
          </h2>
          <p>
            The code of conduct for the Penn Men&rsquo;s Golf family: be real, be respectful, respect privacy, keep it relevant, and how we handle violations.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            <Link href="/copyright" className="hover:text-[#990000] hover:underline transition-colors">Copyright &amp; DMCA Policy</Link>
          </h2>
          <p>
            How to report copyright infringement, the DMCA notice requirements, the counter-notification process, and our repeat-infringer policy.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            <Link href="/subscription-terms" className="hover:text-[#990000] hover:underline transition-colors">Subscription &amp; Billing Terms</Link>
          </h2>
          <p>
            Applies only to optional paid support tiers. Covers pricing, automatic renewal disclosure, cancellation, refunds, and Stripe payment processing.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-ink-muted">
          See also: <Link href="/terms" className="text-[#0a1628] hover:text-[#990000] hover:underline">Terms of Use</Link>
        </p>
      </article>
    </div>
  )
}
