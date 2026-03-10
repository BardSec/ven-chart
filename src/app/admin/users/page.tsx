'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/FormField'
import { CardSkeleton, ErrorState } from '@/components/ui/EmptyState'
import { Users, Shield, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import type { AppUser } from '@/types'
import { DEPARTMENTS } from '@/types'

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Admin', color: 'text-purple-700 bg-purple-100' },
  EDITOR: { label: 'Editor', color: 'text-blue-700 bg-blue-100' },
  VIEWER: { label: 'Viewer', color: 'text-gray-700 bg-gray-100' },
  DEPARTMENT_OWNER: { label: 'Dept. Owner', color: 'text-green-700 bg-green-100' },
}

export default function UsersPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editDept, setEditDept] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.data)
    } catch {
      setError('Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  if (!isAdmin) {
    return (
      <AppLayout>
        <Header title="User Management" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Access restricted to Administrators.
          </div>
        </div>
      </AppLayout>
    )
  }

  const openEdit = (user: AppUser) => {
    setEditUser(user)
    setEditRole(user.role)
    setEditDept(user.department ?? '')
    setEditActive(user.isActive)
  }

  const handleSave = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, department: editDept || null, isActive: editActive }),
      })
      if (res.ok) {
        await loadUsers()
        setEditUser(null)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <Header
        title="User Management"
        description={`${users.length} users`}
      />

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">All Users</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.VIEWER
                  const isSelf = user.id === session?.user?.id
                  return (
                    <tr key={user.id} className={cn('hover:bg-gray-50', !user.isActive && 'opacity-60')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                            {user.name ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('') : user.email[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name ?? '—'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                          {isSelf && <span className="rounded text-xs bg-gray-100 px-1.5 py-0.5 text-gray-500">You</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', roleConfig.color)}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{user.department ?? '—'}</td>
                      <td className="px-5 py-3">
                        {user.isActive ? (
                          <span className="flex items-center gap-1 text-green-700 text-xs">
                            <CheckCircle className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <XCircle className="h-3.5 w-3.5" /> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="xs" variant="ghost" onClick={() => openEdit(user)}>
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit user modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        description={editUser?.email}
        size="sm"
      >
        {editUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                <option value="ADMIN">Admin — Full control</option>
                <option value="EDITOR">Editor — Create &amp; edit records</option>
                <option value="VIEWER">Viewer — Read-only</option>
                <option value="DEPARTMENT_OWNER">Department Owner — Edit own dept records</option>
              </Select>
              {editRole === 'DEPARTMENT_OWNER' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <Select value={editDept} onChange={(e) => setEditDept(e.target.value)} placeholder="Select department...">
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
              )}
            </div>

            {editUser.id !== session?.user?.id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <Select value={editActive ? 'active' : 'inactive'} onChange={(e) => setEditActive(e.target.value === 'active')}>
                  <option value="active">Active</option>
                  <option value="inactive">Deactivated</option>
                </Select>
                {!editActive && (
                  <p className="text-xs text-amber-700 mt-1">Deactivated users cannot sign in.</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
