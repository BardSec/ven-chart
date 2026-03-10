import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { Users, ArrowUpDown, Shield, Settings2 } from 'lucide-react'

export const metadata = { title: 'Admin Settings' }

const ADMIN_CARDS = [
  {
    title: 'User Management',
    description: 'View and manage user accounts, assign roles, deactivate access.',
    icon: Users,
    href: '/admin/users',
  },
  {
    title: 'Import / Export',
    description: 'Export all data as JSON for backup, or import data from a previous export.',
    icon: ArrowUpDown,
    href: '/import-export',
  },
]

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/')

  return (
    <AppLayout>
      <Header title="Admin" description="System settings and administration" />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
          {ADMIN_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-700">{card.title}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Environment info */}
        <div className="mt-8 max-w-2xl rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">System Information</h3>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Signed in as</dt>
            <dd className="font-medium text-gray-900">{session.user.email}</dd>
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium text-gray-900">Admin</dd>
            <dt className="text-gray-500">District</dt>
            <dd className="font-medium text-gray-900">{process.env.NEXT_PUBLIC_DISTRICT_NAME ?? 'Not configured'}</dd>
          </dl>
        </div>
      </div>
    </AppLayout>
  )
}
