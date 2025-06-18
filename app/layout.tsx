import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Check Live Status',
  description: 'Check your account status and manage team memberships',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-white dark:bg-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 