import Link from 'next/link'

export const metadata = {
  title: 'Community Guidelines',
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="bg-[#f8f5f0] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2 font-heading"
        >
          Community Guidelines
        </h1>
        <p className="text-[12.5px] text-ink-muted mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            The Penn Golf Clubhouse is the private network for the Penn Men&rsquo;s Golf family &mdash; players, alumni, coaches, family, and longtime affiliates. This is a community built on shared experience and mutual respect. Treat it that way.
          </p>
          <p className="text-[13px] text-ink-muted italic">
            These Community Guidelines were prepared for informational purposes. They do not constitute legal advice. A qualified attorney should review them before formal public launch.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Be real
          </h2>
          <p>
            Use your authentic identity. Claim only the member card that is genuinely yours &mdash; don&rsquo;t claim a card that belongs to someone else, and don&rsquo;t impersonate another person. Members hold one account each. Misrepresenting who you are undermines the trust this community is built on.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Be respectful
          </h2>
          <p>
            The Penn Golf family spans generations &mdash; current players, recent grads, parents, coaches, and alumni going back decades. Treat every member with the respect you&rsquo;d show a teammate or a coach. We do not tolerate:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Harassment, bullying, or threats of any kind.</li>
            <li>Hate speech, slurs, or content that demeans people based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or age.</li>
            <li>Content that is deliberately hostile, defamatory, or intended to harm another member&rsquo;s reputation.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Respect privacy
          </h2>
          <p>
            What happens in the Clubhouse stays in the Clubhouse. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Don&rsquo;t share another member&rsquo;s personal information (contact details, location, etc.) outside the Clubhouse without their explicit consent.</li>
            <li>Don&rsquo;t post photos or videos of other people without their consent.</li>
            <li>Don&rsquo;t export, scrape, or copy the Member Book or Member Map for use outside the Penn Golf community.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Keep it relevant
          </h2>
          <p>
            The Clubhouse exists for the Penn Men&rsquo;s Golf community. Keep your use consistent with that purpose:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>No spam, mass solicitation, or unsolicited sales pitches.</li>
            <li>Don&rsquo;t use the Member Book or Member Map as a cold-contact list for purposes unrelated to the Penn Golf community.</li>
            <li>Commercial promotions, affiliate links, and business solicitations are not permitted without prior approval from the Operator.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Reporting
          </h2>
          <p>
            If you encounter content or behavior that violates these Guidelines, please report it by emailing{' '}
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>
            . Include as much detail as you can &mdash; what you saw, where, and when. We take every report seriously and will review it promptly.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Enforcement
          </h2>
          <p>
            A captain or the Operator may take any of the following actions in response to a Guidelines violation:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Edit or remove content that violates these Guidelines.</li>
            <li>Issue a warning to the member involved.</li>
            <li>Temporarily or permanently suspend an account.</li>
            <li>In cases of serious harm, abuse, or illegal conduct: immediate removal without prior notice.</li>
          </ul>
          <p>
            We will generally notify the affected member and explain the reason unless doing so would risk further harm. Decisions may be appealed by emailing{' '}
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>
            .
          </p>
          <p>
            These Guidelines supplement &mdash; they do not replace &mdash; the{' '}
            <Link href="/terms" className="text-[#990000] hover:underline">
              Terms of Use
            </Link>
            . Violating the Terms is also a violation of these Guidelines.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Contact
          </h2>
          <p>
            Questions or concerns: email{' '}
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>
            . The Clubhouse is operated by Ryan Chang, Penn Men&rsquo;s Golf, Class of 2028.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-ink-muted">
          See also:{' '}
          <Link href="/terms" className="text-[#0a1628] hover:text-[#990000] hover:underline">
            Terms of Use
          </Link>
        </p>
      </article>
    </div>
  )
}
