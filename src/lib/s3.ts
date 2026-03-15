// S3-compatible client for Cloudflare R2 file storage

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const isConfigured =
  !!process.env.S3_ENDPOINT &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY &&
  !!process.env.S3_BUCKET_NAME

export const s3Enabled = isConfigured

let _client: S3Client | null = null

function getClient(): S3Client {
  if (!_client) {
    if (!isConfigured) throw new Error('S3 storage is not configured')
    _client = new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _client
}

/** Generate a presigned PUT URL. Expires in 5 minutes. */
export async function createPresignedUploadUrl(key: string, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: mimeType,
  })
  return getSignedUrl(getClient(), command, { expiresIn: 300 })
}

/** Delete an object from the bucket by key. */
export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  }))
}

/** Extract the object key from an R2 public URL (or presigned URL). */
export function keyFromUrl(url: string): string | null {
  try {
    const endpoint = process.env.S3_ENDPOINT
    if (!endpoint) return null
    const endpointHost = new URL(endpoint).host
    const parsed = new URL(url)
    if (!parsed.host.endsWith(endpointHost)) return null
    // path is /<bucket>/<key> or just /<key> depending on endpoint style
    const parts = parsed.pathname.replace(/^\//, '').split('/')
    // R2 endpoint is account-level; bucket is first segment
    if (parts[0] === process.env.S3_BUCKET_NAME) return parts.slice(1).join('/')
    return parts.join('/')
  } catch {
    return null
  }
}
