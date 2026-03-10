'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FieldWrapper, Input, Textarea, TagInput } from '../ui/FormField'
import { Button } from '../ui/Button'
import type { Vendor } from '@/types'

interface VendorFormProps {
  vendor?: Vendor
  onSuccess?: (vendor: Vendor) => void
  onCancel?: () => void
}

type FormData = {
  name: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  generalNotes: string
  tags: string[]
  procurementNotes: string
  supportContactName: string
  supportContactEmail: string
  supportContactPhone: string
  supportWebsite: string
  supportNotes: string
}

export function VendorForm({ vendor, onSuccess, onCancel }: VendorFormProps) {
  const router = useRouter()
  const isEdit = !!vendor

  const [form, setForm] = useState<FormData>({
    name: vendor?.name ?? '',
    primaryContactName: vendor?.primaryContactName ?? '',
    primaryContactEmail: vendor?.primaryContactEmail ?? '',
    primaryContactPhone: vendor?.primaryContactPhone ?? '',
    generalNotes: vendor?.generalNotes ?? '',
    tags: vendor?.tags ?? [],
    procurementNotes: vendor?.procurementNotes ?? '',
    supportContactName: vendor?.supportContactName ?? '',
    supportContactEmail: vendor?.supportContactEmail ?? '',
    supportContactPhone: vendor?.supportContactPhone ?? '',
    supportWebsite: vendor?.supportWebsite ?? '',
    supportNotes: vendor?.supportNotes ?? '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (key: keyof FormData) => (val: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const validate = () => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Vendor name is required'
    if (form.primaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryContactEmail)) {
      e.primaryContactEmail = 'Invalid email address'
    }
    if (form.supportContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportContactEmail)) {
      e.supportContactEmail = 'Invalid email address'
    }
    if (form.supportWebsite && form.supportWebsite.trim()) {
      try { new URL(form.supportWebsite) } catch { e.supportWebsite = 'Must be a valid URL (include https://)' }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError('')

    try {
      const url = isEdit ? `/api/vendors/${vendor!.id}` : '/api/vendors'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          primaryContactEmail: form.primaryContactEmail || null,
          supportContactEmail: form.supportContactEmail || null,
          supportWebsite: form.supportWebsite || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong')
        return
      }

      if (onSuccess) {
        onSuccess(data.data)
      } else {
        router.push(`/vendors/${data.data.id}`)
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
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Vendor Identity</h3>
        <div className="grid grid-cols-1 gap-4">
          <FieldWrapper label="Vendor Name" htmlFor="v-name" required error={errors.name}>
            <Input
              id="v-name"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="e.g. Frontline Education"
              error={!!errors.name}
            />
          </FieldWrapper>

          <FieldWrapper label="Tags / Services" htmlFor="v-tags" hint="Press Enter or comma to add a tag">
            <TagInput
              value={form.tags}
              onChange={(tags) => set('tags')(tags)}
              placeholder="e.g. HR, Payroll, SIS..."
            />
          </FieldWrapper>

          <FieldWrapper label="General Notes" htmlFor="v-notes">
            <Textarea
              id="v-notes"
              value={form.generalNotes}
              onChange={(e) => set('generalNotes')(e.target.value)}
              placeholder="Background context, relationship history, key notes..."
              rows={3}
            />
          </FieldWrapper>

          <FieldWrapper label="Procurement Notes" htmlFor="v-proc-notes">
            <Textarea
              id="v-proc-notes"
              value={form.procurementNotes}
              onChange={(e) => set('procurementNotes')(e.target.value)}
              placeholder="Cooperative contract details, sole source justification, notice requirements..."
              rows={2}
            />
          </FieldWrapper>
        </div>
      </section>

      {/* Primary Contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Primary Contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Name" htmlFor="v-pc-name">
            <Input
              id="v-pc-name"
              value={form.primaryContactName}
              onChange={(e) => set('primaryContactName')(e.target.value)}
              placeholder="Account manager name"
            />
          </FieldWrapper>
          <FieldWrapper label="Email" htmlFor="v-pc-email" error={errors.primaryContactEmail}>
            <Input
              id="v-pc-email"
              type="email"
              value={form.primaryContactEmail}
              onChange={(e) => set('primaryContactEmail')(e.target.value)}
              placeholder="contact@vendor.com"
              error={!!errors.primaryContactEmail}
            />
          </FieldWrapper>
          <FieldWrapper label="Phone" htmlFor="v-pc-phone">
            <Input
              id="v-pc-phone"
              type="tel"
              value={form.primaryContactPhone}
              onChange={(e) => set('primaryContactPhone')(e.target.value)}
              placeholder="800-555-0100"
            />
          </FieldWrapper>
        </div>
      </section>

      {/* Support Contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Support Contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Name / Team" htmlFor="v-sc-name">
            <Input
              id="v-sc-name"
              value={form.supportContactName}
              onChange={(e) => set('supportContactName')(e.target.value)}
              placeholder="Support team name"
            />
          </FieldWrapper>
          <FieldWrapper label="Email" htmlFor="v-sc-email" error={errors.supportContactEmail}>
            <Input
              id="v-sc-email"
              type="email"
              value={form.supportContactEmail}
              onChange={(e) => set('supportContactEmail')(e.target.value)}
              placeholder="support@vendor.com"
              error={!!errors.supportContactEmail}
            />
          </FieldWrapper>
          <FieldWrapper label="Phone" htmlFor="v-sc-phone">
            <Input
              id="v-sc-phone"
              type="tel"
              value={form.supportContactPhone}
              onChange={(e) => set('supportContactPhone')(e.target.value)}
              placeholder="800-555-0100"
            />
          </FieldWrapper>
          <FieldWrapper label="Support Website" htmlFor="v-sc-website" error={errors.supportWebsite}>
            <Input
              id="v-sc-website"
              type="url"
              value={form.supportWebsite}
              onChange={(e) => set('supportWebsite')(e.target.value)}
              placeholder="https://support.vendor.com"
              error={!!errors.supportWebsite}
            />
          </FieldWrapper>
          <FieldWrapper label="Support Notes" htmlFor="v-sc-notes" className="sm:col-span-2">
            <Textarea
              id="v-sc-notes"
              value={form.supportNotes}
              onChange={(e) => set('supportNotes')(e.target.value)}
              placeholder="Ticket portal info, escalation path, SLA details..."
              rows={2}
            />
          </FieldWrapper>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Save Changes' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  )
}
