import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ContractForm } from '@/components/contracts/ContractForm'

export const metadata = { title: 'New Contract' }

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: { vendorId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const role = session.user.role
  if (role === 'VIEWER') redirect('/contracts')

  const vendors = await prisma.vendor.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <AppLayout>
      <Header title="New Contract" description="Add a contract or subscription" />
      <div className="p-6 max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <ContractForm
            vendors={vendors}
            defaultVendorId={searchParams.vendorId}
          />
        </div>
      </div>
    </AppLayout>
  )
}
