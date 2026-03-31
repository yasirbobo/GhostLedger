import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { GroupProvider } from '@/components/providers/group-provider'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://ghostledger.app'),
  title: {
    default: 'GhostLedger',
    template: '%s | GhostLedger',
  },
  description:
    'GhostLedger helps teams manage shared budgets, contributions, expenses, and AI-backed financial insights in one private workspace.',
  applicationName: 'GhostLedger',
  keywords: [
    'team finance',
    'shared expenses',
    'group budget',
    'expense tracking',
    'financial insights',
  ],
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
  openGraph: {
    title: 'GhostLedger',
    description:
      'Private team finance software for shared budgets, contributions, expenses, and actionable insights.',
    siteName: 'GhostLedger',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GhostLedger',
    description:
      'Private team finance software for shared budgets, contributions, expenses, and actionable insights.',
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
