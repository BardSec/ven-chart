import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ContractForm } from '@/components/contracts/ContractForm'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const contract = await prisma.contract.findUnique({ where: { id: params.id }, select: { productName: true } })
  return { title: contract ? `Edit: ${contract.productName}` : 'Edit Contract' }
}

export default async function EditContractPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const role = session.user.role
  if (role === 'VIEWER') redirect(`/contracts/${params.id}`)

  const [contract, vendors] = await Promise.all([
    prisma.contract.findUnique({ where: { id: params.id } }),
    prisma.vendor.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!contract) notFound()

  // Serialize for client component
  const serialized = {
    ...contract,
    cost: contract.cost ? Number(contract.cost) : null,
    totalContractValue: contract.totalContractValue ? Number(contract.totalContractValue) : null,
    startDate: contract.startDate?.toISOString() ?? null,
    renewalDate: contract.renewalDate?.toISOString() ?? null,
    noticeDeadline: contract.noticeDeadline?.toISOString() ?? null,
    lastSecurityReviewDate: contract.lastSecurityReviewDate?.toISOString() ?? null,
    createdAt: contract.createdAt.toISOString(),
    updatedAt: contract.updatedAt.toISOString(),
  }

  return (
    <AppLayout>
      <Header title={`Edit: ${contract.productName}`} description={`Update contract details`} />
      <div className="p-6 max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <ContractForm contract={serialized as never} vendors={vendors} />
        </div>
      </div>
    </AppLayout>
  )
}
