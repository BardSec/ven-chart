// GET /api/vendors/[id]
// PUT /api/vendors/[id]
// DELETE /api/vendors/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError, canCreateOrEdit, canDelete, canEditRecord } from '@/lib/permissions'
import { logActivity, computeDiff, sanitizeForLog } from '@/lib/activity-log'
import { vendorSchema } from '@/lib/validations'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      contracts: {
        where: { isArchived: false },
        orderBy: [{ status: 'asc' }, { renewalDate: 'asc' }],
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
      },
      activityLogs: {
        orderBy: { timestamp: 'desc' },
        take: 50,
      },
      _count: {
        select: { contracts: true },
      },
    },
  })

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  return NextResponse.json({ data: vendor })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canCreateOrEdit(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const existing = await prisma.vendor.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  // DEPARTMENT_OWNER check — vendors don't have department, so they need EDITOR or higher
  if (!canEditRecord(user, {})) {
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
  const beforeState = sanitizeForLog({ ...existing } as Record<string, unknown>)

  const vendor = await prisma.vendor.update({
    where: { id: params.id },
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

  const afterState = sanitizeForLog({ ...vendor } as Record<string, unknown>)
  const { changedFields } = computeDiff(beforeState, afterState)

  if (changedFields.length > 0) {
    await logActivity({
      entityType: 'vendor',
      entityId: vendor.id,
      entityName: vendor.name,
      action: 'updated',
      user,
      beforeState,
      afterState,
      metadata: { changedFields },
      vendorId: vendor.id,
    })
  }

  return NextResponse.json({ data: vendor })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canDelete(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions — only Admins can delete vendors' }, { status: 403 })
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { _count: { select: { contracts: true } } },
  })

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  // Safety check — warn if vendor has active contracts
  if (vendor._count.contracts > 0) {
    const { searchParams } = request.nextUrl
    const force = searchParams.get('force') === 'true'
    if (!force) {
      return NextResponse.json(
        {
          error: 'Vendor has associated contracts',
          message: `This vendor has ${vendor._count.contracts} contract(s). Add ?force=true to delete anyway, or archive the vendor instead.`,
          contractCount: vendor._count.contracts,
        },
        { status: 409 }
      )
    }
  }

  await logActivity({
    entityType: 'vendor',
    entityId: vendor.id,
    entityName: vendor.name,
    action: 'deleted',
    user,
    beforeState: sanitizeForLog({ name: vendor.name, id: vendor.id } as Record<string, unknown>),
  })

  await prisma.vendor.delete({ where: { id: params.id } })

  return NextResponse.json({ data: { id: params.id } })
}
