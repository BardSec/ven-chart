// GET /api/dashboard — returns aggregate stats for the dashboard

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/permissions'

export async function GET() {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const [
    totalVendors,
    totalActiveContracts,
    renewalsDue30,
    renewalsDue90,
    overdueRenewals,
    missingOwner,
    missingRenewalDate,
    missingNoticeDeadline,
    autoRenewWithoutNotice,
    totalAnnualValueResult,
    recentVendors,
    recentContracts,
  ] = await Promise.all([
    // Total active vendors
    prisma.vendor.count({ where: { isArchived: false } }),

    // Total active contracts
    prisma.contract.count({
      where: { isArchived: false, status: { notIn: ['ARCHIVED', 'EXPIRED'] } },
    }),

    // Renewals due in 30 days
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED', 'NON_RENEWING'] },
        renewalDate: { gte: now, lte: in30 },
      },
    }),

    // Renewals due in 90 days (including the 30-day window)
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED', 'NON_RENEWING'] },
        renewalDate: { gte: now, lte: in90 },
      },
    }),

    // Overdue renewals
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED', 'NON_RENEWING'] },
        renewalDate: { lt: now },
      },
    }),

    // Missing owner
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED'] },
        internalOwner: null,
      },
    }),

    // Missing renewal date
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED'] },
        renewalDate: null,
      },
    }),

    // Missing notice deadline (has renewal date but no notice deadline)
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED'] },
        renewalDate: { not: null },
        noticeDeadline: null,
      },
    }),

    // Auto-renew without notice deadline set
    prisma.contract.count({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED'] },
        autoRenew: true,
        noticeDeadline: null,
      },
    }),

    // Total annual cost of active contracts
    prisma.contract.aggregate({
      where: {
        isArchived: false,
        status: { notIn: ['ARCHIVED', 'EXPIRED'] },
        cost: { not: null },
      },
      _sum: { cost: true },
    }),

    // Recently updated vendors
    prisma.vendor.findMany({
      where: { isArchived: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, updatedAt: true },
    }),

    // Recently updated contracts
    prisma.contract.findMany({
      where: { isArchived: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, productName: true, updatedAt: true },
    }),
  ])

  // Merge and sort recently updated
  const recentlyUpdated = [
    ...recentVendors.map((v) => ({ type: 'vendor' as const, id: v.id, name: v.name, updatedAt: v.updatedAt.toISOString() })),
    ...recentContracts.map((c) => ({
      type: 'contract' as const,
      id: c.id,
      name: c.productName,
      updatedAt: c.updatedAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)

  return NextResponse.json({
    data: {
      totalVendors,
      totalActiveContracts,
      renewalsDue30,
      renewalsDue90,
      overdueRenewals,
      missingOwner,
      missingRenewalDate,
      missingNoticeDeadline,
      autoRenewWithoutNotice,
      totalAnnualValue: Number(totalAnnualValueResult._sum.cost ?? 0),
      recentlyUpdated,
    },
  })
}
