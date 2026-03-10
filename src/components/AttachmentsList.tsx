'use client'

import { useState } from 'react'
import { Link2, Trash2, Plus, ExternalLink, Paperclip } from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { FieldWrapper, Input } from './ui/FormField'
import type { Attachment } from '@/types'
import { useSession } from 'next-auth/react'

interface AttachmentsListProps {
  attachments: Attachment[]
  parentType: 'vendor' | 'contract'
  parentId: string
  onAdd: (attachment: Attachment) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

export function AttachmentsList({
  attachments,
  parentType,
  parentId,
  onAdd,
  onDelete,
  readOnly = false,
}: AttachmentsListProps) {
  const { data: session } = useSession()
  const canEdit = !readOnly && session?.user?.role !== 'VIEWER'
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', url: '' })
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.url.trim()) e.url = 'URL is required'
    else {
      try { new URL(form.url) } catch { e.url = 'Must be a valid URL (include https://)' }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentType, parentId, title: form.title, url: form.url }),
      })
      const data = await res.json()
      if (res.ok) {
        onAdd(data.data)
        setAddOpen(false)
        setForm({ title: '', url: '' })
      } else {
        setErrors({ url: data.error ?? 'Failed to add link' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this link?')) return
    const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
    if (res.ok) onDelete(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <Paperclip className="h-4 w-4 text-gray-400" />
          Links & Documents
          <span className="ml-1 text-xs text-gray-500">({attachments.length})</span>
        </h3>
        {canEdit && (
          <Button size="xs" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Link
          </Button>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400 py-3">No links or documents attached.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1"
                >
                  {att.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {att.fileName && (
                  <p className="text-xs text-gray-400">{att.fileName}</p>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(att.id)}
                  className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                  aria-label={`Remove ${att.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Link" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldWrapper label="Title" htmlFor="att-title" required error={errors.title}>
            <Input
              id="att-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Master Agreement 2024"
              error={!!errors.title}
            />
          </FieldWrapper>
          <FieldWrapper label="URL" htmlFor="att-url" required error={errors.url} hint="Include https://...">
            <Input
              id="att-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://"
              error={!!errors.url}
            />
          </FieldWrapper>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Link</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
