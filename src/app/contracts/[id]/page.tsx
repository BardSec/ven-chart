'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { StatusBadge, UrgencyBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { AttachmentsList } from '@/components/AttachmentsList'
import { ActivityLog } from '@/components/ActivityLog'
import { EmptyState, ErrorState, CardSkeleton } from '@/components/ui/EmptyState'
import {
  Edit, Archive, Trash2, Building2, RefreshCw, AlertTriangle,
  DollarSign, Calendar, User, FileText, Shield, CheckCircle, XCircle, Minus
} from 'lucide-react'
import { formatDate, formatCurrency, daysUntil, daysUntilLabel, cn, STATUS_CONFIG } from '@/lib/utils'
import type { Contract, Vendor, Attachment, ActivityLogEntry } from '@/types'
import { CONTRACT_TYPES, BILLING_MODELS, PROCUREMENT_METHODS } from '@/types'
import { useSession } from 'next-auth/react'

type ContractDetail = Contract & {
  vendor: Vendor
  attachments: Attachment[]
  activityLogs: ActivityLogEntry[]
}

type ActiveTab = 'details' | 'financial' | 'compliance' | 'activity'

function TristateBadge({ value, label }: { value: boolean | null | undefined; label: string }) {
  if (value === true) return (
    <span className="flex items-center gap-1.5 text-sm text-green-700">
      <CheckCircle className="h-4 w-4 text-green-500" />{label}: Yes
    </span>
  )
  if (value === false) return (
    <span className="flex items-center gap-1.5 text-sm text-red-700">
      <XCircle className="h-4 w-4 text-red-500" />{label}: No
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-sm text-gray-400">
      <Minus className="h-4 w-4" />{label}: Not set
    </span>
  )
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const canEdit = session?.user?.role !== 'VIEWER'
  const isAdmin = session?.user?.role === 'ADMIN'

  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('details')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadContract = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/contracts/${id}`)
      if (!res.ok) {
        if (res.status === 404) { setError('Contract not found'); return }
        throw new Error('Failed to load contract')
      }
      const data = await res.json()
      setContract(data.data)
    } catch {
      setError('Could not load contract.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadContract() }, [id])

  const handleArchive = async () => {
    if (!contract) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contract,
          vendorId: contract.vendorId,
          isArchived: !contract.isArchived,
          status: !contract.isArchived ? 'ARCHIVED' : contract.status,
          cost: contract.cost,
          totalContractValue: contract.totalContractValue,
          startDate: contract.startDate,
          renewalDate: contract.renewalDate,
          noticeDeadline: contract.noticeDeadline,
          lastSecurityReviewDate: contract.lastSecurityReviewDate,
        }),
      })
      if (res.ok) { await loadContract(); setArchiveOpen(false) }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/contracts')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <AppLayout>
      <Header title="Loading..." />
      <div className="p-6 space-y-4"><CardSkeleton /><CardSkeleton /></div>
    </AppLayout>
  )

  if (error || !contract) return (
    <AppLayout>
      <Header title="Contract" />
      <div className="p-6"><ErrorState message={error || 'Contract not found'} onRetry={loadContract} /></div>
    </AppLayout>
  )

  const renewalDays = daysUntil(contract.renewalDate)
  const noticeDays = daysUntil(contract.noticeDeadline)
  const noticeExpired = noticeDays !== null && noticeDays < 0
  const contractTypeLabel = CONTRACT_TYPES.find((t) => t.value === contract.contractType)?.label ?? contract.contractType
  const billingLabel = BILLING_MODELS.find((b) => b.value === contract.billingModel)?.label ?? contract.billingModel
  const procurementLabel = PROCUREMENT_METHODS.find((m) => m.value === contract.procurementMethod)?.label ?? contract.procurementMethod

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'financial', label: 'Financial & Procurement' },
    { id: 'compliance', label: 'Compliance / Risk' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <AppLayout>
      <Header
        title={contract.productName}
        description={contract.vendor.name}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Link href={`/contracts/${id}/edit`}>
                  <Button variant="outline" size="sm"><Edit className="h-4 w-4" />Edit</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setArchiveOpen(true)}>
                  <Archive className="h-4 w-4" />
                  {contract.isArchived ? 'Unarchive' : 'Archive'}
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
        {/* Hero renewal block */}
        <div className={cn(
          'mb-6 rounded-lg border p-5',
          renewalDays !== null && renewalDays < 0 ? 'border-red-200 bg-red-50' :
          renewalDays !== null && renewalDays <= 30 ? 'border-orange-200 bg-orange-50' :
          'border-gray-200 bg-white'
        )}>
          <div className="flex flex-wrap items-start gap-6">
            {/* Renewal date */}
            <div className="text-center min-w-[100px]">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Renewal Date</div>
              {contract.renewalDate ? (
                <>
                  <div className="text-2xl font-bold text-gray-900">{formatDate(contract.renewalDate)}</div>
                  <UrgencyBadge days={renewalDays} className="mt-1" />
                </>
              ) : (
                <div className="text-lg text-gray-400 italic">Not set</div>
              )}
            </div>

            {/* Notice deadline */}
            <div className="text-center min-w-[100px]">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Notice Deadline</div>
              {contract.noticeDeadline ? (
                <>
                  <div className={cn('text-lg font-bold', noticeExpired ? 'text-red-700' : 'text-gray-900')}>
                    {formatDate(contract.noticeDeadline)}
                  </div>
                  {noticeExpired && (
                    <span className="flex items-center gap-1 text-xs text-red-600 mt-0.5">
                      <AlertTriangle className="h-3 w-3" /> Passed
                    </span>
                  )}
                </>
              ) : (
                <div className="text-lg text-gray-400 italic">Not set</div>
              )}
            </div>

            {/* Status + flags */}
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Status</div>
                <StatusBadge status={contract.status} />
              </div>
              <div className="flex items-center gap-2">
                {contract.autoRenew && (
                  <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                    <RefreshCw className="h-3 w-3" /> Auto-renew
                  </span>
                )}
                {contract.studentDataInvolved && (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                    <Shield className="h-3 w-3" /> Student data
                  </span>
                )}
              </div>
            </div>

            {/* Owner */}
            {contract.internalOwner && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Owner</div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <User className="h-4 w-4 text-gray-400" />
                  {contract.internalOwner}
                </div>
                {contract.department && <div className="text-xs text-gray-500 mt-0.5">{contract.department}</div>}
              </div>
            )}

            {/* Cost */}
            {contract.cost != null && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Annual Cost</div>
                <div className="flex items-center gap-1.5 text-xl font-bold text-gray-900">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  {formatCurrency(contract.cost)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {activeTab === 'details' && (
              <>
                {/* Core identity */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Contract Details</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {contractTypeLabel && (
                      <>
                        <dt className="text-gray-500">Type</dt>
                        <dd className="font-medium text-gray-900">{contractTypeLabel}</dd>
                      </>
                    )}
                    {billingLabel && (
                      <>
                        <dt className="text-gray-500">Billing</dt>
                        <dd className="font-medium text-gray-900">{billingLabel}</dd>
                      </>
                    )}
                    {contract.startDate && (
                      <>
                        <dt className="text-gray-500">Start Date</dt>
                        <dd className="font-medium text-gray-900">{formatDate(contract.startDate)}</dd>
                      </>
                    )}
                    <dt className="text-gray-500">Purchase Types</dt>
                    <dd className="flex flex-wrap gap-1">
                      {contract.isPerpetual && <Badge variant="secondary">Perpetual</Badge>}
                      {contract.isAnnual && <Badge variant="secondary">Annual</Badge>}
                      {contract.hasSupportAssurance && <Badge variant="secondary">Support/SA</Badge>}
                      {contract.isSubscription && <Badge variant="secondary">Subscription</Badge>}
                      {!contract.isPerpetual && !contract.isAnnual && !contract.hasSupportAssurance && !contract.isSubscription && (
                        <span className="text-gray-400">—</span>
                      )}
                    </dd>
                  </dl>
                  {contract.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Description</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.description}</p>
                    </div>
                  )}
                </div>

                {/* Ownership */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Ownership</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <dt className="text-gray-500">Department</dt>
                    <dd className="font-medium text-gray-900">{contract.department ?? '—'}</dd>
                    <dt className="text-gray-500">Internal Owner</dt>
                    <dd className="font-medium text-gray-900">{contract.internalOwner ?? <span className="text-red-500 text-xs">⚠ Not set</span>}</dd>
                    <dt className="text-gray-500">Backup Owner</dt>
                    <dd className="font-medium text-gray-900">{contract.backupOwner ?? '—'}</dd>
                  </dl>
                </div>

                {/* Notes */}
                {contract.notes && (
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.notes}</p>
                  </div>
                )}

                {/* Attachments */}
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <AttachmentsList
                    attachments={contract.attachments}
                    parentType="contract"
                    parentId={id}
                    onAdd={(att) => setContract((c) => c ? { ...c, attachments: [...c.attachments, att] } : c)}
                    onDelete={(attId) => setContract((c) => c ? { ...c, attachments: c.attachments.filter((a) => a.id !== attId) } : c)}
                    readOnly={!canEdit}
                  />
                </div>
              </>
            )}

            {activeTab === 'financial' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Financial & Procurement</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <dt className="text-gray-500">Annual Cost</dt>
                  <dd className="font-medium">{contract.cost != null ? formatCurrency(contract.cost) : '—'}</dd>
                  <dt className="text-gray-500">Total Contract Value</dt>
                  <dd className="font-medium">{contract.totalContractValue != null ? formatCurrency(contract.totalContractValue) : '—'}</dd>
                  <dt className="text-gray-500">Number of Licenses</dt>
                  <dd className="font-medium">{contract.licenseCount != null ? contract.licenseCount.toLocaleString() : '—'}</dd>
                  <dt className="text-gray-500">Per License Cost</dt>
                  <dd className="font-medium">{contract.perLicenseCost != null ? formatCurrency(contract.perLicenseCost) : '—'}</dd>
                  <dt className="text-gray-500">Funding Source</dt>
                  <dd className="font-medium">{contract.fundingSource ?? '—'}</dd>
                  <dt className="text-gray-500">Budget / Account Code</dt>
                  <dd className="font-medium">{contract.budgetCode ?? '—'}</dd>
                  <dt className="text-gray-500">Procurement Method</dt>
                  <dd className="font-medium">{procurementLabel ?? '—'}</dd>
                  <dt className="text-gray-500">PO Number</dt>
                  <dd className="font-medium">{contract.poNumber ?? '—'}</dd>
                  <dt className="text-gray-500">Invoice Reference</dt>
                  <dd className="font-medium">{contract.invoiceReference ?? '—'}</dd>
                  <dt className="text-gray-500">Software Manager</dt>
                  <dd className="font-medium">{contract.softwareManager ?? '—'}</dd>
                </dl>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Compliance / Risk Snapshot</h3>
                <div className="space-y-3">
                  <TristateBadge value={contract.studentDataInvolved} label="Student Data Involved" />
                  <TristateBadge value={contract.dataPrivacyAgreementOnFile} label="Data Privacy Agreement on File" />
                  <TristateBadge value={contract.securityReviewCompleted} label="Security Review Completed" />
                  {contract.lastSecurityReviewDate && (
                    <div className="text-sm text-gray-600">
                      Last review: {formatDate(contract.lastSecurityReviewDate)}
                    </div>
                  )}
                  <TristateBadge value={contract.soc2Available} label="SOC 2 Available" />
                  <TristateBadge value={contract.breachNotificationTermsNoted} label="Breach Notification Terms Noted" />
                  {contract.ferpaCopaPrivacyNotes && (
                    <div className="pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">FERPA / COPPA / Privacy Notes</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.ferpaCopaPrivacyNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity History</h3>
                <ActivityLog entries={contract.activityLogs as ActivityLogEntry[]} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Vendor</h4>
              <Link href={`/vendors/${contract.vendorId}`} className="flex items-center gap-2 text-sm hover:text-brand-600 transition-colors">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{contract.vendor.name}</span>
              </Link>
              {contract.vendor.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="mt-2 mr-1">{tag}</Badge>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Record Info</h4>
              <dl className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <dt>Created</dt>
                  <dd>{formatDate(contract.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Updated</dt>
                  <dd>{formatDate(contract.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title={contract.isArchived ? 'Unarchive Contract' : 'Archive Contract'}
        message={
          contract.isArchived
            ? `Restore "${contract.productName}" to active status?`
            : `Archive "${contract.productName}"? It will be hidden from default views but not deleted.`
        }
        confirmLabel={contract.isArchived ? 'Unarchive' : 'Archive'}
        variant="warning"
        loading={actionLoading}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contract"
        message={`Permanently delete "${contract.productName}"? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={actionLoading}
      />
    </AppLayout>
  )
}
