'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, CalendarCheck, CalendarDays, HelpCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { formatDate, formatCurrency, cn, daysUntilLabel } from '@/lib/utils'
import { StatusBadge } from '../ui/Badge'
import type { RenewalItem } from '@/types'

interface BucketProps {
  title: string
  description: string
  items: RenewalItem[]
  icon: React.ReactNode
  emptyMessage: string
  urgencyClass: {
    header: string
    count: string
    row: string
  }
  defaultExpanded?: boolean
}

function Bucket({ title, description, items, icon, emptyMessage, urgencyClass, defaultExpanded = true }: BucketProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors',
          urgencyClass.header
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{title}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', urgencyClass.count)}>
                {items.length}
              </span>
            </div>
            <p className="text-xs opacity-75">{description}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 opacity-60" /> : <ChevronDown className="h-4 w-4 opacity-60" />}
      </button>

      {expanded && (
        <div>
          {items.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 italic">{emptyMessage}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <RenewalRow key={item.contract.id} item={item} urgencyRowClass={urgencyClass.row} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RenewalRow({ item, urgencyRowClass }: { item: RenewalItem; urgencyRowClass: string }) {
  const { contract, vendor, daysUntilRenewal, daysUntilNotice } = item
  const noticeExpired = daysUntilNotice !== null && daysUntilNotice < 0

  return (
    <Link
      href={`/contracts/${contract.id}`}
      className={cn(
        'flex items-start gap-4 px-5 py-3 hover:bg-gray-50 transition-colors',
        urgencyRowClass
      )}
    >
      {/* Urgency indicator strip */}
      <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0 w-16 text-center">
        <span className="text-sm font-bold leading-tight">
          {daysUntilRenewal !== null ? Math.abs(daysUntilRenewal) : '—'}
        </span>
        <span className="text-xs text-gray-500 leading-tight">
          {daysUntilRenewal === null ? 'no date' :
           daysUntilRenewal < 0 ? 'days over' :
           daysUntilRenewal === 0 ? 'today' : 'days'}
        </span>
      </div>

      {/* Contract info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-gray-900 truncate">{contract.productName}</span>
              {contract.autoRenew && (
                <RefreshCw className="h-3 w-3 text-blue-400 flex-shrink-0" aria-label="Auto-renew" />
              )}
            </div>
            <span className="text-xs text-gray-500">{vendor.name}</span>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {contract.renewalDate && (
            <span>Renewal: {formatDate(contract.renewalDate)}</span>
          )}
          {contract.noticeDeadline && (
            <span className={cn(noticeExpired && 'text-red-600 font-medium')}>
              {noticeExpired ? '⚠ Notice expired' : `Notice by: ${formatDate(contract.noticeDeadline)}`}
            </span>
          )}
          {contract.internalOwner && <span>Owner: {contract.internalOwner}</span>}
          {contract.department && <span>{contract.department}</span>}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <StatusBadge status={contract.status} />
        {contract.cost != null && (
          <span className="text-xs text-gray-500">{formatCurrency(contract.cost)}</span>
        )}
      </div>
    </Link>
  )
}

interface RenewalsBucketsProps {
  buckets: {
    overdue: RenewalItem[]
    within30: RenewalItem[]
    within90: RenewalItem[]
    beyond90: RenewalItem[]
    noDate: RenewalItem[]
  }
}

export function RenewalsBuckets({ buckets }: RenewalsBucketsProps) {
  return (
    <div className="space-y-4">
      <Bucket
        title="Overdue"
        description="Renewal date has passed — action required"
        items={buckets.overdue}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        emptyMessage="No overdue renewals. Good."
        urgencyClass={{
          header: 'bg-red-50 text-red-800 hover:bg-red-100',
          count: 'bg-red-600 text-white',
          row: 'border-l-2 border-red-300',
        }}
      />

      <Bucket
        title="Due within 30 days"
        description="Immediate attention required"
        items={buckets.within30}
        icon={<Clock className="h-5 w-5 text-orange-600" />}
        emptyMessage="No renewals due in the next 30 days."
        urgencyClass={{
          header: 'bg-orange-50 text-orange-800 hover:bg-orange-100',
          count: 'bg-orange-600 text-white',
          row: 'border-l-2 border-orange-300',
        }}
      />

      <Bucket
        title="Due within 90 days"
        description="Review and plan renewals in this window"
        items={buckets.within90}
        icon={<CalendarCheck className="h-5 w-5 text-amber-600" />}
        emptyMessage="No renewals due in the 31–90 day window."
        urgencyClass={{
          header: 'bg-amber-50 text-amber-800 hover:bg-amber-100',
          count: 'bg-amber-500 text-white',
          row: '',
        }}
      />

      <Bucket
        title="Beyond 90 days"
        description="On track — review at 90-day mark"
        items={buckets.beyond90}
        icon={<CalendarDays className="h-5 w-5 text-green-600" />}
        emptyMessage="No contracts with renewal dates beyond 90 days."
        defaultExpanded={false}
        urgencyClass={{
          header: 'bg-green-50 text-green-800 hover:bg-green-100',
          count: 'bg-green-600 text-white',
          row: '',
        }}
      />

      <Bucket
        title="No Renewal Date"
        description="These contracts are missing renewal date information"
        items={buckets.noDate}
        icon={<HelpCircle className="h-5 w-5 text-gray-500" />}
        emptyMessage="All contracts have renewal dates set."
        defaultExpanded={false}
        urgencyClass={{
          header: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          count: 'bg-gray-500 text-white',
          row: '',
        }}
      />
    </div>
  )
}
