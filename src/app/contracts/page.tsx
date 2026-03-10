'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ContractCard } from '@/components/contracts/ContractCard'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/FormField'
import { EmptyState, CardSkeleton, ErrorState } from '@/components/ui/EmptyState'
import { Plus, FileText, Search, SlidersHorizontal, X } from 'lucide-react'
import type { Contract } from '@/types'
import { DEPARTMENTS, CONTRACT_TYPES } from '@/types'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

export default function ContractsPage() {
  const { data: session } = useSession()
  const canEdit = session?.user?.role !== 'VIEWER'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [department, setDepartment] = useState(searchParams.get('department') ?? '')
  const [contractType, setContractType] = useState(searchParams.get('contractType') ?? '')
  const [missingOwner, setMissingOwner] = useState(searchParams.get('missingOwner') === 'true')
  const [missingRenewalDate, setMissingRenewalDate] = useState(searchParams.get('missingRenewalDate') === 'true')
  const [autoRenew, setAutoRenew] = useState(searchParams.get('autoRenew') ?? '')

  const loadContracts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (department) params.set('department', department)
      if (contractType) params.set('contractType', contractType)
      if (missingOwner) params.set('missingOwner', 'true')
      if (missingRenewalDate) params.set('missingRenewalDate', 'true')
      if (autoRenew) params.set('autoRenew', autoRenew)

      const res = await fetch(`/api/contracts?${params}`)
      if (!res.ok) throw new Error('Failed to load contracts')
      const data = await res.json()
      setContracts(data.data)
    } catch {
      setError('Could not load contracts.')
    } finally {
      setLoading(false)
    }
  }, [search, status, department, contractType, missingOwner, missingRenewalDate, autoRenew])

  useEffect(() => {
    const t = setTimeout(() => loadContracts(), 300)
    return () => clearTimeout(t)
  }, [loadContracts])

  const activeFilterCount = [status, department, contractType, missingOwner, missingRenewalDate, autoRenew]
    .filter(Boolean).length

  const clearFilters = () => {
    setStatus(''); setDepartment(''); setContractType('');
    setMissingOwner(false); setMissingRenewalDate(false); setAutoRenew('')
  }

  return (
    <AppLayout>
      <Header
        title="Contracts"
        description={`${contracts.length} contract${contracts.length !== 1 ? 's' : ''}`}
        actions={
          canEdit && (
            <Button onClick={() => router.push('/contracts/new')}>
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          )
        }
      />

      <div className="p-6">
        {/* Search + filter bar */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contracts..."
              className="pl-9"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm border transition-colors',
              showFilters || activeFilterCount > 0
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Any status">
                <option value="ACTIVE">Active</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PENDING_RENEWAL">Pending Renewal</option>
                <option value="NON_RENEWING">Non-Renewing</option>
                <option value="EXPIRED">Expired</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Any dept">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contract Type</label>
              <Select value={contractType} onChange={(e) => setContractType(e.target.value)} placeholder="Any type">
                {CONTRACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Auto-Renew</label>
              <Select value={autoRenew} onChange={(e) => setAutoRenew(e.target.value)} placeholder="Any">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={missingOwner} onChange={(e) => setMissingOwner(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600" />
                Missing owner
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={missingRenewalDate} onChange={(e) => setMissingRenewalDate(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600" />
                Missing renewal date
              </label>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadContracts} />
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="No contracts found"
            description={
              activeFilterCount > 0 || search
                ? 'No contracts match the current filters. Try adjusting your search.'
                : 'Add your first contract to start tracking renewals.'
            }
            action={
              canEdit && !search && activeFilterCount === 0 ? (
                <Button onClick={() => router.push('/contracts/new')}>
                  <Plus className="h-4 w-4" />
                  Add Contract
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {contracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} showVendor />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
