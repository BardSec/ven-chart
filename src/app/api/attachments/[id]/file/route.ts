// GET /api/attachments/[id]/file — redirect to a presigned R2 download URL

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/permissions'
import { s3Enabled, createPresignedDownloadUrl, keyFromUrl } from '@/lib/s3'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } })
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  if (!s3Enabled || !attachment.url) {
    return NextResponse.json({ error: 'File storage not available' }, { status: 503 })
  }

  const key = keyFromUrl(attachment.url)
  if (!key) {
    return NextResponse.json({ error: 'Could not resolve file key' }, { status: 400 })
  }

  const signedUrl = await createPresignedDownloadUrl(key)
  return NextResponse.redirect(signedUrl)
}
