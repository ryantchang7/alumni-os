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
        <p className="text-[12.5px] text-[#8a7f70] mb-8">Last updated 2026-05-31</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            Welcome in. The Clubhouse is a private space for the Penn Men&rsquo;s Golf family. Like a real clubhouse, it runs on trust. These terms are short on purpose &mdash; the spirit of them is more important than any single line.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Who this is for
          </h2>
          <p>
            Current players, alumni, coaches, and friends and family of Penn Men&rsquo;s Golf. Membership is approval-based. The captain decides who&rsquo;s in.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            What we ask of you
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be honest about who you are. Don&rsquo;t claim a card that isn&rsquo;t yours.</li>
            <li>Be respectful to every member. The Penn Golf family includes generations who never overlapped on a roster.</li>
            <li>Don&rsquo;t scrape, export, or copy other members&rsquo; information for outside use.</li>
            <li>Don&rsquo;t use the Clubhouse to spam, harass, or pitch unsolicited products.</li>
            <li>Don&rsquo;t use the Member Book or Member Map to build a contact list for anything outside the Penn Golf community.</li>
            <li>Don&rsquo;t upload photos of other people without their okay.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your content
          </h2>
          <p>
            You control your member card, your posts, your Moments, and your messages. You can edit or remove anything you posted. You grant the Clubhouse permission to display what you post inside the approved-members-only surfaces of the site.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Captain and founder authority
          </h2>
          <p>
            A captain can decline a claim, remove content that breaks the spirit of the Clubhouse, or pause an account that&rsquo;s causing harm. We&rsquo;ll always tell you why if it&rsquo;s your account. The founder can step in for the same reasons. We don&rsquo;t do this lightly.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Optional support
          </h2>
          <p>
            Joining is approval-based, not paywalled. Optional support tiers help fund Penn Men&rsquo;s Golf (70% of every dollar) and keep the Clubhouse running (30%). Becoming a Founding Member or Member is a way to back the program. It is not how you get in. You can cancel any time.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            What we are and aren&rsquo;t
          </h2>
          <p>
            The Clubhouse is built and run by Ryan Chang, Penn Men&rsquo;s Golf &lsquo;27. It is not an official Penn Athletics system unless and until Penn Athletics says so. It is not a replacement for any tool Penn provides to current players. Use common sense and keep the Clubhouse respectful.
          </p>

          <h2 className="text-xl font-medium pt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            Contact
          </h2>
          <p>
            Questions? Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>.
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
