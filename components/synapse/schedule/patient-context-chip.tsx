'use client'

import { X, ExternalLink, AlertTriangle } from 'lucide-react'

interface PatientContextChipProps {
  mrn: string
  name: string
  initials: string
  sex: string
  age: number
  allergyCount: number
  returnTo: string
  onClear: () => void
}

export function PatientContextChip({
  mrn,
  name,
  initials,
  sex,
  age,
  allergyCount,
  returnTo,
  onClear,
}: PatientContextChipProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-chart-info-bg border-b border-chart-info-text/20 shrink-0">
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full bg-chart-info-text/10 text-chart-info-text font-medium text-sm shrink-0"
        style={{ width: 32, height: 32 }}
      >
        {initials}
      </div>

      {/* Patient info */}
      <div className="flex flex-1 min-w-0 items-center gap-2 flex-wrap">
        <a
          href={returnTo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-chart-info-text hover:underline"
        >
          {name}
        </a>
        <span className="text-xs text-chart-info-text/70">
          {sex} · {age}yo
        </span>
        <span className="text-xs text-chart-info-text/60">MRN {mrn}</span>
        {allergyCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-chart-warning-bg text-chart-warning-text px-1.5 py-0.5 text-[10px] font-medium">
            <AlertTriangle className="h-2.5 w-2.5" />
            {allergyCount} {allergyCount === 1 ? 'allergy' : 'allergies'}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href={returnTo}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-chart-info-text/70 hover:text-chart-info-text transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View chart
        </a>
        <button
          onClick={onClear}
          title="Clear patient context"
          className="flex items-center gap-1 text-xs text-chart-info-text/60 hover:text-chart-info-text transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
    </div>
  )
}
