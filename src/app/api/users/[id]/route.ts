// PUT /api/users/[id] — update user role/department/status (Admin only)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, isAuthError } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { userUpdateSchema } from '@/lib/validations'
import { Role } from '@prisma/client'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const adminUser = await requireRole('ADMIN')
  if (isAuthError(adminUser)) return adminUser

  // Admins cannot demote themselves
  if (params.id === adminUser.id) {
    const body = await request.json().catch(() => ({}))
    if (body.role && body.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, role: true, department: true, isActive: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = userUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 422 })
  }

  const data = result.data

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      role: data.role as Role,
      department: data.department ?? null,
      isActive: data.isActive ?? existing.isActive,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  await logActivity({
    entityType: 'user',
    entityId: updated.id,
    entityName: updated.email,
    action: 'updated',
    user: adminUser,
    beforeState: { role: existing.role, department: existing.department, isActive: existing.isActive },
    afterState: { role: updated.role, department: updated.department, isActive: updated.isActive },
  })

  return NextResponse.json({ data: updated })
}
