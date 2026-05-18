import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { AuditQuerySchema } from '@/lib/api/schemas'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = AuditQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { page, limit, operation, search } = parsed.data
  const skip = (page - 1) * limit

  const where = {
    ...(operation !== 'all' ? { operation } : {}),
    ...(search
      ? {
          action: {
            OR: [
              { patientName: { contains: search } },
              { agentName: { contains: search } },
              { summary: { contains: search } },
            ],
          },
        }
      : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.decision.findMany({
      where,
      include: { action: true },
      orderBy: { decidedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.decision.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit })
}
