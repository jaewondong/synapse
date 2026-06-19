'use client'

import * as React from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtractedField } from '@/lib/types/insurance'

interface ConflictDiffProps {
  label: string
  field: ExtractedField<unknown>
  extractedValue: string
  resolution: 'keep' | 'replace' | null
  onResolve: (resolution: 'keep' | 'replace') => void
  onFocus: () => void
  onOpenAudit: () => void
}

// Side-by-side diff for a field that differs from coverage on file (§2.6.3.3).
// Requires an explicit keep/replace choice before the extraction can be approved.
export function ConflictDiff({
  label,
  field,
  extractedValue,
  resolution,
  onResolve,
  onFocus,
  onOpenAudit,
}: ConflictDiffProps) {
  return (
    <div
      className="rounded-lg border border-chart-warning-text/50 bg-chart-warning-bg/60 px-3 py-2.5"
      onClick={onFocus}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-warning-text">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          {label} — conflicts with coverage on file
        </p>
        <button
          type="button"
          onClick={onOpenAudit}
          className="text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground transition-colors"
        >
          audit
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onResolve('keep')}
          className={cn(
            'rounded-lg border px-2.5 py-2 text-left transition-colors',
            resolution === 'keep'
              ? 'border-accent bg-surface ring-1 ring-accent'
              : 'border-border-hairline bg-surface/70 hover:bg-surface',
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.5px] text-chart-subtle">On file</p>
          <p className="text-[13px] font-medium">{field.onFileValue || '—'}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {resolution === 'keep' ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3" aria-hidden /> Keeping this
              </span>
            ) : (
              'Keep'
            )}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onResolve('replace')}
          className={cn(
            'rounded-lg border px-2.5 py-2 text-left transition-colors',
            resolution === 'replace'
              ? 'border-accent bg-surface ring-1 ring-accent'
              : 'border-border-hairline bg-surface/70 hover:bg-surface',
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.5px] text-chart-subtle">Extracted</p>
          <p className="text-[13px] font-medium">{extractedValue || '—'}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {resolution === 'replace' ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3" aria-hidden /> Replacing with this
              </span>
            ) : (
              'Replace'
            )}
          </p>
        </button>
      </div>
    </div>
  )
}
