'use client'

import { formatDateTime } from '@/lib/utils'
import type { ActivityLogEntry } from '@/types'
import { cn } from '@/lib/utils'

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'text-green-700 bg-green-50 border-green-200' },
  updated: { label: 'Updated', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  status_changed: { label: 'Status changed', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  deleted: { label: 'Deleted', color: 'text-red-700 bg-red-50 border-red-200' },
  archived: { label: 'Archived', color: 'text-gray-700 bg-gray-50 border-gray-200' },
  imported: { label: 'Imported', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  exported: { label: 'Exported', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
}

interface ActivityLogProps {
  entries: ActivityLogEntry[]
  className?: string
}

export function ActivityLog({ entries, className }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {entries.map((entry) => {
        const config = ACTION_CONFIG[entry.action] ?? { label: entry.action, color: 'text-gray-700 bg-gray-50 border-gray-200' }
        const changedFields = (entry.metadata as Record<string, unknown> | null)?.changedFields as string[] | undefined

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              <div className="w-px flex-1 bg-gray-200 mt-1" />
            </div>

            <div className="pb-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium',
                    config.color
                  )}
                >
                  {config.label}
                </span>
                <span className="text-xs text-gray-500">
                  {entry.userName ?? entry.userEmail ?? 'System'}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>

              {changedFields && changedFields.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Changed: {changedFields.join(', ')}
                </p>
              )}

              {/* Status change detail */}
              {entry.action === 'status_changed' && entry.beforeState != null && entry.afterState != null ? (
                <p className="mt-1 text-xs text-gray-600">
                  {entry.beforeState.status as string} →{' '}
                  {entry.afterState.status as string}
                </p>
              ) : null}

              {/* Notes from metadata */}
              {(entry.metadata as Record<string, unknown> | null)?.note && (
                <p className="mt-1 text-xs text-gray-600 italic">
                  {(entry.metadata as Record<string, unknown>).note as string}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
