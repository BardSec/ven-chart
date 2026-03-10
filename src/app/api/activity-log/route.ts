// GET /api/activity-log — retrieve audit log entries

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const { searchParams } = request.nextUrl
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const logs = await prisma.activityLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  })

  const total = await prisma.activityLog.count({
    where: {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    },
  })

  return NextResponse.json({ data: logs, total, limit, offset })
}
