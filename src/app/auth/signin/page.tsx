import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SignInButton } from './SignInButton'

export const metadata = { title: 'Sign In' }

interface SearchParams {
  error?: string
  callbackUrl?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Could not initiate sign-in. Try again.',
  OAuthCallback: 'Error during sign-in. Try again.',
  OAuthCreateAccount: 'Could not create an account.',
  EmailCreateAccount: 'Could not create an account.',
  Callback: 'Sign-in error.',
  OAuthAccountNotLinked: 'This email is already associated with another account.',
  AccessDenied: 'Your account does not have access to this application.',
  default: 'An error occurred during sign-in.',
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions)
  if (session) redirect('/')

  const error = searchParams.error
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default) : null

  const districtName = process.env.NEXT_PUBLIC_DISTRICT_NAME ?? 'School District'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white text-2xl font-bold shadow-lg mb-4">
            VC
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ven-chart</h1>
          <p className="text-sm text-gray-500 mt-1">{districtName} · Vendor & Contract Management</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in to ven-chart</h2>
          <p className="text-sm text-gray-500 mb-6">
            Use your district Microsoft account to continue.
          </p>

          {errorMessage && (
            <div className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <strong>Sign-in error:</strong> {errorMessage}
            </div>
          )}

          <SignInButton />

          <p className="mt-6 text-xs text-center text-gray-400">
            Access restricted to authorized district staff.<br />
            Contact your IT administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
