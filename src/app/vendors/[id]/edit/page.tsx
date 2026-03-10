import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { VendorForm } from '@/components/vendors/VendorForm'

export const metadata = { title: 'Edit Vendor' }

export default async function EditVendorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const role = session.user.role
  if (role === 'VIEWER') redirect(`/vendors/${params.id}`)

  const vendor = await prisma.vendor.findUnique({ where: { id: params.id } })
  if (!vendor) notFound()

  // Serialize dates
  const serialized = {
    ...vendor,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  }

  return (
    <AppLayout>
      <Header title={`Edit: ${vendor.name}`} description="Update vendor information" />
      <div className="p-6 max-w-3xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <VendorForm vendor={serialized as never} />
        </div>
      </div>
    </AppLayout>
  )
}
