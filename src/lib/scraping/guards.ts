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

/**
 * SSRF guard: reject hostnames/IPs that resolve to the local machine or a
 * private/link-local/metadata range. Literal checks only (we don't resolve DNS
 * here) — paired with redirect:'manual' in fetch-page.ts so a public URL can't
 * 302 into the internal network. Covers:
 *   - localhost
 *   - IPv4 loopback 127.0.0.0/8, unspecified 0.0.0.0
 *   - RFC1918 private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 *   - link-local 169.254.0.0/16 (incl. cloud metadata 169.254.169.254)
 *   - IPv6 loopback ::1, unique-local fc00::/7, link-local fe80::/10
 */
export function isPrivateOrLocalHost(hostname: string): boolean {
  // URL hostnames keep IPv6 in brackets, e.g. "[::1]". Strip them, and drop
  // any IPv6 zone id (e.g. "fe80::1%eth0").
  let host = hostname.trim().toLowerCase()
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  host = host.split('%')[0]

  if (host === 'localhost' || host.endsWith('.localhost')) return true

  // IPv4 (dotted-quad). Parse octets and test the ranges numerically.
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 127) return true // loopback
    if (a === 0) return true // 0.0.0.0/8 (incl. unspecified)
    if (a === 10) return true // private
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 169 && b === 254) return true // link-local (incl. 169.254.169.254)
    return false
  }

  // IPv6 literals.
  if (host === '::1' || host === '::') return true // loopback / unspecified
  // fc00::/7 (unique-local) → first hex group 'fc'/'fd'.
  if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return true
  // fe80::/10 (link-local) → fe8, fe9, fea, feb prefixes.
  if (/^fe[89ab][0-9a-f]?:/.test(host)) return true
  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1) — recurse on the embedded v4.
  const mapped = host.match(/(?:::ffff:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (mapped) return isPrivateOrLocalHost(mapped[1])

  return false
}

export function validateCrawlTarget(url: string, rootUrl?: string): { allowed: boolean; reason?: string } {
  if (!isValidHttpUrl(url)) return { allowed: false, reason: 'URL must use http or https protocol' }
  if (isLinkedInUrl(url)) return { allowed: false, reason: 'LinkedIn URLs are not permitted' }
  if (looksLoginGated(url)) return { allowed: false, reason: 'URL appears to be login-gated' }
  // SSRF: never fetch the local machine or a private/link-local/metadata host.
  try {
    if (isPrivateOrLocalHost(new URL(url).hostname)) {
      return { allowed: false, reason: 'URL targets a private, loopback, or link-local address' }
    }
  } catch {
    return { allowed: false, reason: 'URL could not be parsed' }
  }
  if (rootUrl && !isSameHostname(url, rootUrl)) return { allowed: false, reason: 'URL is on a different hostname than the submitted website' }
  return { allowed: true }
}
