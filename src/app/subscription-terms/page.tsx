import Link from 'next/link'

export const metadata = {
  title: 'Subscription & Billing Terms',
}

export default function SubscriptionTermsPage() {
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
          Subscription &amp; Billing Terms
        </h1>
        <p className="text-[12.5px] text-[#8a7f70] mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            Membership and access to the Penn Golf Clubhouse are <strong>free</strong> and approval-based. These Subscription &amp; Billing Terms apply <strong>only</strong> to optional paid support tiers. You are never required to pay to access the Clubhouse.
          </p>
          <p className="text-[13px] text-[#8a7f70] italic">
            These Subscription &amp; Billing Terms were prepared for informational purposes. They do not constitute legal advice. A qualified attorney should review them before formal public launch.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Support tiers
          </h2>
          <p>
            The following optional monthly support tiers are currently offered:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supporting Member &mdash; $10 / month.</strong> For alumni, players, and community members who want to directly support the program.</li>
            <li><strong>Founding Member &mdash; $20 / month.</strong> For those who want to provide double the support and be recognized as a Founding Member of the Clubhouse.</li>
            <li><strong>Family &amp; Affiliate &mdash; $15 / month.</strong> For family, parents, and longtime affiliates of the program.</li>
          </ul>
          <p>
            Optional one-time contributions of any amount (minimum $5) are also accepted via the{' '}
            <Link href="/support" className="text-[#990000] hover:underline">
              Support page
            </Link>
            .
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            How funds are used
          </h2>
          <p>
            Seventy percent (70%) of every membership payment and one-time contribution is directed to Penn Men&rsquo;s Golf. The remaining thirty percent (30%) covers Clubhouse platform and operating costs (hosting, storage, email delivery, payment processing, and related services). The 70% transfer is reconciled quarterly by the captain.
          </p>
          <p>
            Penn Men&rsquo;s Golf is not a registered 501(c)(3), so contributions are not tax-deductible.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Automatic renewal
          </h2>
          <p>
            <strong>Paid support tiers are recurring monthly subscriptions.</strong> When you subscribe to a support tier, you are enrolling in a subscription that <strong>automatically renews each month</strong> at the stated price until you cancel. By subscribing, you authorize Stripe to charge your payment method on file at the start of each billing period. You will receive a receipt from Stripe each time your subscription renews. The amount charged will be the price stated at the time you subscribed, subject to any price-change notice (see below).
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Cancellation
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You may cancel your subscription at any time from the{' '}
              <Link href="/support" className="text-[#990000] hover:underline">Support page</Link>{' '}
              by clicking &ldquo;Manage subscription.&rdquo;</li>
            <li>Cancellation takes effect at the <strong>end of your current billing period</strong>. You will not be charged again after that date.</li>
            <li>You retain access through the end of the period you already paid for.</li>
            <li>Canceling removes your supporter badge and tier recognition going forward, once the paid period ends.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Refunds
          </h2>
          <p>
            Payments are voluntary contributions that support a program. As a general rule, payments are non-refundable. If you believe you were charged in error &mdash; for example, a duplicate charge or a charge after cancellation &mdash; email us at{' '}
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>{' '}
            and we will review and make it right.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Payment processing
          </h2>
          <p>
            All payments are processed by Stripe. We never see, receive, or store your card number, CVV, or other payment credentials &mdash; that information goes directly to Stripe and is governed by{' '}
            <a
              href="https://stripe.com/legal/ssa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#990000] hover:underline"
            >
              Stripe&rsquo;s terms
            </a>
            . The Clubhouse only receives a subscription status and tier from Stripe.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Price changes
          </h2>
          <p>
            We will give you advance notice of any change to the price of a support tier &mdash; via email or a notice on the site. A price change takes effect on your next renewal date after the notice period. If you do not agree to a price change, you may cancel before the change takes effect.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Contact
          </h2>
          <p>
            Questions about billing or your subscription: email{' '}
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>
            . The Clubhouse is operated by Ryan Chang, Penn Men&rsquo;s Golf, Class of 2028.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-[#8a7f70]">
          See also:{' '}
          <Link href="/terms" className="text-[#0a1628] hover:text-[#990000] hover:underline">
            Terms of Use
          </Link>
        </p>
      </article>
    </div>
  )
}
