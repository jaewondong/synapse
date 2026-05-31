import type { CatalogItem } from '@/lib/types/labs'

export function searchCatalog(catalog: CatalogItem[], query: string, category?: string): CatalogItem[] {
  let results = catalog

  if (category) {
    results = results.filter((item) => item.category === category)
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase()
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.aliases.some((a) => a.toLowerCase().includes(q)) ||
        (item.cpt && item.cpt.includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
    )
  }

  return results
}
