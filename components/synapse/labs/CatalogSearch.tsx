'use client'

import * as React from 'react'
import { Search, Plus, Send, Check } from 'lucide-react'
import { searchCatalog } from '@/lib/labs/catalog'
import type { CatalogItem, LabOrder } from '@/lib/types/labs'

interface CatalogSearchProps {
  catalog: CatalogItem[]
  pendedCodes: Set<string>
  onAdd: (item: CatalogItem) => void
  searchRef?: React.RefObject<HTMLInputElement | null>
}

const ALL_CATEGORIES = [
  'Chemistry & metabolic',
  'Vitamins & nutrition',
  'Hematology',
  'Coagulation',
  'Urinalysis & urine',
  'Blood gas / critical care',
  'Cardiac',
  'Endocrine',
  'Infectious disease',
  'Microbiology cultures',
  'Tumor markers',
  'Autoimmune & rheumatology',
  'Toxicology & drug monitoring',
  'Blood bank / transfusion',
  'Body fluid analysis',
  'GI & stool',
  'Prenatal / OB',
  'Genetics & molecular',
]

export function CatalogSearch({ catalog, pendedCodes, onAdd, searchRef }: CatalogSearchProps) {
  const [query, setQuery] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)

  const results = React.useMemo(
    () => searchCatalog(catalog, query, activeCategory ?? undefined).slice(0, 30),
    [catalog, query, activeCategory]
  )

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
        Catalog search
      </p>

      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, alias, or CPT..."
          className="w-full rounded-lg border border-border bg-muted/40 pl-8 pr-3 py-1.5 text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Category tabs */}
      {!query && (
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
              activeCategory === null
                ? 'bg-accent text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-0 max-h-64 overflow-y-auto -mx-4 px-4">
        {results.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            {query ? 'No tests match your search' : 'Select a category or type to search'}
          </p>
        ) : (
          results.map((item, i) => {
            const alreadyPended = pendedCodes.has(item.code)
            return (
              <div
                key={item.code}
                className={`flex items-center gap-2 py-2 text-[12px] ${
                  i < results.length - 1 ? 'border-b border-black/[0.04]' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.sendOut && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] text-chart-info-text bg-chart-info-bg rounded px-1 py-0.5">
                        <Send className="h-2 w-2" />
                        Send-out
                      </span>
                    )}
                    {item.fastingRequired && (
                      <span className="shrink-0 text-[9px] text-chart-warning-text bg-chart-warning-bg rounded px-1 py-0.5">
                        Fasting
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-chart-subtle mt-0.5 truncate">
                    {[item.category, item.specimen].filter(Boolean).join(' · ')}
                    {item.cpt && ` · CPT ${item.cpt}`}
                  </p>
                </div>
                <button
                  onClick={() => !alreadyPended && onAdd(item)}
                  disabled={alreadyPended}
                  className={`shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    alreadyPended
                      ? 'bg-chart-success-bg text-chart-success-text cursor-default'
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                  }`}
                >
                  {alreadyPended ? (
                    <>
                      <Check className="h-3 w-3" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Add
                    </>
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
