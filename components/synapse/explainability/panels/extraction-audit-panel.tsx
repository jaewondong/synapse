import { cn } from '@/lib/utils'
import { PROVENANCE_GLYPH, type ExtractedFieldAudit } from '@/lib/explainability'
import { ConfidenceDot } from '@/components/synapse/insurance/confidence-dot'
import type { PanelProps } from '../panel-registry'
import { SectionLabel } from './section-label'

const RESOLUTION_LABELS: Record<NonNullable<ExtractedFieldAudit['resolution']>, string> = {
  replaced: 'replaced',
  kept_on_file: 'kept on file',
  new: 'new',
}

const RESOLUTION_STYLES: Record<NonNullable<ExtractedFieldAudit['resolution']>, string> = {
  replaced: 'bg-chart-info-bg text-chart-info-text',
  kept_on_file: 'bg-chart-neutral-bg text-chart-neutral-text',
  new: 'bg-chart-success-bg text-chart-success-text',
}

// Post-commit provenance for an insurance extraction (§2.7.6.3) — explains what
// got committed. The pre-commit two-pane verify flow (§2.6) is its own surface.
export function ExtractionAuditPanel({ payload }: PanelProps) {
  if (payload.kind !== 'extraction') return null
  const p = payload

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 text-sm break-words">{p.documentLabel}</p>
          <span className="shrink-0 rounded-lg bg-muted px-2 py-0.5 text-[11px] font-medium">
            Commit v{p.commitVersion}
          </span>
        </div>
        {/* Human glyph — extraction commits are human-verified (locked) */}
        <p className="mt-1 text-xs text-muted-foreground">
          {PROVENANCE_GLYPH.human} Verified by {p.committedBy}
        </p>
      </section>

      <section>
        <SectionLabel>Committed fields</SectionLabel>
        <div className="divide-y divide-border/60">
          {p.fields.map((f) => (
            <div key={f.field} className="py-2">
              <div className="flex items-center gap-1.5">
                <ConfidenceDot confidence={f.confidence} />
                <p className="text-xs text-muted-foreground">{f.field}</p>
                {f.resolution && (
                  <span
                    className={cn(
                      'ml-auto shrink-0 rounded-lg px-1.5 py-px text-[10px] font-medium',
                      RESOLUTION_STYLES[f.resolution],
                    )}
                  >
                    {RESOLUTION_LABELS[f.resolution]}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm font-medium break-words" title={f.committedValue}>
                {f.committedValue}
              </p>
              {f.previousValue && f.resolution === 'replaced' && (
                <p className="text-xs text-muted-foreground line-through break-words">
                  {f.previousValue}
                </p>
              )}
              {f.sourceRegion && (
                <p className="mt-0.5 text-xs text-muted-foreground/80">{f.sourceRegion}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
