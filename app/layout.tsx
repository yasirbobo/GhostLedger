import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { GroupProvider } from '@/components/providers/group-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'GhostLedger - Private AI-Powered Team Finance',
  description: 'A private AI-powered team finance dashboard for managing group expenses, contributions, and financial insights with encrypted privacy mode.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <GroupProvider>{children}</GroupProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
