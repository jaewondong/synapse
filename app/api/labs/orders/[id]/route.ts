import { NextRequest, NextResponse } from 'next/server'
import { updateLabOrder, cancelLabOrder } from '@/lib/db/labs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const ok = await updateLabOrder(id, body)
  if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ok = await cancelLabOrder(id)
  if (!ok) return NextResponse.json({ error: 'Cancel failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
