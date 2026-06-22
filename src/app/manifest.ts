import type { MetadataRoute } from 'next'

// Web App Manifest — makes the Clubhouse installable as an app (Add to Home
// Screen). Next auto-injects <link rel="manifest"> from this file.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Penn Golf Clubhouse',
    short_name: 'Penn Golf',
    description: "The private alumni network for Penn Men's Golf.",
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a1628',
    theme_color: '#0a1628',
    categories: ['social', 'sports'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
