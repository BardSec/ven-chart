// GET /api/export — export all application data as JSON

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, isAuthError } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { EXPORT_SCHEMA_VERSION } from '@/types'

export async function GET() {
  const user = await requireRole('ADMIN')
  if (isAuthError(user)) return user

  const [vendors, contracts, attachments] = await Promise.all([
    prisma.vendor.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.contract.findMany({
      orderBy: [{ vendorId: 'asc' }, { productName: 'asc' }],
    }),
    prisma.attachment.findMany({
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const exportPayload = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: user.email,
    counts: {
      vendors: vendors.length,
      contracts: contracts.length,
      attachments: attachments.length,
    },
    vendors,
    contracts,
    attachments,
  }

  await logActivity({
    entityType: 'export',
    action: 'exported',
    user,
    metadata: {
      counts: exportPayload.counts,
      exportedAt: exportPayload.exportedAt,
    },
  })

  const filename = `ven-chart-export-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
