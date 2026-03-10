// Protect all routes — redirect to sign-in if not authenticated

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // All routes handled by withAuth callback below
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        // Token exists = user is authenticated
        return !!token
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

// Apply to all routes except auth and static files
export const config = {
  matcher: [
    '/((?!auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
