import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { BulkDecideSchema } from '@/lib/api/schemas'

const DECIDED_BY = 'codyypham@berkeley.edu'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = BulkDecideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { ids, operation, reason } = parsed.data

  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    snooze: 'deferred',
  }

  const decisions = await prisma.$transaction(
    ids.flatMap((id) => [
      prisma.decision.create({
        data: { actionId: id, operation, reason: reason ?? null, decidedBy: DECIDED_BY },
      }),
      prisma.agentActionRecord.update({
        where: { id },
        data: { status: statusMap[operation] },
      }),
    ])
  )

  const created = decisions.filter((d) => 'operation' in d)
  return NextResponse.json(created)
}
