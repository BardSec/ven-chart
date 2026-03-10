'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { VendorCard } from '@/components/vendors/VendorCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormField'
import { EmptyState, CardSkeleton, ErrorState } from '@/components/ui/EmptyState'
import { Plus, Building2, Search, Archive } from 'lucide-react'
import type { Vendor } from '@/types'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

export default function VendorsPage() {
  const { data: session } = useSession()
  const canEdit = session?.user?.role !== 'VIEWER'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [showArchived, setShowArchived] = useState(false)

  const loadVendors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (showArchived) params.set('isArchived', 'true')

      const res = await fetch(`/api/vendors?${params}`)
      if (!res.ok) throw new Error('Failed to load vendors')
      const data = await res.json()
      setVendors(data.data)
    } catch {
      setError('Could not load vendors.')
    } finally {
      setLoading(false)
    }
  }, [search, showArchived])

  useEffect(() => {
    const t = setTimeout(() => loadVendors(), 300)
    return () => clearTimeout(t)
  }, [loadVendors])

  return (
    <AppLayout>
      <Header
        title="Vendors"
        description={`${vendors.length} vendor${vendors.length !== 1 ? 's' : ''}`}
        actions={
          canEdit && (
            <Button onClick={() => router.push('/vendors/new')}>
              <Plus className="h-4 w-4" />
              New Vendor
            </Button>
          )
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors..."
              className="pl-9"
            />
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm border transition-colors',
              showArchived
                ? 'bg-gray-100 border-gray-300 text-gray-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? 'Showing archived' : 'Show archived'}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadVendors} />
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-7 w-7" />}
            title={search ? 'No vendors match your search' : 'No vendors yet'}
            description={
              search
                ? 'Try a different search term or clear the search.'
                : 'Add your first vendor to start tracking contracts and renewals.'
            }
            action={
              canEdit && !search ? (
                <Button onClick={() => router.push('/vendors/new')}>
                  <Plus className="h-4 w-4" />
                  Add Vendor
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
