// Shared utility functions

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInCalendarDays, format, parseISO, isValid } from 'date-fns'
import type { UrgencyLevel } from '@/types'

// =============================================================================
// Tailwind class merge helper
// =============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// Date helpers
// =============================================================================

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'MMM d, yyyy')
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'M/d/yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'MMM d, yyyy h:mm a')
}

/**
 * Returns the number of calendar days from today until the target date.
 * Negative = past due.
 */
export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return null
  return differenceInCalendarDays(d, new Date())
}

export function daysUntilLabel(days: number | null): string {
  if (days === null) return 'No date set'
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days} day${days !== 1 ? 's' : ''}`
}

// =============================================================================
// Urgency calculation
// =============================================================================

/**
 * Derives urgency level from days until renewal.
 * Used for color coding and priority sorting.
 */
export function getUrgency(daysUntilRenewal: number | null): UrgencyLevel {
  if (daysUntilRenewal === null) return 'unknown'
  if (daysUntilRenewal < 0) return 'overdue'
  if (daysUntilRenewal <= 30) return 'critical'
  if (daysUntilRenewal <= 90) return 'warning'
  return 'ok'
}

export const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; color: string; textColor: string; bgColor: string; borderColor: string; dot: string }
> = {
  overdue: {
    label: 'Overdue',
    color: 'red',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    dot: 'bg-red-500',
  },
  critical: {
    label: 'Due Soon',
    color: 'orange',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  warning: {
    label: 'Upcoming',
    color: 'amber',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  ok: {
    label: 'On Track',
    color: 'green',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    dot: 'bg-green-500',
  },
  unknown: {
    label: 'No Date',
    color: 'gray',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    dot: 'bg-gray-400',
  },
}

// =============================================================================
// Currency formatting
// =============================================================================

export function formatCurrency(
  amount: number | null | undefined,
  opts?: { compact?: boolean }
): string {
  if (amount == null) return '—'
  if (opts?.compact && amount >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// =============================================================================
// String helpers
// =============================================================================

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// =============================================================================
// Contract status helpers
// =============================================================================

export const STATUS_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  ACTIVE: {
    label: 'Active',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    dotColor: 'bg-green-500',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    dotColor: 'bg-blue-500',
  },
  PENDING_RENEWAL: {
    label: 'Pending Renewal',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    dotColor: 'bg-amber-500',
  },
  NON_RENEWING: {
    label: 'Non-Renewing',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    dotColor: 'bg-orange-500',
  },
  EXPIRED: {
    label: 'Expired',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-500',
  },
  ARCHIVED: {
    label: 'Archived',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    dotColor: 'bg-gray-400',
  },
}

// =============================================================================
// Validation helpers
// =============================================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// =============================================================================
// Array helpers
// =============================================================================

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function sortBy<T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return direction === 'asc' ? 1 : -1
    if (bVal == null) return direction === 'asc' ? -1 : 1
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}
