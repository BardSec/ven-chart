'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { LogOut, Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
        {description && (
          <p className="text-xs text-gray-500 leading-tight">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {/* Sign out */}
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        )}
      </div>
    </header>
  )
}
