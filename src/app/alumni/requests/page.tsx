import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ teamSlug?: string }>
}

export default async function AlumniRequestsPage({ searchParams }: PageProps) {
  const { teamSlug } = await searchParams
  const slug = teamSlug ?? 'penn-mens-golf'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <Link
            href={`/alumni?teamSlug=${slug}`}
            className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block"
          >
            &larr; Alumni Mode
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mt-1">
            Player requests
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            When players want to connect, their requests will appear here.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10">
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-10 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-base font-semibold text-[#0a1628] mb-2">
              No requests yet
            </p>
            <p className="text-sm text-[#8a7f70] max-w-sm mx-auto">
              When players reach out through Player Mode, you will see their requests here.
              This feature is coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
