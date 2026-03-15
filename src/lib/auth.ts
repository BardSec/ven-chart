// NextAuth configuration with Microsoft Entra ID (Azure AD)

import { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: true,

  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      allowDangerousEmailAccountLinking: true,
      // Request profile and email scopes
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours — typical school work day
  },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, load user data from DB into the token
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, department: true, isActive: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.department = dbUser.department
          token.isActive = dbUser.isActive
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.department = token.department as string | null
        session.user.isActive = token.isActive as boolean
      }
      return session
    },

    async signIn({ user }) {
      if (!user.email) return false

      try {
        // Check if this is the designated admin email
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
        if (adminEmail && user.email.toLowerCase() === adminEmail) {
          // Ensure admin role is set
          await prisma.user.updateMany({
            where: { email: user.email },
            data: { role: Role.ADMIN },
          })
        }

        // Check if user is active (admins can deactivate users)
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true },
        })

        if (existingUser && !existingUser.isActive) {
          // User has been deactivated
          return false
        }
      } catch (err) {
        console.error('[auth] signIn callback error', err)
        return false
      }

      return true
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },

  events: {
    async createUser({ user }) {
      // New user created — log it (non-blocking: never let this crash sign-in)
      try {
        await prisma.activityLog.create({
          data: {
            entityType: 'user',
            entityId: user.id,
            entityName: user.email ?? 'Unknown',
            userEmail: user.email,
            userName: user.name ?? user.email,
            action: 'created',
            metadata: { note: 'User account created via Microsoft SSO' },
          },
        })
      } catch (err) {
        console.error('[auth] createUser event: failed to write activity log', err)
      }
    },
  },
}

// Type augmentation for next-auth session and JWT
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      department: string | null
      isActive: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    department: string | null
    isActive: boolean
  }
}
