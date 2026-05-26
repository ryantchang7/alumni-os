import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-6">
        <p className="text-4xl font-bold text-[#0a1628]">404</p>
        <p className="text-base font-semibold text-[#0a1628]">Not found</p>
        <p className="text-sm text-[#8a7f70]">
          This page does not exist or the item was removed.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/"
            className="text-sm font-medium bg-[#0a1628] text-white px-4 py-2 rounded hover:bg-[#112240] transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/member-book"
            className="text-sm font-medium text-[#990000] border border-[#990000] px-4 py-2 rounded hover:bg-[#990000] hover:text-white transition-colors"
          >
            Search alumni
          </Link>
        </div>
      </div>
    </div>
  )
}
