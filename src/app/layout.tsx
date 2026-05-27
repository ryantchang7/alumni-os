import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import NavBar from '@/components/NavBar'
import ClubhouseFooter from '@/components/ClubhouseFooter'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
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
  // Favicon — the Penn Golf shield in /public. Overrides the default
  // Next.js triangle in browser tabs and bookmarks.
  icons: {
    icon: '/penn-golf-shield.png',
    apple: '/penn-golf-shield.png',
  },
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
      </body>
    </html>
  )
}
