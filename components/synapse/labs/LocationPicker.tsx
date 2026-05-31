'use client'

import * as React from 'react'
import { MapPin, Building2 } from 'lucide-react'
import type { PerformingLocation, QuestPsc, OrderSetting } from '@/lib/types/labs'

interface LocationPickerProps {
  setting: OrderSetting
  onSettingChange: (s: OrderSetting) => void
  performingLocations: PerformingLocation[]
  questPscs: QuestPsc[]
  selectedLocationId?: string
  onLocationChange: (id: string) => void
  selectedPscId?: string
  onPscChange: (id: string) => void
  compact?: boolean
}

export function LocationPicker({
  setting,
  onSettingChange,
  performingLocations,
  questPscs,
  selectedLocationId,
  onLocationChange,
  selectedPscId,
  onPscChange,
  compact,
}: LocationPickerProps) {
  const selectedLoc = performingLocations.find((l) => l.id === selectedLocationId)
  const isQuest = selectedLoc?.type === 'reference:quest'

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {/* Setting toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 w-fit">
        {(['out', 'in'] as OrderSetting[]).map((s) => (
          <button
            key={s}
            onClick={() => onSettingChange(s)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              setting === s
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'out' ? 'Outpatient' : 'Inpatient'}
          </button>
        ))}
      </div>

      {/* Performing location */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          Performing location
        </p>
        <select
          value={selectedLocationId ?? ''}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full rounded-md border border-border bg-card text-[12px] px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— Select —</option>
          {performingLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quest PSC selection (outpatient + Quest) */}
      {isQuest && setting === 'out' && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-chart-subtle flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Patient service center
          </p>
          <select
            value={selectedPscId ?? ''}
            onChange={(e) => onPscChange(e.target.value)}
            className="w-full rounded-md border border-border bg-card text-[12px] px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Patient will choose / walk-in</option>
            {questPscs.map((psc) => (
              <option key={psc.id} value={psc.id}>
                {psc.name} · {psc.hours ?? 'Hours vary'}
              </option>
            ))}
          </select>
          {selectedPscId && (
            <p className="text-[10px] text-chart-subtle flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {questPscs.find((p) => p.id === selectedPscId)?.address}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
