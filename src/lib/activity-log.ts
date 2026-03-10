// Activity log utility — records meaningful operational events

import { prisma } from './prisma'
import type { SessionUser } from './permissions'

interface LogOptions {
  entityType: string
  entityId?: string
  entityName?: string
  action: string
  user: SessionUser | null
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  // Optionally link to vendor/contract for indexed queries
  vendorId?: string
  contractId?: string
}

export async function logActivity(opts: LogOptions): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        entityType: opts.entityType,
        entityId: opts.entityId,
        entityName: opts.entityName,
        userId: opts.user?.id,
        userEmail: opts.user?.email,
        userName: opts.user?.name,
        action: opts.action,
        beforeState: opts.beforeState ?? undefined,
        afterState: opts.afterState ?? undefined,
        metadata: opts.metadata ?? undefined,
        vendorId: opts.vendorId,
        contractId: opts.contractId,
      },
    })
  } catch (err) {
    // Activity log failures should never break the main operation
    console.error('[ActivityLog] Failed to write log entry:', err)
  }
}

/**
 * Compute a diff of changed fields between two objects.
 * Returns an object with only the keys that changed.
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { before: Record<string, unknown>; after: Record<string, unknown>; changedFields: string[] } {
  const changedFields: string[] = []
  const diffBefore: Record<string, unknown> = {}
  const diffAfter: Record<string, unknown> = {}

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    const beforeVal = before[key]
    const afterVal = after[key]

    // Skip internal/computed fields
    if (['updatedAt', 'createdAt'].includes(key)) continue

    // Simple deep comparison for primitives and JSON
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changedFields.push(key)
      diffBefore[key] = beforeVal
      diffAfter[key] = afterVal
    }
  }

  return { before: diffBefore, after: diffAfter, changedFields }
}

/**
 * Strip sensitive or excessively large fields before logging
 */
export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['password', 'secret', 'token', 'access_token', 'refresh_token']
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      result[key] = '[redacted]'
    } else if (typeof value === 'string' && value.length > 2000) {
      result[key] = value.slice(0, 2000) + '...[truncated]'
    } else {
      result[key] = value
    }
  }

  return result
}
