import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params
  const decisions = await prisma.decision.findMany({
    where: { actionId },
    orderBy: { decidedAt: 'desc' },
  })
  return NextResponse.json(decisions)
}
