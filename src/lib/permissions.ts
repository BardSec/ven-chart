// Role-based permission system
// Design principle: server-side checks are the source of truth.
// Client-side checks are for UX only.

import { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export interface SessionUser {
  id: string
  email?: string | null
  name?: string | null
  role: Role
  department: string | null
  isActive: boolean
}

// =============================================================================
// Permission checks
// =============================================================================

export function canViewAll(role: Role): boolean {
  return true // All authenticated roles can view
}

export function canCreateOrEdit(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR || role === Role.DEPARTMENT_OWNER
}

export function canDelete(role: Role): boolean {
  return role === Role.ADMIN
}

export function canManageUsers(role: Role): boolean {
  return role === Role.ADMIN
}

export function canImportExport(role: Role): boolean {
  return role === Role.ADMIN
}

export function canArchive(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR
}

/**
 * Check if a user can edit a specific record.
 * DEPARTMENT_OWNER can only edit records in their department or where they are the owner.
 */
export function canEditRecord(
  user: SessionUser,
  record: { department?: string | null; internalOwner?: string | null }
): boolean {
  if (user.role === Role.ADMIN || user.role === Role.EDITOR) return true
  if (user.role === Role.VIEWER) return false

  if (user.role === Role.DEPARTMENT_OWNER) {
    const dept = record.department?.toLowerCase()
    const owner = record.internalOwner?.toLowerCase()
    const userDept = user.department?.toLowerCase()
    const userEmail = user.email?.toLowerCase()
    const userName = user.name?.toLowerCase()

    return (
      (dept && userDept && dept === userDept) ||
      (owner && userEmail && owner.includes(userEmail)) ||
      (owner && userName && owner.includes(userName))
    )
  }

  return false
}

// =============================================================================
// Server-side auth helpers for API routes
// =============================================================================

/**
 * Gets the current session user. Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return session.user as SessionUser
}

/**
 * Requires authentication. Returns the user or a 401 Response.
 */
export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return user
}

/**
 * Requires a specific role or higher. Returns the user or an error Response.
 */
export async function requireRole(
  minimumRole: 'ADMIN' | 'EDITOR' | 'DEPARTMENT_OWNER'
): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const roleHierarchy: Record<Role, number> = {
    VIEWER: 0,
    DEPARTMENT_OWNER: 1,
    EDITOR: 2,
    ADMIN: 3,
  }

  if (roleHierarchy[user.role] < roleHierarchy[minimumRole]) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return user
}

/**
 * Type guard: check if result is a SessionUser vs a NextResponse error
 */
export function isAuthError(result: SessionUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
