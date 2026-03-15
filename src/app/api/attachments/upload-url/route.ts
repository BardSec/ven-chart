// POST /api/attachments/upload-url — return a presigned PUT URL for direct-to-R2 upload

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAuthError, canCreateOrEdit } from '@/lib/permissions'
import { createPresignedUploadUrl, s3Enabled } from '@/lib/s3'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const schema = z.object({
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(200),
  fileSize: z.number().int().positive().max(50 * 1024 * 1024), // 50 MB cap
})

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canCreateOrEdit(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  if (!s3Enabled) {
    return NextResponse.json({ error: 'File storage is not configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 422 })
  }

  const { fileName, mimeType } = result.data
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : ''
  const key = `attachments/${randomUUID()}${ext}`

  const uploadUrl = await createPresignedUploadUrl(key, mimeType)

  // The public URL (after upload completes) — R2 endpoint style
  const publicUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${key}`

  return NextResponse.json({ uploadUrl, publicUrl, key })
}
