import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TripAmigos - Group trips, sorted.',
  description: 'Stop juggling WhatsApp polls and spreadsheets. TripAmigos collects your group\'s budgets, dates and destination picks — then finds flights and hotels that work for everyone.',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://tripamigos.co'),
  openGraph: {
    title: 'TripAmigos - Group trips, sorted.',
    description: 'Stop juggling WhatsApp polls and spreadsheets. TripAmigos collects your group\'s budgets, dates and destination picks — then finds flights and hotels that work for everyone.',
    url: 'https://tripamigos.co',
    siteName: 'TripAmigos',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripAmigos - Group trips, sorted.',
    description: 'Stop juggling WhatsApp polls and spreadsheets. Collect your group\'s budgets, dates and picks — then find flights and hotels for everyone.',
  },
  keywords: ['group travel', 'group trip planner', 'trip planning app', 'group holiday', 'travel with friends', 'split flights', 'group booking', 'stag do planner', 'hen party planner', 'group flight booking', 'trip organiser'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
