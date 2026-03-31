import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure pgbouncer=true is always set to avoid prepared statement conflicts
// with Supabase's PgBouncer in transaction mode
function buildDatasourceUrl() {
  const url = process.env.DATABASE_URL ?? ''
  if (url.includes('pgbouncer=true')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}pgbouncer=true&connection_limit=1`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: { db: { url: buildDatasourceUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
