// GET /api/vendors — list vendors
// POST /api/vendors — create vendor

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError, canCreateOrEdit } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { vendorSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const tags = searchParams.getAll('tags')
  const isArchived = searchParams.get('isArchived') === 'true'

  const vendors = await prisma.vendor.findMany({
    where: {
      isArchived,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { primaryContactName: { contains: search, mode: 'insensitive' } },
          { primaryContactEmail: { contains: search, mode: 'insensitive' } },
          { generalNotes: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ],
      }),
      ...(tags.length > 0 && { tags: { hasSome: tags } }),
    },
    include: {
      _count: { select: { contracts: { where: { isArchived: false, status: { not: 'ARCHIVED' } } } } },
      contracts: {
        where: {
          isArchived: false,
          status: { not: 'ARCHIVED' },
          renewalDate: { not: null },
        },
        select: { renewalDate: true, status: true },
        orderBy: { renewalDate: 'asc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ data: vendors })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canCreateOrEdit(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = vendorSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 422 })
  }

  const data = result.data

  const vendor = await prisma.vendor.create({
    data: {
      name: data.name,
      primaryContactName: data.primaryContactName ?? null,
      primaryContactEmail: data.primaryContactEmail || null,
      primaryContactPhone: data.primaryContactPhone ?? null,
      generalNotes: data.generalNotes ?? null,
      tags: data.tags ?? [],
      procurementNotes: data.procurementNotes ?? null,
      supportContactName: data.supportContactName ?? null,
      supportContactEmail: data.supportContactEmail || null,
      supportContactPhone: data.supportContactPhone ?? null,
      supportWebsite: data.supportWebsite || null,
      supportNotes: data.supportNotes ?? null,
      isArchived: data.isArchived ?? false,
    },
  })

  await logActivity({
    entityType: 'vendor',
    entityId: vendor.id,
    entityName: vendor.name,
    action: 'created',
    user,
    afterState: { name: vendor.name },
    vendorId: vendor.id,
  })

  return NextResponse.json({ data: vendor }, { status: 201 })
}
