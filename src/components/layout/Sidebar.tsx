'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  FileText,
  CalendarClock,
  ArrowUpDown,
  Settings,
  Users,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Vendors',
    href: '/vendors',
    icon: Building2,
  },
  {
    label: 'Contracts',
    href: '/contracts',
    icon: FileText,
  },
  {
    label: 'Renewals',
    href: '/renewals',
    icon: CalendarClock,
  },
  {
    label: 'Import / Export',
    href: '/import-export',
    icon: ArrowUpDown,
    adminOnly: true,
  },
]

const ADMIN_ITEMS = [
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Settings',
    href: '/admin',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const districtName = process.env.NEXT_PUBLIC_DISTRICT_NAME ?? 'School District'

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-[#1e3a5f] text-white">
      {/* Logo / District name */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 font-bold text-white text-sm">
          VC
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">ven-chart</div>
          <div className="truncate text-xs text-blue-200 leading-tight">{districtName}</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {isActive(item.href) && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Admin
            </div>
            <ul className="space-y-0.5">
              {ADMIN_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-white/15 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    )}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User info */}
      {session?.user && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-xs font-semibold text-white flex-shrink-0">
              {session.user.name
                ? session.user.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())
                    .join('')
                : session.user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-white">{session.user.name ?? session.user.email}</div>
              <div className="truncate text-xs text-blue-300 capitalize">{session.user.role?.toLowerCase().replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
