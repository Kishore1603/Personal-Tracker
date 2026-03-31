import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // Fetch fresh user data for level/points
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { level: true, totalPoints: true },
        })
        if (dbUser) {
          session.user.level = dbUser.level
          session.user.totalPoints = dbUser.totalPoints
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
}
