'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { CheckboxField } from '@/components/ui/FormField'
import { Download, Upload, CheckCircle, AlertTriangle, FileJson } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ImportResult {
  success: boolean
  isDryRun: boolean
  counts: {
    vendorsImported: number
    contractsImported: number
    attachmentsImported: number
    vendorsSkipped: number
    contractsSkipped: number
  }
  errors: string[]
  warnings: string[]
}

export default function ImportExportPage() {
  const { data: session } = useSession()

  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (session && session.user.role !== 'ADMIN') {
    return (
      <AppLayout>
        <Header title="Import / Export" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Access restricted to Administrators.
          </div>
        </div>
      </AppLayout>
    )
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ven-chart-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { alert('Select a JSON file first.'); return }

    setImporting(true)
    setImportResult(null)
    setImportError('')

    try {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        setImportError('Invalid JSON file. Could not parse.')
        return
      }

      const res = await fetch(`/api/import?dryRun=${dryRun}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })

      const data = await res.json()
      if (!res.ok && !data.errors) {
        setImportError(data.error ?? 'Import failed')
        return
      }

      setImportResult(data)
    } catch {
      setImportError('Import failed unexpectedly. Check the file and try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppLayout>
      <Header title="Import / Export" description="Back up or restore application data as JSON" />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Export section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Export Data</h2>
              <p className="mt-1 text-sm text-gray-500">
                Download all vendors, contracts, and attachments as a JSON file. Use this for backups or to migrate data.
              </p>
              <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                Export includes: vendors, contracts, and attachment links. User accounts are not exported.
              </div>
              <div className="mt-4">
                <Button onClick={handleExport} loading={exporting}>
                  <Download className="h-4 w-4" />
                  Export All Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Import section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Import Data</h2>
              <p className="mt-1 text-sm text-gray-500">
                Import vendors and contracts from a ven-chart JSON export file.
              </p>

              <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                <strong>Important:</strong> Importing creates new records — it does not overwrite existing ones.
                Use dry-run mode first to preview what will be imported.
              </div>

              <div className="mt-4 space-y-3">
                {/* File picker */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="block text-sm text-gray-500 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50"
                  />
                </div>

                <CheckboxField
                  id="dry-run"
                  label="Dry run (preview only — no data will be saved)"
                  description="Recommended: validate the import before committing"
                  checked={dryRun}
                  onChange={setDryRun}
                />

                <div>
                  <Button
                    onClick={handleImport}
                    loading={importing}
                    variant={dryRun ? 'secondary' : 'primary'}
                  >
                    <FileJson className="h-4 w-4" />
                    {dryRun ? 'Preview Import (Dry Run)' : 'Import Data'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Import result */}
        {importError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
              <AlertTriangle className="h-4 w-4" />
              Import Error
            </div>
            <p className="text-sm text-red-700">{importError}</p>
          </div>
        )}

        {importResult && (
          <div className={`rounded-lg border p-5 ${importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <h3 className={`font-semibold ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {importResult.isDryRun ? 'Dry Run Result' : 'Import Complete'}
              </h3>
              {importResult.isDryRun && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 font-medium">
                  No data saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-md bg-white border border-gray-200 p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{importResult.counts.vendorsImported}</div>
                <div className="text-xs text-gray-500">Vendors {importResult.isDryRun ? 'to import' : 'imported'}</div>
              </div>
              <div className="rounded-md bg-white border border-gray-200 p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{importResult.counts.contractsImported}</div>
                <div className="text-xs text-gray-500">Contracts {importResult.isDryRun ? 'to import' : 'imported'}</div>
              </div>
              <div className="rounded-md bg-white border border-gray-200 p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{importResult.counts.attachmentsImported}</div>
                <div className="text-xs text-gray-500">Links {importResult.isDryRun ? 'to import' : 'imported'}</div>
              </div>
            </div>

            {importResult.warnings.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-amber-700 uppercase mb-1">Warnings</h4>
                <ul className="space-y-1">
                  {importResult.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-red-700 uppercase mb-1">Errors</h4>
                <ul className="space-y-1">
                  {importResult.errors.map((e, i) => (
                    <li key={i} className="text-sm text-red-700">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.isDryRun && importResult.success && (
              <div className="mt-4 pt-3 border-t border-green-200">
                <p className="text-sm text-green-700">
                  Validation passed. Uncheck <strong>Dry run</strong> and click Import to commit these records.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
