import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { DecideSchema } from '@/lib/api/schemas'

const DECIDED_BY = 'codyypham@berkeley.edu'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const body = await request.json()
  const parsed = DecideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { operation, reason } = parsed.data

  const action = await prisma.agentActionRecord.findUnique({ where: { id } })
  if (!action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 })
  }

  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    snooze: 'deferred',
  }

  const [decision] = await prisma.$transaction([
    prisma.decision.create({
      data: { actionId: id, operation, reason: reason ?? null, decidedBy: DECIDED_BY },
    }),
    prisma.agentActionRecord.update({
      where: { id },
      data: { status: statusMap[operation] },
    }),
  ])

  return NextResponse.json(decision)
}
