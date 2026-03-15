'use client'

import Link from 'next/link'
import { FileText, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '../ui/Badge'
import { formatDate, formatCurrency, daysUntil, cn } from '@/lib/utils'
import type { Contract, Vendor } from '@/types'

interface ContractCardProps {
  contract: Contract & { vendor?: Pick<Vendor, 'id' | 'name'> }
  showVendor?: boolean
}

export function ContractCard({ contract, showVendor = true }: ContractCardProps) {
  const renewalDays = daysUntil(contract.renewalDate)
  const noticeDays = daysUntil(contract.noticeDeadline)

  const isUrgent = renewalDays !== null && renewalDays <= 30
  const noticeExpired = noticeDays !== null && noticeDays < 0

  return (
    <Link
      href={`/contracts/${contract.id}`}
      className={cn(
        'group block rounded-lg border bg-white p-4 hover:shadow-sm transition-all',
        isUrgent ? 'border-orange-200 hover:border-orange-300' : 'border-gray-200 hover:border-brand-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
            isUrgent ? 'bg-orange-50 text-orange-600' : 'bg-brand-50 text-brand-600'
          )}>
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{contract.productName}</h3>
              {contract.autoRenew && (
                <span title="Auto-renew enabled">
                  <RefreshCw className="h-3 w-3 text-blue-400" aria-label="Auto-renew" />
                </span>
              )}
              {noticeExpired && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" aria-label="Notice deadline passed" />
              )}
            </div>
            {showVendor && contract.vendor && (
              <p className="text-xs text-gray-500 truncate">{contract.vendor.name}</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-brand-500 mt-1" />
      </div>

      {/* Key details row */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Renewal:</span>
          {contract.renewalDate ? (
            <UrgencyBadge days={renewalDays} />
          ) : (
            <span className="text-gray-400 italic">Not set</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-400">Status:</span>
          <StatusBadge status={contract.status} />
        </div>

        {contract.noticeDeadline && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Notice by:</span>
            <span className={cn(
              'font-medium',
              noticeExpired ? 'text-red-600' : 'text-gray-700'
            )}>
              {formatDate(contract.noticeDeadline)}
            </span>
          </div>
        )}

        {contract.cost != null && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Cost:</span>
            <span className="font-medium text-gray-700">{formatCurrency(contract.cost)}</span>
          </div>
        )}

        {contract.internalOwner && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Owner:</span>
            <span className="text-gray-700 truncate">{contract.internalOwner}</span>
          </div>
        )}

        {contract.softwareManager && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">SW Mgr:</span>
            <span className="text-gray-700 truncate">{contract.softwareManager}</span>
          </div>
        )}

        {contract.department && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Dept:</span>
            <span className="text-gray-700 truncate">{contract.department}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
