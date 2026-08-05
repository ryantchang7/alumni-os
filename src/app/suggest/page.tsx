import { auth } from '@/auth'
import { getAccountById } from '@/lib/store/local-store'
import SuggestIdeaForm from '@/components/SuggestIdeaForm'

export const metadata = {
  title: 'Suggest an idea',
}

export default async function SuggestPage() {
  const session = await auth()

  let prefillName: string | undefined
  let prefillEmail: string | undefined
  let isSignedIn = false

  if (session?.accountId) {
    isSignedIn = true
    const account = await getAccountById(session.accountId)
    prefillName = account?.name ?? session.user?.name ?? undefined
    prefillEmail = account?.email ?? session.user?.email ?? undefined
  }

  return (
    <main className="min-h-screen bg-[#fdfcf9]">
      <div className="max-w-2xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-ink-muted mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-4xl sm:text-5xl font-medium text-[#0a1628] leading-tight mb-5"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Suggest an idea
          </h1>
          <p className="text-base text-[#3a4657] leading-relaxed">
            Got an idea to make the Clubhouse more useful? Send it directly to
            Ryan. Every suggestion is read.
          </p>
        </div>

        {/* Gold rule */}
        <div
          className="mb-10"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, rgba(200,168,75,0.55), transparent)',
          }}
        />

        {/* Form */}
        <SuggestIdeaForm
          prefillName={prefillName}
          prefillEmail={prefillEmail}
          isSignedIn={isSignedIn}
        />
      </div>
    </main>
  )
}
