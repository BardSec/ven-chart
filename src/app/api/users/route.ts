// GET /api/users — list users (Admin only)

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, isAuthError } from '@/lib/permissions'

export async function GET() {
  const user = await requireRole('ADMIN')
  if (isAuthError(user)) return user

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      department: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ data: users })
}
