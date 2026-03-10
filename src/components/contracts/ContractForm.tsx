'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FieldWrapper, Input, Textarea, Select, CheckboxField, TristateSelector } from '../ui/FormField'
import { Button } from '../ui/Button'
import {
  CONTRACT_TYPES,
  BILLING_MODELS,
  PROCUREMENT_METHODS,
  FUNDING_SOURCES,
  DEPARTMENTS,
} from '@/types'
import type { Contract, Vendor } from '@/types'
import { format, parseISO, isValid } from 'date-fns'

interface ContractFormProps {
  contract?: Contract
  vendors: Pick<Vendor, 'id' | 'name'>[]
  defaultVendorId?: string
  onSuccess?: (contract: Contract) => void
  onCancel?: () => void
}

const toDateInput = (val: string | null | undefined): string => {
  if (!val) return ''
  const d = parseISO(val)
  return isValid(d) ? format(d, 'yyyy-MM-dd') : ''
}

type BooleanNull = boolean | null

interface FormState {
  vendorId: string
  productName: string
  description: string
  contractType: string
  billingModel: string
  isPerpetual: boolean
  isAnnual: boolean
  hasSupportAssurance: boolean
  isSubscription: boolean
  startDate: string
  renewalDate: string
  noticeDeadline: string
  autoRenew: boolean
  cost: string
  totalContractValue: string
  fundingSource: string
  budgetCode: string
  procurementMethod: string
  poNumber: string
  invoiceReference: string
  internalOwner: string
  backupOwner: string
  department: string
  status: string
  notes: string
  // Compliance
  dataPrivacyAgreementOnFile: BooleanNull
  studentDataInvolved: BooleanNull
  securityReviewCompleted: BooleanNull
  lastSecurityReviewDate: string
  soc2Available: BooleanNull
  ferpaCopaPrivacyNotes: string
  breachNotificationTermsNoted: BooleanNull
}

export function ContractForm({ contract, vendors, defaultVendorId, onSuccess, onCancel }: ContractFormProps) {
  const router = useRouter()
  const isEdit = !!contract

  const [form, setForm] = useState<FormState>({
    vendorId: contract?.vendorId ?? defaultVendorId ?? '',
    productName: contract?.productName ?? '',
    description: contract?.description ?? '',
    contractType: contract?.contractType ?? '',
    billingModel: contract?.billingModel ?? '',
    isPerpetual: contract?.isPerpetual ?? false,
    isAnnual: contract?.isAnnual ?? false,
    hasSupportAssurance: contract?.hasSupportAssurance ?? false,
    isSubscription: contract?.isSubscription ?? false,
    startDate: toDateInput(contract?.startDate),
    renewalDate: toDateInput(contract?.renewalDate),
    noticeDeadline: toDateInput(contract?.noticeDeadline),
    autoRenew: contract?.autoRenew ?? false,
    cost: contract?.cost?.toString() ?? '',
    totalContractValue: contract?.totalContractValue?.toString() ?? '',
    fundingSource: contract?.fundingSource ?? '',
    budgetCode: contract?.budgetCode ?? '',
    procurementMethod: contract?.procurementMethod ?? '',
    poNumber: contract?.poNumber ?? '',
    invoiceReference: contract?.invoiceReference ?? '',
    internalOwner: contract?.internalOwner ?? '',
    backupOwner: contract?.backupOwner ?? '',
    department: contract?.department ?? '',
    status: contract?.status ?? 'ACTIVE',
    notes: contract?.notes ?? '',
    dataPrivacyAgreementOnFile: contract?.dataPrivacyAgreementOnFile ?? null,
    studentDataInvolved: contract?.studentDataInvolved ?? null,
    securityReviewCompleted: contract?.securityReviewCompleted ?? null,
    lastSecurityReviewDate: toDateInput(contract?.lastSecurityReviewDate),
    soc2Available: contract?.soc2Available ?? null,
    ferpaCopaPrivacyNotes: contract?.ferpaCopaPrivacyNotes ?? '',
    breachNotificationTermsNoted: contract?.breachNotificationTermsNoted ?? null,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) => setForm((prev) => ({ ...prev, [key]: val }))

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.vendorId) e.vendorId = 'Vendor is required'
    if (!form.productName.trim()) e.productName = 'Product/service name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError('')

    try {
      const payload = {
        ...form,
        cost: form.cost ? parseFloat(form.cost) : null,
        totalContractValue: form.totalContractValue ? parseFloat(form.totalContractValue) : null,
        startDate: form.startDate || null,
        renewalDate: form.renewalDate || null,
        noticeDeadline: form.noticeDeadline || null,
        lastSecurityReviewDate: form.lastSecurityReviewDate || null,
        // Empty strings → null for optional fields
        description: form.description || null,
        contractType: form.contractType || null,
        billingModel: form.billingModel || null,
        fundingSource: form.fundingSource || null,
        budgetCode: form.budgetCode || null,
        procurementMethod: form.procurementMethod || null,
        poNumber: form.poNumber || null,
        invoiceReference: form.invoiceReference || null,
        internalOwner: form.internalOwner || null,
        backupOwner: form.backupOwner || null,
        department: form.department || null,
        notes: form.notes || null,
        ferpaCopaPrivacyNotes: form.ferpaCopaPrivacyNotes || null,
      }

      const url = isEdit ? `/api/contracts/${contract!.id}` : '/api/contracts'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong')
        return
      }

      if (onSuccess) {
        onSuccess(data.data)
      } else {
        router.push(`/contracts/${data.data.id}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Identity */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Contract Identity</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Vendor" htmlFor="c-vendor" required error={errors.vendorId}>
            <Select
              id="c-vendor"
              value={form.vendorId}
              onChange={(e) => set('vendorId')(e.target.value)}
              error={!!errors.vendorId}
              placeholder="Select vendor..."
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </FieldWrapper>

          <FieldWrapper label="Product / Service Name" htmlFor="c-product" required error={errors.productName}>
            <Input
              id="c-product"
              value={form.productName}
              onChange={(e) => set('productName')(e.target.value)}
              placeholder="e.g. PowerSchool SIS"
              error={!!errors.productName}
            />
          </FieldWrapper>

          <FieldWrapper label="Contract Type" htmlFor="c-type">
            <Select id="c-type" value={form.contractType} onChange={(e) => set('contractType')(e.target.value)} placeholder="Select type...">
              {CONTRACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FieldWrapper>

          <FieldWrapper label="Billing Model" htmlFor="c-billing">
            <Select id="c-billing" value={form.billingModel} onChange={(e) => set('billingModel')(e.target.value)} placeholder="Select billing...">
              {BILLING_MODELS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </Select>
          </FieldWrapper>

          <FieldWrapper label="Status" htmlFor="c-status">
            <Select id="c-status" value={form.status} onChange={(e) => set('status')(e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PENDING_RENEWAL">Pending Renewal</option>
              <option value="NON_RENEWING">Non-Renewing</option>
              <option value="EXPIRED">Expired</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </FieldWrapper>

          <FieldWrapper label="Description" htmlFor="c-desc" className="sm:col-span-2">
            <Textarea
              id="c-desc"
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              placeholder="Brief description of what this covers..."
              rows={2}
            />
          </FieldWrapper>
        </div>

        {/* Purchase type flags */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CheckboxField id="c-perpetual" label="Perpetual" description="One-time permanent license"
            checked={form.isPerpetual} onChange={(v) => set('isPerpetual')(v)} />
          <CheckboxField id="c-annual" label="Annual" description="Yearly renewal"
            checked={form.isAnnual} onChange={(v) => set('isAnnual')(v)} />
          <CheckboxField id="c-support" label="Support / SA" description="Software assurance or support"
            checked={form.hasSupportAssurance} onChange={(v) => set('hasSupportAssurance')(v)} />
          <CheckboxField id="c-sub" label="Subscription" description="SaaS or recurring service"
            checked={form.isSubscription} onChange={(v) => set('isSubscription')(v)} />
        </div>
      </section>

      {/* Renewal Dates */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Renewal Dates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldWrapper label="Start Date" htmlFor="c-start">
            <Input id="c-start" type="date" value={form.startDate} onChange={(e) => set('startDate')(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label="Renewal Date" htmlFor="c-renewal" hint="Date contract renews or expires">
            <Input id="c-renewal" type="date" value={form.renewalDate} onChange={(e) => set('renewalDate')(e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label="Notice Deadline" htmlFor="c-notice" hint="Required cancellation notice by this date">
            <Input id="c-notice" type="date" value={form.noticeDeadline} onChange={(e) => set('noticeDeadline')(e.target.value)} />
          </FieldWrapper>
        </div>
        <div className="mt-3">
          <CheckboxField id="c-autorenew" label="Auto-Renew" description="Contract renews automatically unless cancelled"
            checked={form.autoRenew} onChange={(v) => set('autoRenew')(v)} />
        </div>
      </section>

      {/* Financial */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Financial</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Annual / Period Cost" htmlFor="c-cost">
            <Input
              id="c-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => set('cost')(e.target.value)}
              placeholder="0.00"
            />
          </FieldWrapper>
          <FieldWrapper label="Total Contract Value" htmlFor="c-tcv">
            <Input
              id="c-tcv"
              type="number"
              min="0"
              step="0.01"
              value={form.totalContractValue}
              onChange={(e) => set('totalContractValue')(e.target.value)}
              placeholder="0.00"
            />
          </FieldWrapper>
          <FieldWrapper label="Funding Source" htmlFor="c-fund">
            <Select id="c-fund" value={form.fundingSource} onChange={(e) => set('fundingSource')(e.target.value)} placeholder="Select source...">
              {FUNDING_SOURCES.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </FieldWrapper>
          <FieldWrapper label="Budget / Account Code" htmlFor="c-budget">
            <Input id="c-budget" value={form.budgetCode} onChange={(e) => set('budgetCode')(e.target.value)} placeholder="e.g. TECH-001" />
          </FieldWrapper>
        </div>
      </section>

      {/* Procurement */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Procurement</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Procurement Method" htmlFor="c-proc">
            <Select id="c-proc" value={form.procurementMethod} onChange={(e) => set('procurementMethod')(e.target.value)} placeholder="Select method...">
              {PROCUREMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </FieldWrapper>
          <FieldWrapper label="PO Number" htmlFor="c-po">
            <Input id="c-po" value={form.poNumber} onChange={(e) => set('poNumber')(e.target.value)} placeholder="PO-2024-0001" />
          </FieldWrapper>
          <FieldWrapper label="Invoice Reference" htmlFor="c-inv">
            <Input id="c-inv" value={form.invoiceReference} onChange={(e) => set('invoiceReference')(e.target.value)} placeholder="Invoice # or reference" />
          </FieldWrapper>
        </div>
      </section>

      {/* Ownership */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Ownership</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Internal Owner" htmlFor="c-owner" hint="Primary district contact responsible for this contract">
            <Input id="c-owner" value={form.internalOwner} onChange={(e) => set('internalOwner')(e.target.value)} placeholder="Name or email" />
          </FieldWrapper>
          <FieldWrapper label="Backup Owner" htmlFor="c-backup">
            <Input id="c-backup" value={form.backupOwner} onChange={(e) => set('backupOwner')(e.target.value)} placeholder="Secondary contact" />
          </FieldWrapper>
          <FieldWrapper label="Department" htmlFor="c-dept">
            <Select id="c-dept" value={form.department} onChange={(e) => set('department')(e.target.value)} placeholder="Select department...">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FieldWrapper>
        </div>
      </section>

      {/* Compliance */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Compliance / Risk</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TristateSelector id="c-dpa" label="Data Privacy Agreement on File"
            value={form.dataPrivacyAgreementOnFile} onChange={(v) => set('dataPrivacyAgreementOnFile')(v)} />
          <TristateSelector id="c-student" label="Student Data Involved"
            value={form.studentDataInvolved} onChange={(v) => set('studentDataInvolved')(v)} />
          <TristateSelector id="c-sec" label="Security Review Completed"
            value={form.securityReviewCompleted} onChange={(v) => set('securityReviewCompleted')(v)} />
          <FieldWrapper label="Last Security Review Date" htmlFor="c-secdate">
            <Input id="c-secdate" type="date" value={form.lastSecurityReviewDate} onChange={(e) => set('lastSecurityReviewDate')(e.target.value)} />
          </FieldWrapper>
          <TristateSelector id="c-soc2" label="SOC 2 Available"
            value={form.soc2Available} onChange={(v) => set('soc2Available')(v)} />
          <TristateSelector id="c-breach" label="Breach Notification Terms Noted"
            value={form.breachNotificationTermsNoted} onChange={(v) => set('breachNotificationTermsNoted')(v)} />
          <FieldWrapper label="FERPA / COPPA / Privacy Notes" htmlFor="c-ferpa" className="sm:col-span-2">
            <Textarea id="c-ferpa" value={form.ferpaCopaPrivacyNotes} onChange={(e) => set('ferpaCopaPrivacyNotes')(e.target.value)}
              placeholder="Notes on applicable privacy regulations, exemptions, compliance status..." rows={2} />
          </FieldWrapper>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Notes</h3>
        <FieldWrapper label="Contract Notes" htmlFor="c-notes">
          <Textarea
            id="c-notes"
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
            placeholder="Operational notes, renewal considerations, action items..."
            rows={3}
          />
        </FieldWrapper>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Create Contract'}
        </Button>
      </div>
    </form>
  )
}
