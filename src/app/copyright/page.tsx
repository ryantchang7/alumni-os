import Link from 'next/link'

export const metadata = {
  title: 'Copyright & DMCA Policy',
}

export default function CopyrightPage() {
  return (
    <div className="bg-[#fbf9f6] min-h-[calc(100dvh-60px)] px-5 sm:px-8 py-14 sm:py-20">
      <article className="max-w-[760px] mx-auto bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-4">
          Penn Golf Clubhouse
        </p>
        <h1
          className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight mb-2 font-heading"
        >
          Copyright &amp; DMCA Policy
        </h1>
        <p className="text-[12.5px] text-ink-muted mb-8">Last updated 2026-06-27</p>

        <section className="space-y-5 text-[14.5px] text-[#0a1628] leading-relaxed">
          <p>
            The Penn Golf Clubhouse respects intellectual property rights and responds to valid notices of copyright infringement under the Digital Millennium Copyright Act, 17 U.S.C. &sect;512 (&ldquo;DMCA&rdquo;). If you believe content on the Clubhouse infringes your copyright, please follow the process below.
          </p>
          
          <h2 className="text-xl font-medium pt-2 font-heading">
            Reporting copyright infringement
          </h2>
          <p>
            To submit a DMCA takedown notice, send a written communication to our designated agent (contact below) that includes <strong>all six</strong> of the following elements required by 17 U.S.C. &sect;512(c)(3):
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              A physical or electronic signature of the copyright owner, or a person authorized to act on behalf of the owner.
            </li>
            <li>
              Identification of the copyrighted work you claim has been infringed. If multiple works are covered by a single notice, a representative list of those works is acceptable.
            </li>
            <li>
              Identification of the allegedly infringing material and information reasonably sufficient to permit us to locate it on the Clubhouse (e.g., the URL or a description of where it appears).
            </li>
            <li>
              Your contact information: your name, mailing address, telephone number, and email address.
            </li>
            <li>
              A statement that you have a good-faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
            </li>
            <li>
              A statement, made under penalty of perjury, that the information in your notice is accurate, and that you are the copyright owner or are authorized to act on the copyright owner&rsquo;s behalf.
            </li>
          </ol>
          <p>
            Notices that do not comply with all six requirements may not receive a response. Submitting a false DMCA notice may expose you to legal liability, including under 17 U.S.C. &sect;512(f).
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Designated agent
          </h2>
          <p>
            Send DMCA notices to:
          </p>
          <p>
            Ryan Chang<br />
            <a href="mailto:rtchang@upenn.edu" className="text-[#990000] hover:underline">
              rtchang@upenn.edu
            </a>
          </p>
          <p>
            We will respond to properly submitted notices promptly and take appropriate action, which may include removing or disabling access to the identified material.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Counter-notification
          </h2>
          <p>
            If material you posted was removed or disabled in response to a DMCA notice and you believe the removal was in error or based on misidentification, you may submit a counter-notification to our designated agent. Your counter-notification must include:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Your physical or electronic signature.</li>
            <li>Identification of the material that was removed or disabled, and the location (URL or description) where it appeared before it was removed.</li>
            <li>
              A statement under penalty of perjury that you have a good-faith belief the material was removed or disabled as a result of mistake or misidentification.
            </li>
            <li>
              Your name, mailing address, and telephone number, along with a statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located (or, if you are outside the United States, any judicial district in which we may be found), and that you will accept service of process from the person who submitted the original notice or their agent.
            </li>
          </ol>
          <p>
            Upon receipt of a valid counter-notification, we will forward a copy to the original complainant and may restore the removed material no sooner than 10 and no later than 14 business days, unless we first receive notice that the complainant has filed an action seeking a court order to restrain you from engaging in infringing activity.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Repeat infringers
          </h2>
          <p>
            In accordance with 17 U.S.C. &sect;512(i), we will, in appropriate circumstances, terminate the accounts of users who are repeat infringers of copyright or other intellectual property rights.
          </p>

          <h2 className="text-xl font-medium pt-2 font-heading">
            Contact
          </h2>
          <p>
            Questions about this policy or intellectual property concerns: email{' '}
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
