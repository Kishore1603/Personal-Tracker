import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      level: number
      totalPoints: number
    } & DefaultSession['user']
  }

  interface JWT {
    id: string
    level: number
    totalPoints: number
  }
}
