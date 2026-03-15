// POST /api/attachments — create attachment (URL link or uploaded file)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError, canCreateOrEdit } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { attachmentSchema } from '@/lib/validations'

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

  const result = attachmentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 422 })
  }

  const data = result.data

  // Verify parent exists
  if (data.parentType === 'vendor') {
    const vendor = await prisma.vendor.findUnique({ where: { id: data.parentId } })
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  } else {
    const contract = await prisma.contract.findUnique({ where: { id: data.parentId } })
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const attachment = await prisma.attachment.create({
    data: {
      parentType: data.parentType,
      parentId: data.parentId,
      title: data.title,
      url: data.url,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      vendorId: data.parentType === 'vendor' ? data.parentId : null,
      contractId: data.parentType === 'contract' ? data.parentId : null,
    },
  })

  await logActivity({
    entityType: 'attachment',
    entityId: attachment.id,
    entityName: attachment.title,
    action: 'created',
    user,
    afterState: { title: attachment.title, url: attachment.url },
    vendorId: data.parentType === 'vendor' ? data.parentId : undefined,
    contractId: data.parentType === 'contract' ? data.parentId : undefined,
  })

  return NextResponse.json({ data: attachment }, { status: 201 })
}
