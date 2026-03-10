// GET /api/renewals — returns contracts with renewal data for the renewals dashboard

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/permissions'
import { differenceInCalendarDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const { searchParams } = request.nextUrl
  const department = searchParams.get('department')
  const internalOwner = searchParams.get('internalOwner')
  const statusParam = searchParams.getAll('status')

  const contracts = await prisma.contract.findMany({
    where: {
      isArchived: false,
      status: {
        notIn: ['ARCHIVED'],
        ...(statusParam.length > 0 ? { in: statusParam as never[] } : {}),
      },
      ...(department && { department: { contains: department, mode: 'insensitive' } }),
      ...(internalOwner && { internalOwner: { contains: internalOwner, mode: 'insensitive' } }),
    },
    include: {
      vendor: {
        select: { id: true, name: true, tags: true },
      },
    },
    orderBy: [{ renewalDate: 'asc' }, { productName: 'asc' }],
  })

  const now = new Date()

  const enriched = contracts.map((contract) => {
    const daysUntilRenewal = contract.renewalDate
      ? differenceInCalendarDays(contract.renewalDate, now)
      : null

    const daysUntilNotice = contract.noticeDeadline
      ? differenceInCalendarDays(contract.noticeDeadline, now)
      : null

    let urgency: 'overdue' | 'critical' | 'warning' | 'ok' | 'unknown'
    if (daysUntilRenewal === null) {
      urgency = 'unknown'
    } else if (daysUntilRenewal < 0) {
      urgency = 'overdue'
    } else if (daysUntilRenewal <= 30) {
      urgency = 'critical'
    } else if (daysUntilRenewal <= 90) {
      urgency = 'warning'
    } else {
      urgency = 'ok'
    }

    return {
      contract,
      vendor: contract.vendor,
      daysUntilRenewal,
      daysUntilNotice,
      urgency,
    }
  })

  // Group into buckets
  const buckets = {
    overdue: enriched.filter((r) => r.urgency === 'overdue'),
    within30: enriched.filter((r) => r.urgency === 'critical'),
    within90: enriched.filter((r) => r.urgency === 'warning'),
    beyond90: enriched.filter((r) => r.urgency === 'ok'),
    noDate: enriched.filter((r) => r.urgency === 'unknown'),
  }

  return NextResponse.json({ data: enriched, buckets })
}
