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
    // Long-press the installed app icon → jump straight to a room.
    shortcuts: [
      { name: 'Member Book', short_name: 'Members', url: '/member-book', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'The Course', short_name: 'Course', url: '/the-course', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Moments', short_name: 'Moments', url: '/moments', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Career Room', short_name: 'Career', url: '/career-room', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
    // Shown in the Android "Add to Home Screen" dialog so the install
    // preview looks like a real app, not a bookmark.
    screenshots: [
      { src: '/screenshots/home.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'The Penn Golf Clubhouse' },
      { src: '/screenshots/memberbook.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'The Member Book — every Quaker, past & present' },
    ],
  }
}
