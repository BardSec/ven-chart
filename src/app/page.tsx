'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/Button'
import { CardSkeleton, ErrorState } from '@/components/ui/EmptyState'
import {
  AlertTriangle, Clock, CalendarCheck, Users, FileText,
  Building2, DollarSign, RefreshCw, Link as LinkIcon, ArrowRight
} from 'lucide-react'
import { formatCurrency, formatDateTime, daysUntil } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      const data = await res.json()
      setStats(data.data)
    } catch {
      setError('Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  return (
    <AppLayout>
      <Header
        title="Dashboard"
        description="Operational overview of vendors and contracts"
        actions={
          <Button variant="ghost" size="sm" onClick={loadStats}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadStats} />
        ) : stats ? (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                title="Active Vendors"
                value={stats.totalVendors}
                icon={<Building2 className="h-5 w-5" />}
                href="/vendors"
              />
              <StatCard
                title="Active Contracts"
                value={stats.totalActiveContracts}
                icon={<FileText className="h-5 w-5" />}
                href="/contracts"
              />
              <StatCard
                title="Annual Value"
                value={formatCurrency(stats.totalAnnualValue, { compact: true })}
                icon={<DollarSign className="h-5 w-5" />}
                variant="neutral"
              />
              <StatCard
                title="Renewals (90 days)"
                value={stats.renewalsDue90}
                icon={<CalendarCheck className="h-5 w-5" />}
                href="/renewals"
                variant={stats.renewalsDue90 > 0 ? 'warning' : 'success'}
              />
            </div>

            {/* Alerts row */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Action Items
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatCard
                  title="Overdue Renewals"
                  value={stats.overdueRenewals}
                  description="Renewal date passed"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  href="/renewals"
                  variant={stats.overdueRenewals > 0 ? 'danger' : 'neutral'}
                />
                <StatCard
                  title="Due in 30 Days"
                  value={stats.renewalsDue30}
                  description="Immediate attention"
                  icon={<Clock className="h-5 w-5" />}
                  href="/renewals"
                  variant={stats.renewalsDue30 > 0 ? 'warning' : 'neutral'}
                />
                <StatCard
                  title="Missing Owner"
                  value={stats.missingOwner}
                  description="No internal owner assigned"
                  icon={<Users className="h-5 w-5" />}
                  href="/contracts?missingOwner=true"
                  variant={stats.missingOwner > 0 ? 'warning' : 'neutral'}
                />
                <StatCard
                  title="Missing Renewal Date"
                  value={stats.missingRenewalDate}
                  description="Renewal tracking incomplete"
                  icon={<CalendarCheck className="h-5 w-5" />}
                  href="/contracts?missingRenewalDate=true"
                  variant={stats.missingRenewalDate > 0 ? 'warning' : 'neutral'}
                />
                <StatCard
                  title="No Notice Deadline"
                  value={stats.missingNoticeDeadline}
                  description="Has renewal date but no notice"
                  icon={<Clock className="h-5 w-5" />}
                  href="/contracts?missingNoticeDeadline=true"
                  variant={stats.missingNoticeDeadline > 0 ? 'warning' : 'neutral'}
                />
                <StatCard
                  title="Auto-Renew / No Notice"
                  value={stats.autoRenewWithoutNotice}
                  description="Auto-renew on, notice date missing"
                  icon={<RefreshCw className="h-5 w-5" />}
                  href="/contracts?autoRenew=true&missingNoticeDeadline=true"
                  variant={stats.autoRenewWithoutNotice > 0 ? 'warning' : 'neutral'}
                />
              </div>
            </div>

            {/* Recently updated */}
            {stats.recentlyUpdated.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Recently Updated
                  </h2>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {stats.recentlyUpdated.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <Link
                          href={`/${item.type === 'vendor' ? 'vendors' : 'contracts'}/${item.id}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600 flex-shrink-0">
                            {item.type === 'vendor' ? (
                              <Building2 className="h-3.5 w-3.5" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDateTime(item.updatedAt)}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
