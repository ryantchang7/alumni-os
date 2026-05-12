// TODO: Production crawling must check and respect robots.txt before fetching any page.

const LOGIN_GATED_TOKENS = [
  'login', 'signin', 'sign-in', 'auth', 'account',
  'dashboard', 'portal', 'sso', 'admin', 'wp-admin',
  'user', 'users',
]

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isLinkedInUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname.includes('linkedin.com')
  } catch {
    return false
  }
}

export function looksLoginGated(url: string): boolean {
  try {
    const u = new URL(url)
    const pathParts = u.pathname.toLowerCase().split('/')
    return pathParts.some(part => LOGIN_GATED_TOKENS.includes(part))
  } catch {
    return false
  }
}

export function isSameHostname(url: string, rootUrl: string): boolean {
  try {
    return new URL(url).hostname === new URL(rootUrl).hostname
  } catch {
    return false
  }
}

export function validateCrawlTarget(url: string, rootUrl?: string): { allowed: boolean; reason?: string } {
  if (!isValidHttpUrl(url)) return { allowed: false, reason: 'URL must use http or https protocol' }
  if (isLinkedInUrl(url)) return { allowed: false, reason: 'LinkedIn URLs are not permitted' }
  if (looksLoginGated(url)) return { allowed: false, reason: 'URL appears to be login-gated' }
  if (rootUrl && !isSameHostname(url, rootUrl)) return { allowed: false, reason: 'URL is on a different hostname than the submitted website' }
  return { allowed: true }
}
