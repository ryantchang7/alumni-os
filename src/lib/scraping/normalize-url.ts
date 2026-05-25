const DISALLOWED_PROTOCOLS = ['mailto:', 'tel:', 'javascript:', 'data:']

export function normalizeUrl(href: string, baseUrl: string): string | null {
  if (!href || typeof href !== 'string') return null
  href = href.trim()

  for (const proto of DISALLOWED_PROTOCOLS) {
    if (href.toLowerCase().startsWith(proto)) return null
  }

  let resolved: URL
  try {
    resolved = new URL(href, baseUrl)
  } catch {
    return null
  }

  if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null

  // Remove hash fragments
  resolved.hash = ''

  return resolved.toString()
}
