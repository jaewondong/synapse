import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaBetterSqlite3({ url: 'file:./synapse.db' })
const prisma = new PrismaClient({ adapter })

interface RawTest {
  code: string
  name: string
  alias?: string
  category: string
  specimen?: string
  cpt?: string
  setting: string
  fasting?: boolean
  send_out?: boolean
  default_priority?: string
  panel_components?: string[]
}

interface RawOrderSet {
  id: string
  name: string
  setting: string
  members: string[]
}

interface CatalogSeed {
  tests: RawTest[]
  order_sets: RawOrderSet[]
}

const CATALOG_JSON = path.resolve(process.cwd(), 'synapse-labs-catalog.seed.json')
const RESET = process.argv.includes('--reset')

async function main() {
  const raw: CatalogSeed = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf-8'))

  if (RESET) {
    await prisma.$transaction([
      prisma.labOrder.deleteMany(),
      prisma.labCatalogItem.deleteMany(),
      prisma.labOrderSet.deleteMany(),
      prisma.questPsc.deleteMany(),
      prisma.performingLocation.deleteMany(),
    ])
    console.log('Reset: cleared all lab catalog data')
  }

  // ── Catalog items ──────────────────────────────────────────────────────────
  console.log(`Seeding ${raw.tests.length} catalog items...`)
  for (const t of raw.tests) {
    await prisma.labCatalogItem.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        aliases: t.alias ?? '',
        category: t.category,
        specimen: t.specimen ?? '',
        cpt: t.cpt ?? null,
        setting: t.setting,
        fastingRequired: t.fasting ?? false,
        sendOut: t.send_out ?? false,
        defaultPriority: t.default_priority ?? 'routine',
        isPanel: Array.isArray(t.panel_components) && t.panel_components.length > 0,
        panelComponents: t.panel_components ? JSON.stringify(t.panel_components) : null,
      },
      create: {
        code: t.code,
        name: t.name,
        aliases: t.alias ?? '',
        category: t.category,
        specimen: t.specimen ?? '',
        cpt: t.cpt ?? null,
        setting: t.setting,
        fastingRequired: t.fasting ?? false,
        sendOut: t.send_out ?? false,
        defaultPriority: t.default_priority ?? 'routine',
        isPanel: Array.isArray(t.panel_components) && t.panel_components.length > 0,
        panelComponents: t.panel_components ? JSON.stringify(t.panel_components) : null,
      },
    })
  }
  console.log(`✓ ${raw.tests.length} catalog items seeded`)

  // ── Order sets ────────────────────────────────────────────────────────────
  console.log(`Seeding ${raw.order_sets.length} order sets...`)
  for (const os of raw.order_sets) {
    await prisma.labOrderSet.upsert({
      where: { id: os.id },
      update: {
        name: os.name,
        setting: os.setting,
        memberCodes: JSON.stringify(os.members),
      },
      create: {
        id: os.id,
        name: os.name,
        setting: os.setting,
        memberCodes: JSON.stringify(os.members),
      },
    })
  }
  console.log(`✓ ${raw.order_sets.length} order sets seeded`)

  // ── Performing locations ───────────────────────────────────────────────────
  const inHouse = await prisma.performingLocation.upsert({
    where: { id: 'loc-ghs-main' },
    update: { name: 'GHS Main Hospital Lab', type: 'in_house', address: '1001 Potrero Ave, San Francisco, CA 94110', active: true },
    create: { id: 'loc-ghs-main', name: 'GHS Main Hospital Lab', type: 'in_house', address: '1001 Potrero Ave, San Francisco, CA 94110', active: true },
  })

  const questLoc = await prisma.performingLocation.upsert({
    where: { id: 'loc-quest' },
    update: { name: 'Quest Diagnostics', type: 'reference:quest', active: true },
    create: { id: 'loc-quest', name: 'Quest Diagnostics', type: 'reference:quest', active: true },
  })
  console.log('✓ Performing locations seeded:', inHouse.name, '/', questLoc.name)

  // ── Quest PSCs (near Oakland 94610) ─────────────────────────────────────
  const pscs = [
    { id: 'psc-oak-broadway', name: 'Quest Diagnostics – Oakland Broadway', address: '1234 Broadway, Oakland, CA 94612', zip: '94612', hours: 'Mon–Fri 7 AM–4 PM', lat: 37.8044, lng: -122.2712 },
    { id: 'psc-oak-grand', name: 'Quest Diagnostics – Grand Lake', address: '3600 Grand Ave, Oakland, CA 94610', zip: '94610', hours: 'Mon–Fri 8 AM–3 PM', lat: 37.8101, lng: -122.2360 },
    { id: 'psc-berk-telegraph', name: 'Quest Diagnostics – Berkeley', address: '2999 Telegraph Ave, Berkeley, CA 94705', zip: '94705', hours: 'Mon–Sat 7 AM–5 PM', lat: 37.8591, lng: -122.2595 },
    { id: 'psc-sanleandro', name: 'Quest Diagnostics – San Leandro', address: '1100 Bancroft Ave, San Leandro, CA 94577', zip: '94577', hours: 'Mon–Fri 7:30 AM–4:30 PM', lat: 37.7249, lng: -122.1561 },
  ]

  for (const psc of pscs) {
    await prisma.questPsc.upsert({
      where: { id: psc.id },
      update: { ...psc, performingLocationId: questLoc.id },
      create: { ...psc, performingLocationId: questLoc.id },
    })
  }
  console.log(`✓ ${pscs.length} Quest PSCs seeded`)

  // ── Example orders for Robert Hernandez (HFrEF monitoring) ───────────────
  const robert = await prisma.patient.findUnique({ where: { mrn: '00731649' }, select: { id: true } })

  if (robert) {
    // Cancel any existing agent-pended orders first (idempotent re-seed)
    await prisma.labOrder.deleteMany({
      where: { patientId: robert.id, pendedByType: 'agent' },
    })

    const now = new Date().toISOString()
    const agentOrders = [
      {
        catalogCode: 'CHEM-BMP',
        setting: 'out',
        priority: 'routine',
        frequency: 'once',
        indicationIcd: 'I50.22',
        indicationText: 'HFrEF monitoring — BMP for renal function & electrolytes',
        performingLocationId: inHouse.id,
        pendedByRationale: 'BMP indicated for HFrEF monitoring per HF guideline. Last BMP 04/12/2026.',
      },
      {
        catalogCode: 'CHEM-MG',
        setting: 'out',
        priority: 'routine',
        frequency: 'once',
        indicationIcd: 'I50.22',
        indicationText: 'HFrEF monitoring — Mg gates MRA/ARNI dosing safety',
        performingLocationId: inHouse.id,
        pendedByRationale: 'Magnesium required to monitor safety of spironolactone + ARNI.',
      },
      {
        catalogCode: 'CARD-NTPROBNP',
        setting: 'out',
        priority: 'routine',
        frequency: 'once',
        indicationIcd: 'I50.22',
        indicationText: 'HFrEF — NT-proBNP trend monitoring',
        performingLocationId: inHouse.id,
        pendedByRationale: 'NT-proBNP trending down (3200 → 740 pg/mL over 2 years). Continue monitoring at each visit.',
      },
      {
        catalogCode: 'CHEM-LPA',
        setting: 'out',
        priority: 'routine',
        frequency: 'once',
        indicationIcd: 'I25.10',
        indicationText: 'CAD risk stratification — Lp(a) not previously measured',
        performingLocationId: questLoc.id,
        pscId: pscs[1].id,
        pendedByRationale: 'Lp(a) is a send-out test not available in-house. Elevated Lp(a) would change CAD risk management. Patient has not had Lp(a) tested.',
      },
    ]

    for (const o of agentOrders) {
      await prisma.labOrder.create({
        data: {
          patientId: robert.id,
          catalogCode: o.catalogCode,
          setting: o.setting,
          priority: o.priority,
          frequency: o.frequency,
          indicationIcd: o.indicationIcd,
          indicationText: o.indicationText,
          performingLocationId: o.performingLocationId,
          pscId: (o as { pscId?: string }).pscId ?? null,
          status: 'pended',
          pendedBy: 'Ordering Agent',
          pendedByType: 'agent',
          pendedByAgentName: 'Ordering Agent',
          pendedByRationale: o.pendedByRationale,
          orderedAt: now,
          modifiedByType: 'agent',
          modifiedByAgentName: 'Ordering Agent',
        },
      })
    }

    // One already-resulted order for duplicate-check demo
    await prisma.labOrder.create({
      data: {
        patientId: robert.id,
        catalogCode: 'CHEM-CMP',
        setting: 'out',
        priority: 'routine',
        frequency: 'once',
        indicationIcd: 'I50.22',
        indicationText: 'CMP resulted 04/12/2026',
        performingLocationId: inHouse.id,
        status: 'resulted',
        pendedBy: 'Dr. Bell',
        pendedByType: 'human',
        orderedAt: '2026-04-10T09:00:00.000Z',
        releasedAt: '2026-04-10T09:05:00.000Z',
        releasedBy: 'Dr. Bell',
      },
    })

    console.log('✓ Example orders seeded for Robert Hernandez (MRN 00731649)')
  } else {
    console.log('⚠ Robert Hernandez (MRN 00731649) not found — run npm run seed:mock-patients first')
  }

  console.log('\nDone. Lab catalog, locations, PSCs, and example orders seeded.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
