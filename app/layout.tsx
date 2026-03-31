import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Life Tracker Pro',
  description: 'Your gamified life tracking system — goals, finance, movies, trips & more.',
  keywords: ['habit tracker', 'personal tracker', 'gamification', 'finance tracker'],
  authors: [{ name: 'Life Tracker Pro' }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  )
}
