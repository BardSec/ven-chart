'use client'

import { useState, useRef } from 'react'
import { Link2, Trash2, Plus, ExternalLink, Paperclip, Upload, FileText } from 'lucide-react'
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

type Tab = 'upload' | 'link'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const [tab, setTab] = useState<Tab>('upload')

  // --- Upload state ---
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadErrors, setUploadErrors] = useState<{ title?: string; file?: string }>({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'saving'>('idle')

  // --- Link state ---
  const [linkForm, setLinkForm] = useState({ title: '', url: '' })
  const [linkErrors, setLinkErrors] = useState<{ title?: string; url?: string }>({})
  const [linkSubmitting, setLinkSubmitting] = useState(false)

  const resetAndClose = () => {
    setAddOpen(false)
    setUploadFile(null)
    setUploadTitle('')
    setUploadErrors({})
    setUploadProgress('idle')
    setLinkForm({ title: '', url: '' })
    setLinkErrors({})
  }

  // ---- Upload flow ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setUploadFile(file)
    if (file && !uploadTitle) {
      // Auto-fill title from filename (strip extension)
      setUploadTitle(file.name.replace(/\.[^.]+$/, ''))
    }
    setUploadErrors({})
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof uploadErrors = {}
    if (!uploadTitle.trim()) errs.title = 'Title is required'
    if (!uploadFile) errs.file = 'Please select a file'
    else if (uploadFile.size > 50 * 1024 * 1024) errs.file = 'File must be under 50 MB'
    setUploadErrors(errs)
    if (Object.keys(errs).length > 0) return

    setUploading(true)
    setUploadProgress('uploading')
    try {
      // 1. Get presigned URL
      const urlRes = await fetch('/api/attachments/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile!.name,
          mimeType: uploadFile!.type || 'application/octet-stream',
          fileSize: uploadFile!.size,
        }),
      })
      if (!urlRes.ok) {
        const d = await urlRes.json()
        setUploadErrors({ file: d.error ?? 'Could not get upload URL' })
        return
      }
      const { uploadUrl, publicUrl } = await urlRes.json()

      // 2. PUT file directly to R2
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile!.type || 'application/octet-stream' },
        body: uploadFile,
      })
      if (!putRes.ok) {
        setUploadErrors({ file: 'Upload to storage failed. Check your R2 CORS settings.' })
        return
      }

      setUploadProgress('saving')

      // 3. Save attachment record
      const saveRes = await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentType,
          parentId,
          title: uploadTitle.trim(),
          url: publicUrl,
          fileName: uploadFile!.name,
          fileSize: uploadFile!.size,
          mimeType: uploadFile!.type || 'application/octet-stream',
        }),
      })
      const saveData = await saveRes.json()
      if (saveRes.ok) {
        onAdd(saveData.data)
        resetAndClose()
      } else {
        setUploadErrors({ file: saveData.error ?? 'Failed to save attachment' })
      }
    } finally {
      setUploading(false)
      setUploadProgress('idle')
    }
  }

  // ---- Link flow ----
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof linkErrors = {}
    if (!linkForm.title.trim()) errs.title = 'Title is required'
    if (!linkForm.url.trim()) errs.url = 'URL is required'
    else {
      try { new URL(linkForm.url) } catch { errs.url = 'Must be a valid URL (include https://)' }
    }
    setLinkErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLinkSubmitting(true)
    try {
      const res = await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentType, parentId, title: linkForm.title, url: linkForm.url }),
      })
      const data = await res.json()
      if (res.ok) {
        onAdd(data.data)
        resetAndClose()
      } else {
        setLinkErrors({ url: data.error ?? 'Failed to add link' })
      }
    } finally {
      setLinkSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this attachment?')) return
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
            Add
          </Button>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400 py-3">No links or documents attached.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              {att.fileName ? (
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              ) : (
                <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={att.fileName ? `/api/attachments/${att.id}/file` : att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1"
                >
                  {att.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {(att.fileName || att.fileSize) && (
                  <p className="text-xs text-gray-400">
                    {att.fileName}{att.fileSize ? ` · ${formatBytes(att.fileSize)}` : ''}
                  </p>
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

      <Modal open={addOpen} onClose={resetAndClose} title="Add Attachment" size="sm">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-4 -mt-1">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'upload'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'link'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            Link URL
          </button>
        </div>

        {tab === 'upload' ? (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* File picker */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="*/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-md border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
                  uploadErrors.file
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-brand-400 hover:bg-brand-50'
                }`}
              >
                {uploadFile ? (
                  <span className="font-medium text-gray-700">{uploadFile.name} ({formatBytes(uploadFile.size)})</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                    Click to select a file (max 50 MB)
                  </>
                )}
              </button>
              {uploadErrors.file && (
                <p className="mt-1 text-xs text-red-600">{uploadErrors.file}</p>
              )}
            </div>

            <FieldWrapper label="Title" htmlFor="up-title" required error={uploadErrors.title}>
              <Input
                id="up-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Master Agreement 2024"
                error={!!uploadErrors.title}
              />
            </FieldWrapper>

            {uploadProgress !== 'idle' && (
              <p className="text-xs text-brand-600">
                {uploadProgress === 'uploading' ? 'Uploading to storage…' : 'Saving…'}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
              <Button type="submit" loading={uploading}>Upload</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <FieldWrapper label="Title" htmlFor="att-title" required error={linkErrors.title}>
              <Input
                id="att-title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                placeholder="e.g. Master Agreement 2024"
                error={!!linkErrors.title}
              />
            </FieldWrapper>
            <FieldWrapper label="URL" htmlFor="att-url" required error={linkErrors.url} hint="Include https://...">
              <Input
                id="att-url"
                type="url"
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https://"
                error={!!linkErrors.url}
              />
            </FieldWrapper>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
              <Button type="submit" loading={linkSubmitting}>Add Link</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
