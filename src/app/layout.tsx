import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { SessionProvider } from '@/components/SessionProvider'
import { authOptions } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ven-chart — Vendor & Contract Management',
    template: '%s | ven-chart',
  },
  description: 'K12 school district vendor and contract management system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
