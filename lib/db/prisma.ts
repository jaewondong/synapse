import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const dbUrl = `file:${path.resolve(process.cwd(), 'synapse.db')}`

let _client: PrismaClient | undefined

function getClient(): PrismaClient {
  if (!_client) {
    _client = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: dbUrl }),
    })
  }
  return _client
}

// Lazy proxy: defers PrismaClient construction to first use (request time),
// avoiding a Turbopack startup-phase issue where import.meta.url is not a
// file:// URL and Prisma's schema parser silently produces empty model delegates.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getClient() as any)[prop as string]
  },
})
