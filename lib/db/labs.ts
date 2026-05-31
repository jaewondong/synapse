import { prisma } from '@/lib/db/prisma'
export { searchCatalog } from '@/lib/labs/catalog'
import type {
  CatalogItem,
  OrderSet,
  PerformingLocation,
  QuestPsc,
  LabOrder,
  LabsData,
  OrderSetting,
  OrderPriority,
  OrderFrequency,
  LocationType,
  OrderStatus,
} from '@/lib/types/labs'

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapCatalogItem(item: {
  code: string
  name: string
  aliases: string | null
  category: string
  specimen: string | null
  cpt: string | null
  setting: string
  fastingRequired: boolean
  sendOut: boolean
  defaultPriority: string
  isPanel: boolean
  panelComponents: string | null
}): CatalogItem {
  let panelComponents: string[] = []
  if (item.panelComponents) {
    try { panelComponents = JSON.parse(item.panelComponents) } catch { panelComponents = [] }
  }
  return {
    code: item.code,
    name: item.name,
    aliases: item.aliases ? item.aliases.split(',').map((a) => a.trim()).filter(Boolean) : [],
    category: item.category,
    specimen: item.specimen ?? '',
    cpt: item.cpt ?? undefined,
    setting: item.setting as CatalogItem['setting'],
    fastingRequired: item.fastingRequired,
    sendOut: item.sendOut,
    defaultPriority: (item.defaultPriority ?? 'routine') as CatalogItem['defaultPriority'],
    isPanel: item.isPanel,
    panelComponents,
  }
}

function mapOrderSet(os: { id: string; name: string; setting: string; memberCodes: string }): OrderSet {
  let memberCodes: string[] = []
  try { memberCodes = JSON.parse(os.memberCodes) } catch { memberCodes = [] }
  return {
    id: os.id,
    name: os.name,
    setting: os.setting as OrderSet['setting'],
    memberCodes,
  }
}

function mapLocation(loc: {
  id: string
  type: string
  name: string
  address: string | null
  active: boolean
}): PerformingLocation {
  return {
    id: loc.id,
    type: loc.type as LocationType,
    name: loc.name,
    address: loc.address ?? undefined,
    active: loc.active,
  }
}

function mapPsc(psc: {
  id: string
  name: string
  address: string
  zip: string
  hours: string | null
  lat: number | null
  lng: number | null
  performingLocationId: string
}): QuestPsc {
  return {
    id: psc.id,
    name: psc.name,
    address: psc.address,
    zip: psc.zip,
    hours: psc.hours ?? undefined,
    lat: psc.lat ?? undefined,
    lng: psc.lng ?? undefined,
    performingLocationId: psc.performingLocationId,
  }
}

function mapLabOrder(
  order: {
    id: string
    patientId: string
    catalogCode: string
    setting: string
    priority: string
    frequency: string
    futureDate: string | null
    indicationIcd: string | null
    indicationText: string | null
    performingLocationId: string | null
    pscId: string | null
    status: string
    pendedBy: string | null
    pendedByType: string | null
    pendedByAgentName: string | null
    pendedByRationale: string | null
    releasedBy: string | null
    orderedAt: string
    releasedAt: string | null
    modifiedByType: string | null
    modifiedByAgentName: string | null
    notes: string | null
  },
  catalogItem: CatalogItem,
  location?: PerformingLocation
): LabOrder {
  return {
    id: order.id,
    patientId: order.patientId,
    catalogCode: order.catalogCode,
    catalogItem,
    setting: order.setting as OrderSetting,
    priority: order.priority as OrderPriority,
    frequency: order.frequency as OrderFrequency,
    futureDate: order.futureDate ?? undefined,
    indicationIcd: order.indicationIcd ?? undefined,
    indicationText: order.indicationText ?? undefined,
    performingLocationId: order.performingLocationId ?? undefined,
    performingLocation: location,
    pscId: order.pscId ?? undefined,
    status: order.status as OrderStatus,
    pendedBy: order.pendedBy ?? undefined,
    pendedByType: (order.pendedByType ?? undefined) as LabOrder['pendedByType'],
    pendedByAgentName: order.pendedByAgentName ?? undefined,
    pendedByRationale: order.pendedByRationale ?? undefined,
    releasedBy: order.releasedBy ?? undefined,
    orderedAt: order.orderedAt,
    releasedAt: order.releasedAt ?? undefined,
    modifiedByType: (order.modifiedByType ?? undefined) as LabOrder['modifiedByType'],
    modifiedByAgentName: order.modifiedByAgentName ?? undefined,
    notes: order.notes ?? undefined,
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getLabsData(mrn: string): Promise<LabsData> {
  const patient = await prisma.patient.findUnique({
    where: { mrn },
    select: { id: true },
  })

  const [catalog, orderSets, locations, pscs, rawOrders] = await Promise.all([
    prisma.labCatalogItem.findMany({ orderBy: { name: 'asc' } }),
    prisma.labOrderSet.findMany({ orderBy: { name: 'asc' } }),
    prisma.performingLocation.findMany({ where: { active: true } }),
    prisma.questPsc.findMany(),
    patient
      ? prisma.labOrder.findMany({
          where: { patientId: patient.id, status: { not: 'cancelled' } },
          orderBy: { orderedAt: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const catalogMap = new Map(catalog.map((c) => [c.code, mapCatalogItem(c)]))
  const locationMap = new Map(locations.map((l) => [l.id, mapLocation(l)]))

  const orders = rawOrders
    .map((o) => {
      const item = catalogMap.get(o.catalogCode)
      if (!item) return null
      const loc = o.performingLocationId ? locationMap.get(o.performingLocationId) : undefined
      return mapLabOrder(o, item, loc)
    })
    .filter((o): o is LabOrder => o !== null)

  return {
    orders,
    performingLocations: locations.map(mapLocation),
    questPscs: pscs.map(mapPsc),
    catalog: catalog.map(mapCatalogItem),
    orderSets: orderSets.map(mapOrderSet),
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createLabOrder(params: {
  mrn: string
  catalogCode: string
  setting: string
  priority?: string
  frequency?: string
  indicationIcd?: string
  indicationText?: string
  performingLocationId?: string
  pscId?: string
  pendedByType: 'agent' | 'human'
  pendedByAgentName?: string
  pendedByRationale?: string
  pendedBy?: string
  notes?: string
}): Promise<LabOrder | null> {
  const patient = await prisma.patient.findUnique({
    where: { mrn: params.mrn },
    select: { id: true },
  })
  if (!patient) return null

  const catalogItem = await prisma.labCatalogItem.findUnique({
    where: { code: params.catalogCode },
  })
  if (!catalogItem) return null

  const order = await prisma.labOrder.create({
    data: {
      patientId: patient.id,
      catalogCode: params.catalogCode,
      setting: params.setting,
      priority: params.priority ?? catalogItem.defaultPriority,
      frequency: params.frequency ?? 'once',
      indicationIcd: params.indicationIcd,
      indicationText: params.indicationText,
      performingLocationId: params.performingLocationId,
      pscId: params.pscId,
      status: 'pended',
      pendedBy: params.pendedBy,
      pendedByType: params.pendedByType,
      pendedByAgentName: params.pendedByAgentName,
      pendedByRationale: params.pendedByRationale,
      orderedAt: new Date().toISOString(),
      modifiedByType: params.pendedByType,
      modifiedByAgentName: params.pendedByAgentName,
      notes: params.notes,
    },
  })

  let loc: PerformingLocation | undefined
  if (order.performingLocationId) {
    const raw = await prisma.performingLocation.findUnique({ where: { id: order.performingLocationId } })
    if (raw) loc = mapLocation(raw)
  }

  return mapLabOrder(order, mapCatalogItem(catalogItem), loc)
}

export async function updateLabOrder(
  id: string,
  updates: Partial<{
    setting: string
    priority: string
    frequency: string
    futureDate: string | null
    indicationIcd: string | null
    indicationText: string | null
    performingLocationId: string | null
    pscId: string | null
    notes: string | null
  }>
): Promise<boolean> {
  try {
    await prisma.labOrder.update({ where: { id }, data: updates })
    return true
  } catch {
    return false
  }
}

export async function cancelLabOrder(id: string): Promise<boolean> {
  try {
    await prisma.labOrder.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date().toISOString() },
    })
    return true
  } catch {
    return false
  }
}

export async function releaseLabOrders(
  ids: string[],
  releasedBy: string
): Promise<{ released: string[]; failed: string[] }> {
  const released: string[] = []
  const failed: string[] = []

  for (const id of ids) {
    try {
      await prisma.labOrder.update({
        where: { id, status: 'pended' },
        data: {
          status: 'released',
          releasedBy,
          releasedAt: new Date().toISOString(),
        },
      })
      released.push(id)
    } catch {
      failed.push(id)
    }
  }

  return { released, failed }
}

