import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import NavBar from '@/components/NavBar'
import ClubhouseFooter from '@/components/ClubhouseFooter'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import InstallAppBanner from '@/components/InstallAppBanner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    // Used when a child page sets its own title via `template`.
    default: 'Penn Golf Clubhouse',
    template: '%s · Penn Golf Clubhouse',
  },
  description:
    "The private alumni network for Penn Men's Golf.",
  applicationName: 'Penn Golf Clubhouse',
  // Lets an installed iOS home-screen launch open full-screen (no Safari chrome).
  appleWebApp: {
    capable: true,
    title: 'Penn Golf',
    statusBarStyle: 'default',
  },
  // Favicon — the Penn Golf shield in /public. The Apple touch icon is the
  // navy-backed shield so the iOS home-screen tile isn't transparent/black.
  icons: {
    icon: '/penn-golf-shield.png',
    apple: '/apple-icon-180.png',
  },
}

// theme-color drives the browser / installed-app toolbar tint (brand navy).
// viewportFit: 'cover' lets the app extend under the notch/Dynamic Island and
// home indicator so we can handle insets ourselves with env(safe-area-inset-*).
export const viewport: Viewport = {
  themeColor: '#0a1628',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f5f0]">
        <SessionProviderWrapper>
          <TooltipProvider>
            <NavBar />
            <main className="flex-1">{children}</main>
            <ClubhouseFooter />
          </TooltipProvider>
        </SessionProviderWrapper>
        <ServiceWorkerRegister />
        <InstallAppBanner />
      </body>
    </html>
  )
}
