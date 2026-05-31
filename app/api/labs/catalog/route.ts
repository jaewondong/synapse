import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { searchCatalog } from '@/lib/db/labs'
import type { CatalogItem } from '@/lib/types/labs'

function mapItem(item: {
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
    defaultPriority: item.defaultPriority as CatalogItem['defaultPriority'],
    isPanel: item.isPanel,
    panelComponents,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? undefined

  const raw = await prisma.labCatalogItem.findMany({ orderBy: { name: 'asc' } })
  const catalog = raw.map(mapItem)
  const results = searchCatalog(catalog, query, category)

  return NextResponse.json(results)
}
