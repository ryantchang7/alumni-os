import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageShellProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  children: React.ReactNode
  actions?: React.ReactNode
  variant?: 'light' | 'navy'
}

export default function PageShell({
  title,
  subtitle,
  breadcrumbs,
  children,
  actions,
  variant = 'light',
}: PageShellProps) {
  const isNavy = variant === 'navy'

  const topBarClass = isNavy
    ? 'bg-[#0a1628] border-b border-white/[0.08]'
    : 'bg-[#f8f5f0] border-b border-[rgba(180,168,150,0.35)]'

  const crumbLinkClass = isNavy
    ? 'text-gray-500 hover:text-gray-300 transition-colors'
    : 'text-[#8a7f70] hover:text-[#0a1628] transition-colors'

  const crumbCurrentClass = isNavy ? 'text-gray-300' : 'text-[#0a1628]'
  const crumbSepClass = isNavy ? 'text-gray-600' : 'text-[#8a7f70] opacity-50'

  const titleClass = isNavy
    ? 'text-white'
    : 'text-[#0a1628]'

  const subtitleClass = isNavy ? 'text-gray-400' : 'text-[#8a7f70]'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className={`${topBarClass} px-6 py-5`}>
        <div className="max-w-[1320px] mx-auto">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 mb-3 flex-wrap">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <ChevronRight
                      size={13}
                      className={crumbSepClass}
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className={`text-xs ${crumbLinkClass}`}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`text-xs ${crumbCurrentClass}`}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className={`text-2xl font-semibold tracking-tight leading-snug ${titleClass}`}
              >
                {title}
              </h1>
              {subtitle && (
                <p className={`text-sm mt-1 leading-relaxed ${subtitleClass}`}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 bg-[#f8f5f0]">
        <div className="max-w-[1320px] mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
