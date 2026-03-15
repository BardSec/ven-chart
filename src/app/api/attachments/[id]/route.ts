// DELETE /api/attachments/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError, canCreateOrEdit } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { s3Enabled, deleteObject, keyFromUrl } from '@/lib/s3'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canCreateOrEdit(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } })
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  await logActivity({
    entityType: 'attachment',
    entityId: attachment.id,
    entityName: attachment.title,
    action: 'deleted',
    user,
    beforeState: { title: attachment.title, url: attachment.url },
    vendorId: attachment.vendorId ?? undefined,
    contractId: attachment.contractId ?? undefined,
  })

  await prisma.attachment.delete({ where: { id: params.id } })

  // Delete the object from R2 if this was an uploaded file
  if (s3Enabled && attachment.url) {
    const key = keyFromUrl(attachment.url)
    if (key) {
      try { await deleteObject(key) } catch { /* best-effort */ }
    }
  }

  return NextResponse.json({ data: { id: params.id } })
}
