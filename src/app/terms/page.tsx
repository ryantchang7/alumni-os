import Link from 'next/link'

export const metadata = {
  title: 'Terms',
}

export default function TermsPage() {
  return (
    <div className="bg-[#fbf9f6] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2 font-heading"
        >
          Terms of Use
        </h1>
        <p className="text-[12.5px] text-ink-muted mb-8">Last updated June 27, 2026</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of the Penn Golf Clubhouse (&ldquo;the Clubhouse&rdquo;), operated by Ryan Chang (&ldquo;the Operator,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account, claiming a profile, or otherwise using the Clubhouse you agree to be bound by these Terms. If you do not agree, do not use the Clubhouse.
          </p>
          <h2 className="text-xl font-medium pt-2 font-heading">
            Eligibility &amp; age
          </h2>
          <p>
            The Clubhouse is intended for adults who are 18 years of age or older (or the age of majority in your jurisdiction, if higher), and specifically for current players, alumni, coaches, and family &amp; friends of Penn Men&rsquo;s Golf. By using the Clubhouse you represent that you meet this age requirement. Membership is approval-based; a captain or the Operator reviews and approves profile claims and may decline or revoke access at any time.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Your account &amp; security
          </h2>
          <p>
            You sign in with a Google account or with a one-time link sent to your email address. You are responsible for all activity that occurs under your account. Keep your credentials secure and do not share access with others. You may hold only one account, and you may only claim a profile that is genuinely yours. If you suspect unauthorized use of your account, contact us immediately at <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Acceptable use
          </h2>
          <p>By using the Clubhouse you agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Misrepresent who you are. Don&rsquo;t claim a card that isn&rsquo;t yours, and don&rsquo;t impersonate another person.</li>
            <li>Post content that is illegal, defamatory, harassing, threatening, obscene, or that infringes any third-party intellectual-property or privacy rights.</li>
            <li>Scrape, export, or copy other members&rsquo; information for use outside the Penn Golf community.</li>
            <li>Use the Clubhouse to spam, harass, or pitch unsolicited products or services.</li>
            <li>Use the Member Book or Member Map to build contact lists for purposes unrelated to the Penn Golf community.</li>
            <li>Upload photos or videos of other people without their consent.</li>
            <li>Attempt to circumvent security measures, access accounts that are not yours, or interfere with the operation of the Clubhouse.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Your content &amp; license
          </h2>
          <p>
            You retain ownership of the content you post (&ldquo;Your Content&rdquo;). By posting Your Content you grant the Clubhouse a limited, non-exclusive, royalty-free license to display, reproduce, and distribute it solely within the approved-members-only areas of the Clubhouse for the purpose of operating the service. You represent and warrant that you own or have the necessary rights to Your Content and that it does not violate these Terms or any applicable law. You can edit or remove Your Content at any time.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Our intellectual property
          </h2>
          <p>
            The Penn Golf Clubhouse name, logo, design, original written content, and software are owned by or licensed to the Operator. You may not copy, reproduce, distribute, or create derivative works from any of these without our prior written permission. Nothing in these Terms grants you any rights in the Clubhouse&rsquo;s intellectual property except as expressly stated.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Third-party services
          </h2>
          <p>
            The Clubhouse uses third-party services including Google (sign-in), Stripe (payment processing), Resend (email delivery), Vercel (hosting), Upstash (data storage), and Cloudflare (bot-challenge on public forms). Your use of those services is also governed by their respective terms of service and privacy policies. We are not responsible for the practices of those third parties.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            No paywall, optional support
          </h2>
          <p>
            Access to the Clubhouse is free and approval-based. Membership and access are never gated by payment. Optional support contributions (processed securely by Stripe) are entirely voluntary. Seventy percent (70%) of every dollar is directed to Penn Men&rsquo;s Golf and thirty percent (30%) covers Clubhouse operating costs. Support does not affect your access or standing beyond an optional supporter badge, and can be canceled at any time from the Support page.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Moderation &amp; enforcement
          </h2>
          <p>
            Captains and the Operator may remove content that violates these Terms, suspend an account, or decline a profile claim. We will generally notify the affected member and explain the reason. We reserve the right to act promptly where we believe harm, abuse, or legal risk is present.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Termination
          </h2>
          <p>
            You may stop using the Clubhouse at any time. You can request deletion of your account and associated data by emailing <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>. We may suspend or terminate your access for violation of these Terms or for any other reason we deem necessary, with or without notice. Upon termination, your license to use the Clubhouse ceases, and provisions of these Terms that by their nature should survive, including disclaimers, limitations of liability, and indemnification, will continue to apply.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Disclaimers
          </h2>
          <p>
            The Clubhouse is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. The Clubhouse is an independent project built and run by Ryan Chang and is not affiliated with, endorsed by, or an official system of the University of Pennsylvania or Penn Athletics unless and until Penn Athletics expressly states otherwise. It is not a substitute for official Penn tools or communications.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, the Operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of or inability to use the Clubhouse, even if we have been advised of the possibility of such damages. In any event, the Operator&rsquo;s total cumulative liability to you shall not exceed the total amounts you have paid to the Clubhouse in the twelve (12) months immediately preceding the claim, or fifty U.S. dollars (USD $50), whichever is greater. Some jurisdictions do not allow limitations on implied warranties or liability for incidental damages; those limitations may not apply to you.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Indemnification
          </h2>
          <p>
            You agree to indemnify, defend, and hold harmless the Operator from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to (a) your violation of these Terms, (b) Your Content, or (c) your use of the Clubhouse in a manner not authorized by these Terms.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Governing law &amp; venue
          </h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, without regard to its conflict-of-law principles. Any dispute arising out of or relating to these Terms or the Clubhouse shall be resolved exclusively in the state or federal courts located in Pennsylvania, and you consent to personal jurisdiction in those courts.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Dispute resolution
          </h2>
          <p>
            We prefer to resolve disputes informally. Before filing any formal legal claim, please contact us at <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a> and give us a reasonable opportunity to address the issue. We will try to respond within a reasonable time.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            General
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Severability.</strong> If any provision of these Terms is found unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force.</li>
            <li><strong>Entire agreement.</strong> These Terms and our Privacy Policy constitute the entire agreement between you and the Operator regarding the Clubhouse and supersede any prior agreements.</li>
            <li><strong>No waiver.</strong> Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of that right or provision.</li>
            <li><strong>No assignment.</strong> You may not assign or transfer these Terms or any rights under them without our prior written consent. We may assign our rights freely.</li>
          </ul>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Changes to these Terms
          </h2>
          <p>
            We may update these Terms from time to time. We will note material changes on the site or by email. Continued use of the Clubhouse after an update constitutes acceptance of the revised Terms. If you do not agree to a change, you should stop using the Clubhouse and contact us to request account deletion.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Contact
          </h2>
          <p>
            Questions about these Terms: email <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">rtchang@upenn.edu</a>. The Clubhouse is operated by Ryan Chang, Penn Men&rsquo;s Golf, Class of 2028.
          </p>
        </section>

        <hr className="border-t border-[rgba(180,168,150,0.4)] my-10" />
        <p className="text-[12px] text-ink-muted">
          See also: <Link href="/privacy" className="text-[#0a1628] hover:text-[#990000] hover:underline">Privacy</Link>
        </p>
      </article>
    </div>
  )
}
