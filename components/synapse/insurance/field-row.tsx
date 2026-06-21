'use client'

import * as React from 'react'
import { cn, safeFormatDate } from '@/lib/utils'
import type { ExtractedField } from '@/lib/types/insurance'
import { ConfidenceDot } from './confidence-dot'

interface FieldRowProps {
  label: string
  field: ExtractedField<unknown>
  value: string
  edited: boolean
  agentName: string
  extractedAt: string
  onChange: (value: string) => void
  onFocus: () => void
  onOpenAudit: () => void
}

// One extracted field: editable value + confidence dot + provenance + audit link.
// Low-confidence and conflicting fields carry amber weight (§1.2.2).
export function FieldRow({
  label,
  field,
  value,
  edited,
  agentName,
  extractedAt,
  onChange,
  onFocus,
  onOpenAudit,
}: FieldRowProps) {
  const needsAttention = field.confidence === 'low' || !!field.validationNote
  const dateStr = safeFormatDate(extractedAt)

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        needsAttention
          ? 'border-chart-warning-text/40 bg-chart-warning-bg/40'
          : 'border-black/[0.06] bg-white',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          <ConfidenceDot confidence={edited ? 'high' : field.confidence} />
          {label}
        </label>
      </div>
      <input
        type="text"
        value={value}
        placeholder="—"
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className="mt-0.5 w-full bg-transparent text-[13px] focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1 placeholder:text-muted-foreground/50"
      />
      {/* Provenance: agent-extracted ⌁ flips to ✓ on human correction (§1.6). B2: empties filtered before · joins. */}
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-chart-subtle">
        {[
          edited ? '✓ you' : `⌁ ${agentName}`,
          !edited && dateStr ? dateStr : '',
        ]
          .filter(Boolean)
          .map((part, i) => (
            <React.Fragment key={part}>
              {i > 0 && <span>·</span>}
              <span>{part}</span>
            </React.Fragment>
          ))}
        <span>·</span>
        <button
          type="button"
          onClick={onOpenAudit}
          className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
        >
          audit
        </button>
      </div>
      {field.validationNote && (
        <p className="mt-1 text-[11px] text-chart-warning-text">{field.validationNote}</p>
      )}
    </div>
  )
}
