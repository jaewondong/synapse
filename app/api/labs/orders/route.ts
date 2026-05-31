import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLabOrder } from '@/lib/db/labs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mrn = searchParams.get('mrn')
  if (!mrn) return NextResponse.json({ error: 'mrn required' }, { status: 400 })

  const patient = await prisma.patient.findUnique({ where: { mrn }, select: { id: true } })
  if (!patient) return NextResponse.json({ orders: [] })

  const orders = await prisma.labOrder.findMany({
    where: { patientId: patient.id, status: { not: 'cancelled' } },
    include: {
      catalogItem: true,
      performingLocation: true,
    },
    orderBy: { orderedAt: 'desc' },
  })

  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    mrn,
    catalogCode,
    setting,
    priority,
    frequency,
    indicationIcd,
    indicationText,
    performingLocationId,
    pscId,
    pendedByType,
    pendedByAgentName,
    pendedByRationale,
    pendedBy,
    notes,
  } = body

  if (!mrn || !catalogCode) {
    return NextResponse.json({ error: 'mrn and catalogCode required' }, { status: 400 })
  }

  const order = await createLabOrder({
    mrn,
    catalogCode,
    setting: setting ?? 'out',
    priority,
    frequency,
    indicationIcd,
    indicationText,
    performingLocationId,
    pscId,
    pendedByType: pendedByType ?? 'human',
    pendedByAgentName,
    pendedByRationale,
    pendedBy: pendedBy ?? 'user',
    notes,
  })

  if (!order) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  return NextResponse.json({ order }, { status: 201 })
}
