'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variant === 'default' && 'bg-brand-100 text-brand-800',
        variant === 'outline' && 'border border-gray-300 bg-white text-gray-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {children}
    </span>
  )
}

// Status-specific badge
interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Active' },
  UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Under Review' },
  PENDING_RENEWAL: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Pending Renewal' },
  NON_RENEWING: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Non-Renewing' },
  EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Expired' },
  ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Archived' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden />
      {style.label}
    </span>
  )
}

// Urgency badge
interface UrgencyBadgeProps {
  days: number | null
  className?: string
  showIcon?: boolean
}

export function UrgencyBadge({ days, className, showIcon = true }: UrgencyBadgeProps) {
  let bg: string, text: string, dot: string, label: string

  if (days === null) {
    bg = 'bg-gray-100'; text = 'text-gray-500'; dot = 'bg-gray-400'; label = 'No date'
  } else if (days < 0) {
    bg = 'bg-red-100'; text = 'text-red-800'; dot = 'bg-red-500'
    label = `${Math.abs(days)}d overdue`
  } else if (days === 0) {
    bg = 'bg-red-100'; text = 'text-red-800'; dot = 'bg-red-500'; label = 'Due today'
  } else if (days <= 30) {
    bg = 'bg-orange-100'; text = 'text-orange-800'; dot = 'bg-orange-500'; label = `${days}d`
  } else if (days <= 90) {
    bg = 'bg-amber-100'; text = 'text-amber-800'; dot = 'bg-amber-400'; label = `${days}d`
  } else {
    bg = 'bg-green-100'; text = 'text-green-800'; dot = 'bg-green-500'; label = `${days}d`
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        bg, text, className
      )}
    >
      {showIcon && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />}
      {label}
    </span>
  )
}
