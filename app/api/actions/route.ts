import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const actions = await prisma.agentActionRecord.findMany({
    where: { status: 'pending' },
    orderBy: { actionTimestamp: 'desc' },
    include: { decisions: { orderBy: { decidedAt: 'desc' }, take: 1 } },
  })
  return NextResponse.json(actions)
}
