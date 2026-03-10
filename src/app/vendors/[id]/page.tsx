'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { Badge, StatusBadge, UrgencyBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { AttachmentsList } from '@/components/AttachmentsList'
import { ActivityLog } from '@/components/ActivityLog'
import { ContractCard } from '@/components/contracts/ContractCard'
import { EmptyState, ErrorState, CardSkeleton } from '@/components/ui/EmptyState'
import {
  Building2, Edit, Archive, Trash2, Plus, Mail, Phone, Globe,
  FileText, AlertTriangle, ChevronRight
} from 'lucide-react'
import { formatDate, daysUntil, cn } from '@/lib/utils'
import type { Vendor, Contract, Attachment, ActivityLogEntry } from '@/types'
import { useSession } from 'next-auth/react'

type VendorDetail = Vendor & {
  contracts: Contract[]
  attachments: Attachment[]
  activityLogs: ActivityLogEntry[]
  _count: { contracts: number }
}

type ActiveTab = 'overview' | 'contracts' | 'procurement' | 'support' | 'compliance' | 'activity'

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const canEdit = session?.user?.role !== 'VIEWER'
  const isAdmin = session?.user?.role === 'ADMIN'

  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadVendor = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/vendors/${id}`)
      if (!res.ok) {
        if (res.status === 404) { setError('Vendor not found'); return }
        throw new Error('Failed to load vendor')
      }
      const data = await res.json()
      setVendor(data.data)
    } catch {
      setError('Could not load vendor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVendor() }, [id])

  const handleArchive = async () => {
    if (!vendor) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vendor, isArchived: !vendor.isArchived }),
      })
      if (res.ok) {
        await loadVendor()
        setArchiveOpen(false)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/vendors/${id}?force=true`, { method: 'DELETE' })
      if (res.ok) router.push('/vendors')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <AppLayout>
      <Header title="Loading..." />
      <div className="p-6 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </AppLayout>
  )

  if (error || !vendor) return (
    <AppLayout>
      <Header title="Vendor" />
      <div className="p-6">
        <ErrorState message={error || 'Vendor not found'} onRetry={loadVendor} />
      </div>
    </AppLayout>
  )

  const activeContracts = vendor.contracts.filter((c) => !c.isArchived && c.status !== 'ARCHIVED' && c.status !== 'EXPIRED')
  const nearestRenewal = activeContracts
    .filter((c) => c.renewalDate)
    .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime())[0]
  const nearestDays = daysUntil(nearestRenewal?.renewalDate)

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contracts', label: `Contracts (${activeContracts.length})` },
    { id: 'procurement', label: 'Procurement' },
    { id: 'support', label: 'Support' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <AppLayout>
      <Header
        title={vendor.name}
        description={vendor.isArchived ? 'Archived vendor' : `${activeContracts.length} active contract${activeContracts.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Link href={`/vendors/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArchiveOpen(true)}
                >
                  <Archive className="h-4 w-4" />
                  {vendor.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
              </>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6">
        {/* Top summary */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{vendor.name}</h2>
                {vendor.isArchived && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
              {vendor.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {vendor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              {nearestRenewal && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <span>Next renewal:</span>
                  <UrgencyBadge days={nearestDays} />
                  <span className="text-gray-400">{formatDate(nearestRenewal.renewalDate)}</span>
                  <span className="truncate font-medium text-gray-700">— {nearestRenewal.productName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Vendor tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Primary contact */}
                {(vendor.primaryContactName || vendor.primaryContactEmail || vendor.primaryContactPhone) && (
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Primary Contact</h3>
                    <dl className="space-y-2">
                      {vendor.primaryContactName && (
                        <div className="flex items-center gap-2 text-sm">
                          <dt className="text-gray-500 w-16 flex-shrink-0">Name</dt>
                          <dd className="font-medium text-gray-900">{vendor.primaryContactName}</dd>
                        </div>
                      )}
                      {vendor.primaryContactEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <dt className="text-gray-500 w-16 flex-shrink-0 flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email</dt>
                          <dd><a href={`mailto:${vendor.primaryContactEmail}`} className="text-brand-600 hover:underline">{vendor.primaryContactEmail}</a></dd>
                        </div>
                      )}
                      {vendor.primaryContactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <dt className="text-gray-500 w-16 flex-shrink-0 flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone</dt>
                          <dd><a href={`tel:${vendor.primaryContactPhone}`} className="text-brand-600 hover:underline">{vendor.primaryContactPhone}</a></dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* General notes */}
                {vendor.generalNotes && (
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">General Notes</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{vendor.generalNotes}</p>
                  </div>
                )}

                {/* Attachments */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <AttachmentsList
                    attachments={vendor.attachments.filter((a) => a.parentType === 'vendor')}
                    parentType="vendor"
                    parentId={id}
                    onAdd={(att) => setVendor((v) => v ? { ...v, attachments: [...v.attachments, att] } : v)}
                    onDelete={(attId) => setVendor((v) => v ? { ...v, attachments: v.attachments.filter((a) => a.id !== attId) } : v)}
                    readOnly={!canEdit}
                  />
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Contracts & Subscriptions</h3>
                  {canEdit && (
                    <Link href={`/contracts/new?vendorId=${id}`}>
                      <Button size="sm">
                        <Plus className="h-3.5 w-3.5" />
                        Add Contract
                      </Button>
                    </Link>
                  )}
                </div>
                {vendor.contracts.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-6 w-6" />}
                    title="No contracts yet"
                    description="Add a contract to start tracking renewals for this vendor."
                  />
                ) : (
                  <div className="space-y-3">
                    {vendor.contracts.map((contract) => (
                      <ContractCard key={contract.id} contract={contract} showVendor={false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'procurement' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Procurement Notes</h3>
                {vendor.procurementNotes ? (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{vendor.procurementNotes}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No procurement notes recorded.</p>
                )}
              </div>
            )}

            {activeTab === 'support' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Support Contact</h3>
                <dl className="space-y-2">
                  {vendor.supportContactName && (
                    <div className="flex items-center gap-2 text-sm">
                      <dt className="text-gray-500 w-20 flex-shrink-0">Name</dt>
                      <dd className="font-medium text-gray-900">{vendor.supportContactName}</dd>
                    </div>
                  )}
                  {vendor.supportContactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <dt className="text-gray-500 w-20 flex-shrink-0 flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email</dt>
                      <dd><a href={`mailto:${vendor.supportContactEmail}`} className="text-brand-600 hover:underline">{vendor.supportContactEmail}</a></dd>
                    </div>
                  )}
                  {vendor.supportContactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <dt className="text-gray-500 w-20 flex-shrink-0 flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone</dt>
                      <dd><a href={`tel:${vendor.supportContactPhone}`} className="text-brand-600 hover:underline">{vendor.supportContactPhone}</a></dd>
                    </div>
                  )}
                  {vendor.supportWebsite && (
                    <div className="flex items-center gap-2 text-sm">
                      <dt className="text-gray-500 w-20 flex-shrink-0 flex items-center gap-1"><Globe className="h-3.5 w-3.5" />Portal</dt>
                      <dd><a href={vendor.supportWebsite} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{vendor.supportWebsite}</a></dd>
                    </div>
                  )}
                </dl>
                {vendor.supportNotes && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Support Notes</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{vendor.supportNotes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity History</h3>
                <ActivityLog entries={vendor.activityLogs as ActivityLogEntry[]} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Active contracts</span>
                  <span className="font-semibold text-gray-900">{activeContracts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total contracts</span>
                  <span className="font-semibold text-gray-900">{vendor._count.contracts}</span>
                </div>
                {nearestRenewal && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Next renewal</span>
                    <UrgencyBadge days={nearestDays} />
                  </div>
                )}
              </div>
            </div>

            {/* Compliance flags from contracts */}
            {activeContracts.some((c) => c.studentDataInvolved) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="text-xs font-semibold text-amber-800">Student Data Involved</h4>
                </div>
                <p className="text-xs text-amber-700">
                  One or more contracts involve student data. Verify DPA is current.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title={vendor.isArchived ? 'Unarchive Vendor' : 'Archive Vendor'}
        message={
          vendor.isArchived
            ? `Restore "${vendor.name}" to active status?`
            : `Archive "${vendor.name}"? The vendor and its contracts will be hidden from default views but not deleted.`
        }
        confirmLabel={vendor.isArchived ? 'Unarchive' : 'Archive'}
        variant="warning"
        loading={actionLoading}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Permanently delete "${vendor.name}" and all associated records? This cannot be undone. Consider archiving instead.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={actionLoading}
      />
    </AppLayout>
  )
}
