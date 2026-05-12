import type { ContactPath } from '@/lib/types'

interface ContactPathCardProps {
  path: ContactPath
  alumniName: string
}

const pathIcons: Record<string, string> = {
  coach_intro: '👋',
  teammate_intro: '🤝',
  linkedin_public_url: '💼',
  public_employer_bio: '🏢',
  alumni_submitted: '✅',
  team_directory_permissioned: '📋',
  unknown: '❓',
  do_not_contact: '🔒',
}

export default function ContactPathCard({ path, alumniName }: ContactPathCardProps) {
  const firstName = alumniName.split(' ')[0]

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{pathIcons[path.type] ?? '📬'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-gray-800">
              {path.label}
            </h4>
            {path.verified && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Verified</span>
            )}
            {path.preferred && (
              <span className="text-xs bg-[#0a1628] text-white px-1.5 py-0.5 rounded font-medium">Preferred</span>
            )}
          </div>

          {path.type === 'coach_intro' && (
            <p className="text-xs text-gray-600 leading-relaxed">
              Ask your coach to send an introduction to {firstName}. Explain your specific reason for reaching out.
            </p>
          )}
          {path.type === 'teammate_intro' && (
            <p className="text-xs text-gray-600 leading-relaxed">
              Ask a mutual teammate who knows {firstName} to introduce you. This is the warmest possible path.
            </p>
          )}
          {path.type === 'linkedin_public_url' && path.value && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Connect on LinkedIn via {firstName}&apos;s public profile.</p>
              <a
                href={`https://${path.value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#990000] hover:underline font-medium"
              >
                View LinkedIn Profile
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
          {path.type === 'public_employer_bio' && path.value && (
            <div>
              <p className="text-xs text-gray-600 mb-2">View {firstName}&apos;s public employer profile for context before reaching out.</p>
              <a
                href={`https://${path.value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#990000] hover:underline font-medium"
              >
                View Employer Profile
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
          {path.type === 'unknown' && (
            <p className="text-xs text-gray-500 leading-relaxed">
              No verified contact path found. Consider asking a teammate or coach who may have a connection.
            </p>
          )}
          {path.type === 'do_not_contact' && (
            <p className="text-xs text-red-600 leading-relaxed">
              This alumni has requested no contact. Do not reach out through any path.
            </p>
          )}

          <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2">
            Alumni OS does not store private contact info. All paths use public or permissioned data.
          </p>
        </div>
      </div>
    </div>
  )
}
