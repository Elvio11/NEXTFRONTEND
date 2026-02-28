import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Talvix — AI Job Automation for India',
  description:
    'Talvix finds, scores, and applies to jobs while you sleep. 150,000+ jobs. 15 AI agents. ₹0 WhatsApp coaching.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#050505] text-[#f1f5f9] font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
