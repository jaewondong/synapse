'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import type { OrderSet, CatalogItem } from '@/lib/types/labs'

interface OrderSetPickerProps {
  orderSets: OrderSet[]
  catalog: CatalogItem[]
  pendedCodes: Set<string>
  onAddSet: (items: CatalogItem[]) => void
}

export function OrderSetPicker({ orderSets, catalog, pendedCodes, onAddSet }: OrderSetPickerProps) {
  const catalogMap = new Map(catalog.map((c) => [c.code, c]))

  const handleAddSet = (os: OrderSet) => {
    const items = os.memberCodes
      .map((code) => catalogMap.get(code))
      .filter((item): item is CatalogItem => item !== undefined && !pendedCodes.has(item.code))
    onAddSet(items)
  }

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4 mt-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
        Order sets
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {orderSets.map((os) => {
          const available = os.memberCodes.filter((c) => catalogMap.has(c))
          const newCount = available.filter((c) => !pendedCodes.has(c)).length
          return (
            <button
              key={os.id}
              onClick={() => handleAddSet(os)}
              disabled={newCount === 0}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                newCount === 0
                  ? 'border-border bg-muted/40 text-muted-foreground cursor-default'
                  : 'border-border hover:border-accent/40 hover:bg-accent/5'
              }`}
            >
              <div className="min-w-0">
                <p className="text-[12px] font-medium truncate">{os.name}</p>
                <p className="text-[10px] text-chart-subtle mt-0.5">
                  {newCount === 0
                    ? 'All added'
                    : `${newCount} test${newCount !== 1 ? 's' : ''}`}
                  {os.setting !== 'both' && ` · ${os.setting === 'out' ? 'Outpatient' : 'Inpatient'}`}
                </p>
              </div>
              {newCount > 0 && (
                <Plus className="h-3.5 w-3.5 shrink-0 text-accent" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
