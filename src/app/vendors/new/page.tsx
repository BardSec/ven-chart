import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { VendorForm } from '@/components/vendors/VendorForm'

export const metadata = { title: 'New Vendor' }

export default async function NewVendorPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const role = session.user.role
  if (role === 'VIEWER') redirect('/vendors')

  return (
    <AppLayout>
      <Header title="New Vendor" description="Add a new vendor to the system" />
      <div className="p-6 max-w-3xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <VendorForm />
        </div>
      </div>
    </AppLayout>
  )
}
