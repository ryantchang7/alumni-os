// Penn Golf Clubhouse — minimal, conservative service worker.
// Network-first for pages so app code is never stale; cache-first only for
// immutable hashed static assets; offline fallback to the cached home shell.
// API and auth requests are never intercepted.
const CACHE = 'pgc-v1'
const PRECACHE = ['/', '/penn-golf-shield.png', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Never intercept API or auth — always hit the network.
  if (url.pathname.startsWith('/api/')) return

  // Immutable hashed assets: cache-first.
  // After storing a new entry, trim the cache to a max of 60 entries so
  // repeated deploys don't cause unbounded storage growth.
  const STATIC_MAX = 60
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => {
              c.put(request, copy)
              // Trim only old /_next/static entries once we exceed the cap.
              // Filtering to static keys protects the precached offline shell
              // ('/', shield, icon) and cached member photos from eviction.
              c.keys().then((keys) => {
                const staticKeys = keys.filter((k) => {
                  try {
                    return new URL(k.url).pathname.startsWith('/_next/static/')
                  } catch {
                    return false
                  }
                })
                if (staticKeys.length > STATIC_MAX) {
                  staticKeys
                    .slice(0, staticKeys.length - STATIC_MAX)
                    .forEach((k) => c.delete(k))
                }
              })
            })
            return res
          }),
      ),
    )
    return
  }

  // Navigations: network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((c) => c || caches.match('/'))),
    )
    return
  }

  // Other same-origin GETs (images, fonts): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
