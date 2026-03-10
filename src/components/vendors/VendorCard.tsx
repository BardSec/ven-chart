'use client'

import Link from 'next/link'
import { Building2, ChevronRight, AlertTriangle } from 'lucide-react'
import { Badge, UrgencyBadge } from '../ui/Badge'
import { formatDate, daysUntil, truncate } from '@/lib/utils'
import type { Vendor } from '@/types'

interface VendorCardProps {
  vendor: Vendor & {
    _count?: { contracts: number }
    contracts?: Array<{ renewalDate: string | null; status: string }>
  }
}

export function VendorCard({ vendor }: VendorCardProps) {
  const nearestRenewal = vendor.contracts?.[0]?.renewalDate ?? null
  const nearestDays = daysUntil(nearestRenewal)
  const activeCount = vendor._count?.contracts ?? 0

  // Flags for operational concerns
  const hasNearRenewal = nearestDays !== null && nearestDays <= 30

  return (
    <Link
      href={`/vendors/${vendor.id}`}
      className="group block rounded-lg border border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{vendor.name}</h3>
              {hasNearRenewal && (
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" aria-label="Renewal due soon" />
              )}
            </div>
            {vendor.primaryContactName && (
              <p className="text-xs text-gray-500 truncate">{vendor.primaryContactName}</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-brand-500 mt-1" />
      </div>

      {/* Tags */}
      {vendor.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {vendor.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" size="sm">
              {tag}
            </Badge>
          ))}
          {vendor.tags.length > 4 && (
            <Badge variant="secondary" size="sm">+{vendor.tags.length - 4}</Badge>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {activeCount} active contract{activeCount !== 1 ? 's' : ''}
        </span>
        {nearestRenewal ? (
          <div className="flex items-center gap-1.5">
            <span>Next renewal:</span>
            <UrgencyBadge days={nearestDays} />
          </div>
        ) : (
          <span className="text-gray-400">No upcoming renewals</span>
        )}
      </div>
    </Link>
  )
}
