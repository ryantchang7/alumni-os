import Link from 'next/link'

export const metadata = {
  title: 'Privacy',
}

export default function PrivacyPage() {
  return (
    <div className="bg-[#fbf9f6] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2 font-heading"
        >
          Privacy Policy
        </h1>
        <p className="text-[12.5px] text-ink-muted mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            The Penn Golf Clubhouse is a private, approval-gated community for the Penn Men&rsquo;s Golf family. This policy explains what we collect, how we use it, where it&rsquo;s stored, and your choices.
          </p>
          <p>
            You stay in control of your information: you can edit or delete it any time by contacting us, we never sell it, and we don&rsquo;t run ads or trackers.
          </p>
          <p className="text-[13px] text-ink-muted italic">
            This policy was prepared for informational purposes. It does not constitute legal advice. A qualified attorney should review it before formal public launch.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Who we are
          </h2>
          <p>
            The Clubhouse is operated by Ryan Chang (&ldquo;the Operator,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), an individual acting as the data controller for information you provide. Contact: <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Information we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Profile information you add to your member card &mdash; name, class year, city and state, hometown, home course, handicap, contact preferences, bio, and how you want to help.</li>
            <li>Photos and videos you upload to your profile or to Moments.</li>
            <li>Messages and requests you send or receive inside the Clubhouse.</li>
            <li>Sign-in information from Google OAuth: your name, email address, and profile photo.</li>
            <li>Subscription state if you choose to support the Clubhouse (handled by Stripe).</li>
            <li>Technical and log data: IP address and basic request metadata (browser type, referring URL, timestamps) collected automatically by Vercel infrastructure and used by the Clubhouse for security, rate limiting, and abuse prevention.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Cookies &amp; similar technologies
          </h2>
          <p>
            The Clubhouse uses only essential session cookies set by our authentication provider (NextAuth / Auth.js) to keep you signed in. These cookies are strictly necessary to operate the service. We do not use advertising cookies, cross-site tracking cookies, or third-party analytics pixels.
          </p>
          <p>
            Public-facing forms (such as the profile claim form) are protected by a Cloudflare Turnstile bot challenge. Cloudflare may set its own cookies or use your IP address as part of its verification process; that processing is governed by <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#990000] hover:underline">Cloudflare&rsquo;s Privacy Policy</a>.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            How we use your information
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To operate the Clubhouse, authenticate you, and display your profile to approved members.</li>
            <li>To send relevant notifications and transactional emails (approval decisions, new messages, digest updates).</li>
            <li>To process optional support contributions.</li>
            <li>To detect and prevent abuse, spam, and unauthorized access, including per-IP rate limiting on public endpoints.</li>
            <li>We do not use your information for advertising.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Legal bases
          </h2>
          <p>
            We process your information: (a) to provide the service you asked for (necessary to perform our agreement with you); (b) on the basis of your consent, where you have provided it; and (c) for our legitimate interest in operating, securing, and improving a private community. You may withdraw consent at any time by contacting us, though this will not affect processing that occurred before withdrawal.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Where your information is stored &amp; who processes it
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Member profiles, requests, gatherings, and Moments are stored in Upstash (Vercel KV).</li>
            <li>Photos and videos are stored in Vercel Blob.</li>
            <li>Sign-in is handled by Google through NextAuth / Auth.js.</li>
            <li>Email is delivered by Resend.</li>
            <li>Payments are handled by Stripe &mdash; card details never reach our servers.</li>
            <li>The site is hosted on Vercel.</li>
            <li>Bot-challenge verification on public forms is handled by Cloudflare Turnstile.</li>
            <li>All data is processed and stored in the United States.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Security
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Connections are encrypted in transit with HTTPS/TLS.</li>
            <li>Sign-in uses Google OAuth, so the Clubhouse never sees or stores your password.</li>
            <li>All member content is restricted to approved members only.</li>
            <li>Administrative and data-management functions are restricted to the Operator.</li>
            <li>Public forms are protected by rate limiting and an automated bot challenge (Cloudflare Turnstile).</li>
            <li>The member database is backed up privately and is not publicly accessible.</li>
          </ul>
          <p>
            No online service can be guaranteed 100% secure, but we take reasonable measures and review them regularly. If we become aware of a security breach that affects your personal information, we will notify affected members within a reasonable time.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Who can see what
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only approved members of the Clubhouse can see member profiles, the Member Map, gatherings, Open Requests, Moments, and chat threads.</li>
            <li>The Member Book may list names, years, and hometowns from public roster and historical sources before a card is claimed.</li>
            <li>You decide how you want other members to reach you (email, intro through the captain, LinkedIn, or not available right now).</li>
            <li>Captain and Operator roles can see the admin queue (pending claims, roster edits). They cannot read your private chats.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Your rights &amp; choices
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Edit anything on your member card at any time from your profile.</li>
            <li>Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a> to access, correct, export, or request deletion of your personal data. We will honor these requests within a reasonable time.</li>
            <li>Request removal of a pre-claim Member Book entry by emailing us.</li>
            <li>Hide your contact information from other members at any time from your profile settings.</li>
            <li>Cancel optional support at any time from the Support page.</li>
            <li>We honor these rights regardless of where you live.</li>
            <li><strong>California residents:</strong> We do not sell or share your personal information as those terms are defined under the California Consumer Privacy Act (CCPA/CPRA).</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Categories of personal information (California)
          </h2>
          <p>
            Under the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA), we are required to disclose the categories of personal information we collect. The following categories apply to the Clubhouse, with examples mapped to what we actually collect:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identifiers.</strong> Name, email address, Google account ID (from Google OAuth sign-in).</li>
            <li><strong>Customer records.</strong> Profile and member-card fields you fill in: class year, city and state, hometown, home course, handicap, contact preferences, and how you want to help.</li>
            <li><strong>Internet or other electronic network activity.</strong> IP address, request logs (browser type, referring URL, timestamps) collected automatically for security and abuse prevention.</li>
            <li><strong>Geolocation &mdash; approximate only.</strong> City, state, and hometown as entered on your member card. We do not collect or use precise GPS location.</li>
            <li><strong>Visual information.</strong> Photos and videos you upload to your profile or to Moments.</li>
            <li><strong>Commercial information.</strong> Optional subscription tier and status (e.g., Supporting Member), if you choose to support the Clubhouse.</li>
            <li><strong>Professional or biographical information.</strong> Bio, class year, role (current player, alum, coach, family &amp; affiliate), and how you want to be involved with the community.</li>
          </ul>
          <p>
            We collect these categories for the purpose of operating the private community, authenticating members, and maintaining security. We do <strong>not</strong> sell or share these categories of personal information as those terms are defined under the CCPA/CPRA. Retention periods are described in the Data Retention section below.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Data retention
          </h2>
          <p>
            We keep your information while your account is active. If you request deletion of your account, we will remove your profile and associated content. Copies may remain in private backups for a limited period before they rotate out. Payment records held by Stripe are retained as required by financial and legal obligations. Technical log data is retained only as long as needed for security and operational purposes.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Children&rsquo;s privacy
          </h2>
          <p>
            The Clubhouse is intended for adults 18 years of age or older. It is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently received such information, we will delete it promptly. If you believe a child under 13 has provided us with personal information, please contact us at <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            International users
          </h2>
          <p>
            The Clubhouse is operated from and stores data in the United States. If you are accessing it from outside the United States, please be aware that your information will be transferred to, stored, and processed in the U.S., where data protection laws may differ from those in your country. By using the Clubhouse, you understand and agree that your information is processed in the United States.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            What we don&rsquo;t do
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We don&rsquo;t sell your information.</li>
            <li>We don&rsquo;t use third-party advertising or tracking pixels.</li>
            <li>We don&rsquo;t share member data with Penn Athletics unless you ask us to.</li>
            <li>We don&rsquo;t require payment to join. Access is approval-based; support is optional.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Changes to this policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will note material changes on the site or by email. Continued use of the Clubhouse after an update constitutes acceptance of the revised policy.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Contact
          </h2>
          <p>
            Email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a> with questions, data requests, or anything that seems off. The Clubhouse is operated by Ryan Chang, Penn Men&rsquo;s Golf, Class of 2028.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-ink-muted">
          See also: <Link href="/terms" className="text-[#0a1628] hover:text-[#990000] hover:underline">Terms</Link>
        </p>
      </article>
    </div>
  )
}
