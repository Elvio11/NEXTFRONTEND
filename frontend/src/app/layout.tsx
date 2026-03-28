import type { Metadata } from 'next'
import { Fira_Sans, Fira_Code } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/components/providers/Providers'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fira-sans',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
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
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className="bg-[#050505] text-[#f1f5f9] font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
