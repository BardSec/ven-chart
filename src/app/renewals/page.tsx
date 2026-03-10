'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { RenewalsBuckets } from '@/components/renewals/RenewalsBuckets'
import { RenewalsCalendar } from '@/components/renewals/RenewalsCalendar'
import { Select } from '@/components/ui/FormField'
import { CardSkeleton, ErrorState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { List, CalendarDays, RefreshCw } from 'lucide-react'
import type { RenewalItem } from '@/types'
import { DEPARTMENTS } from '@/types'
import { cn } from '@/lib/utils'

type ViewMode = 'list' | 'calendar'

interface RenewalsResponse {
  data: RenewalItem[]
  buckets: {
    overdue: RenewalItem[]
    within30: RenewalItem[]
    within90: RenewalItem[]
    beyond90: RenewalItem[]
    noDate: RenewalItem[]
  }
}

export default function RenewalsPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [data, setData] = useState<RenewalsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [department, setDepartment] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadRenewals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (department) params.set('department', department)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/renewals?${params}`)
      if (!res.ok) throw new Error('Failed to load renewals')
      const json = await res.json()
      setData(json)
    } catch {
      setError('Could not load renewals.')
    } finally {
      setLoading(false)
    }
  }, [department, statusFilter])

  useEffect(() => { loadRenewals() }, [loadRenewals])

  const totalCount = data ? data.data.length : 0
  const actionableCount = data
    ? data.buckets.overdue.length + data.buckets.within30.length + data.buckets.within90.length
    : 0

  return (
    <AppLayout>
      <Header
        title="Renewals"
        description={loading ? '' : `${totalCount} contracts tracked · ${actionableCount} require attention within 90 days`}
        actions={
          <Button variant="ghost" size="sm" onClick={loadRenewals}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="p-6">
        {/* Controls */}
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="All departments"
              className="w-48"
            >
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
              className="w-44"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING_RENEWAL">Pending Renewal</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </Select>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'list' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <List className="h-4 w-4" />
              Priority List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'calendar' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadRenewals} />
        ) : !data ? null : view === 'list' ? (
          <RenewalsBuckets buckets={data.buckets} />
        ) : (
          <RenewalsCalendar items={data.data} />
        )}
      </div>
    </AppLayout>
  )
}
