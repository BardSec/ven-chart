'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon?: ReactNode
  href?: string
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'neutral'
  className?: string
}

const VARIANTS = {
  default: {
    card: 'border-gray-200',
    icon: 'bg-brand-50 text-brand-600',
    value: 'text-gray-900',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50/50',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-800',
  },
  danger: {
    card: 'border-red-200 bg-red-50/50',
    icon: 'bg-red-100 text-red-700',
    value: 'text-red-700',
  },
  success: {
    card: 'border-green-200 bg-green-50/50',
    icon: 'bg-green-100 text-green-700',
    value: 'text-green-800',
  },
  neutral: {
    card: 'border-gray-200',
    icon: 'bg-gray-100 text-gray-500',
    value: 'text-gray-700',
  },
}

export function StatCard({ title, value, description, icon, href, variant = 'default', className }: StatCardProps) {
  const styles = VARIANTS[variant]

  const content = (
    <div className={cn(
      'rounded-lg border bg-white p-5 transition-shadow',
      styles.card,
      href && 'hover:shadow-sm cursor-pointer',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className={cn('mt-1 text-2xl font-bold', styles.value)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn('rounded-lg p-2.5', styles.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
