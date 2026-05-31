import { NextRequest, NextResponse } from 'next/server'
import { releaseLabOrders } from '@/lib/db/labs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ids, releasedBy } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  const result = await releaseLabOrders(ids, releasedBy ?? 'physician')
  return NextResponse.json(result)
}
