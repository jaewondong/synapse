'use client'

import * as React from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  EXTRACTION_FIELD_KEYS,
  FIELD_LABELS,
  type Copays,
  type ExtractedField,
  type ExtractionFieldKey,
  type InsuranceDocumentDto,
  type StoredExtraction,
} from '@/lib/types/insurance'
import { FieldRow } from './field-row'
import { ConflictDiff } from './conflict-diff'
import { ExplainDrawer } from './explain-drawer'
import { ConfidenceDot } from './confidence-dot'

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance_card: 'Insurance card',
  eligibility_letter: 'Eligibility letter',
  eob: 'Explanation of benefits',
  unknown: 'Unknown document',
}

function valueToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    // Copays render as a readable joined string (B2: filter empties).
    const c = value as Copays
    return [
      c.pcp ? `PCP ${c.pcp}` : '',
      c.specialist ? `Specialist ${c.specialist}` : '',
      c.er ? `ER ${c.er}` : '',
      c.rx ? `Rx ${c.rx}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
  }
  return String(value)
}

// Review order: conflicts and low-confidence first (exception-based attention,
// §1.2.2), then medium, then the calm high-confidence rest.
function reviewOrder(extraction: StoredExtraction): ExtractionFieldKey[] {
  const rank = (key: ExtractionFieldKey): number => {
    const f = extraction.payload[key] as ExtractedField<unknown>
    if (f.conflictsWithOnFile) return 0
    if (f.confidence === 'low' || f.validationNote) return 1
    if (f.confidence === 'medium') return 2
    return 3
  }
  return [...EXTRACTION_FIELD_KEYS].sort((a, b) => rank(a) - rank(b))
}

interface ExtractionReviewProps {
  document: InsuranceDocumentDto
  extraction: StoredExtraction
  onDecided: (document: InsuranceDocumentDto) => void
}

export function ExtractionReview({ document, extraction, onDecided }: ExtractionReviewProps) {
  const payload = extraction.payload

  const [values, setValues] = React.useState<Record<ExtractionFieldKey, string>>(() => {
    const init = {} as Record<ExtractionFieldKey, string>
    for (const key of EXTRACTION_FIELD_KEYS) {
      init[key] = valueToString((payload[key] as ExtractedField<unknown>).value)
    }
    return init
  })
  const [editedKeys, setEditedKeys] = React.useState<Set<ExtractionFieldKey>>(new Set())
  const [resolutions, setResolutions] = React.useState<
    Partial<Record<ExtractionFieldKey, 'keep' | 'replace'>>
  >({})
  const [focusedKey, setFocusedKey] = React.useState<ExtractionFieldKey | null>(null)
  const [drawerKey, setDrawerKey] = React.useState<ExtractionFieldKey | null>(null)
  const [activeSide, setActiveSide] = React.useState<0 | 1>(0)
  const [zoom, setZoom] = React.useState(1)
  const [urls, setUrls] = React.useState<{ front: string | null; back: string | null }>({
    front: null,
    back: null,
  })
  const [dims, setDims] = React.useState<{
    front: { w: number; h: number } | null
    back: { w: number; h: number } | null
  }>({ front: null, back: null })
  const [rejecting, setRejecting] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')
  const [submitting, setSubmitting] = React.useState<'approve' | 'reject' | null>(null)

  // Signed, expiring URLs only — documents are PHI (§2.6.1).
  React.useEffect(() => {
    let cancelled = false
    async function load(side: 'front' | 'back') {
      const res = await fetch(`/api/insurance/documents/${document.id}/signed-url?side=${side}`)
      const json = (await res.json()) as { url?: string }
      if (!cancelled && json.url) setUrls((u) => ({ ...u, [side]: json.url! }))
    }
    load('front')
    if (document.hasBack) load('back')
    return () => {
      cancelled = true
    }
  }, [document.id, document.hasBack])

  const orderedKeys = React.useMemo(() => reviewOrder(extraction), [extraction])
  const conflictKeys = orderedKeys.filter(
    (k) => (payload[k] as ExtractedField<unknown>).conflictsWithOnFile,
  )
  const unresolved = conflictKeys.filter((k) => !resolutions[k])

  function focusField(key: ExtractionFieldKey) {
    setFocusedKey(key)
    const region = (payload[key] as ExtractedField<unknown>).sourceRegion
    if (region && document.hasBack) setActiveSide(region.page === 1 ? 1 : 0)
  }

  function handleChange(key: ExtractionFieldKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    setEditedKeys((s) => new Set(s).add(key))
  }

  function handleResolve(key: ExtractionFieldKey, resolution: 'keep' | 'replace') {
    setResolutions((r) => ({ ...r, [key]: resolution }))
    const field = payload[key] as ExtractedField<unknown>
    setValues((v) => ({
      ...v,
      [key]: resolution === 'keep' ? (field.onFileValue ?? '') : valueToString(field.value),
    }))
  }

  async function decide(operation: 'approve' | 'reject') {
    setSubmitting(operation)
    try {
      const body =
        operation === 'reject'
          ? { operation, reason: rejectReason.trim() }
          : {
              operation,
              edits: Object.fromEntries([...editedKeys].map((k) => [k, values[k]])),
              editedKeys: [...editedKeys],
              conflictResolutions: resolutions,
            }
      const res = await fetch(`/api/insurance/extractions/${extraction.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { document?: InsuranceDocumentDto; error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to save decision')
        return
      }
      toast.success(
        operation === 'approve'
          ? 'Coverage saved — previous version preserved'
          : 'Document rejected',
      )
      onDecided(json.document ?? { ...document, status: operation === 'approve' ? 'approved' : 'rejected' })
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setSubmitting(null)
    }
  }

  const focusedRegion = focusedKey
    ? ((payload[focusedKey] as ExtractedField<unknown>).sourceRegion ?? null)
    : null
  const sideUrl = activeSide === 1 ? urls.back : urls.front
  const drawerField = drawerKey ? (payload[drawerKey] as ExtractedField<unknown>) : null
  const drawerPage = drawerField?.sourceRegion?.page === 1 ? 'back' : 'front'

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{DOC_TYPE_LABELS[payload.documentType]} — review extraction</p>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ConfidenceDot confidence={payload.overallConfidence} /> overall
          </span>
        </div>
        <p className="text-[11px] text-chart-subtle">
          ⊕ {extraction.agentName} · proposal — nothing saves without your approval
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,5fr) minmax(0,4fr)' }}>
        {/* Left: document viewer */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {document.hasBack &&
                ([0, 1] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setActiveSide(side)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11px] transition-colors',
                      activeSide === side
                        ? 'bg-chart-surface font-medium'
                        : 'text-muted-foreground hover:bg-chart-surface/60',
                    )}
                  >
                    {side === 0 ? 'Front' : 'Back'}
                  </button>
                ))}
            </div>
            {!document.isPdf && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
                  className="rounded-md p-1 text-muted-foreground hover:bg-chart-surface/60 transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                  className="rounded-md p-1 text-muted-foreground hover:bg-chart-surface/60 transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-chart-surface/60 transition-colors"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="sticky top-4 max-h-[70vh] overflow-auto rounded-lg border border-black/[0.08] bg-muted/30">
            {document.isPdf ? (
              urls.front ? (
                <iframe src={urls.front} title="Uploaded document" className="h-[68vh] w-full" />
              ) : (
                <div className="h-64 animate-pulse" />
              )
            ) : sideUrl ? (
              <div className="relative" style={{ width: `${zoom * 100}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sideUrl}
                  alt={activeSide === 1 ? 'Document back' : 'Document front'}
                  className="block w-full"
                  onLoad={(e) => {
                    const img = e.currentTarget
                    setDims((d) => ({
                      ...d,
                      [activeSide === 1 ? 'back' : 'front']: {
                        w: img.naturalWidth,
                        h: img.naturalHeight,
                      },
                    }))
                  }}
                />
                {/* Source-region highlight for the focused field */}
                {focusedRegion && (focusedRegion.page === 1 ? 1 : 0) === activeSide && (
                  <div
                    className="pointer-events-none absolute rounded border-2 border-accent bg-accent/15 transition-all duration-200"
                    style={{
                      left: `${focusedRegion.x * 100}%`,
                      top: `${focusedRegion.y * 100}%`,
                      width: `${focusedRegion.w * 100}%`,
                      height: `${focusedRegion.h * 100}%`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="h-64 animate-pulse" />
            )}
          </div>
        </div>

        {/* Right: extracted fields, exceptions first */}
        <div className="min-w-0 space-y-2">
          {orderedKeys.map((key) => {
            const field = payload[key] as ExtractedField<unknown>
            if (field.conflictsWithOnFile) {
              return (
                <ConflictDiff
                  key={key}
                  label={FIELD_LABELS[key]}
                  field={field}
                  extractedValue={valueToString(field.value)}
                  resolution={resolutions[key] ?? null}
                  onResolve={(r) => handleResolve(key, r)}
                  onFocus={() => focusField(key)}
                  onOpenAudit={() => setDrawerKey(key)}
                />
              )
            }
            return (
              <FieldRow
                key={key}
                label={FIELD_LABELS[key]}
                field={field}
                value={values[key]}
                edited={editedKeys.has(key)}
                agentName={extraction.agentName}
                extractedAt={extraction.extractedAt}
                onChange={(v) => handleChange(key, v)}
                onFocus={() => focusField(key)}
                onOpenAudit={() => setDrawerKey(key)}
              />
            )
          })}
        </div>
      </div>

      {/* Decision bar */}
      <div className="mt-4 border-t border-black/[0.06] pt-3">
        {rejecting ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejecting (required, logged to audit)…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
            />
            <button
              type="button"
              disabled={!rejectReason.trim() || submitting !== null}
              onClick={() => decide('reject')}
              className="rounded-md bg-chart-danger-text text-white px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {unresolved.length > 0
                ? `${unresolved.length} conflict${unresolved.length > 1 ? 's' : ''} need${unresolved.length === 1 ? 's' : ''} a keep/replace choice before saving.`
                : editedKeys.size > 0
                  ? `${editedKeys.size} field${editedKeys.size > 1 ? 's' : ''} corrected — provenance flips to ⊘ on save.`
                  : 'Approving writes a new coverage version; the previous record is preserved.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRejecting(true)}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Reject document
              </button>
              <button
                type="button"
                disabled={unresolved.length > 0 || submitting !== null}
                onClick={() => decide('approve')}
                className="flex items-center gap-1.5 rounded-md bg-accent text-white px-4 py-1.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Approve all & save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Field-level Explainability Drawer (B10: every audit link opens it) */}
      {drawerKey && drawerField && (
        <ExplainDrawer
          open
          onClose={() => setDrawerKey(null)}
          label={FIELD_LABELS[drawerKey]}
          field={drawerField}
          displayValue={values[drawerKey]}
          edited={editedKeys.has(drawerKey)}
          agentName={extraction.agentName}
          modelVersion={extraction.modelVersion}
          extractedAt={extraction.extractedAt}
          pageImageUrl={document.isPdf ? null : drawerPage === 'back' ? urls.back : urls.front}
          pageImageDims={drawerPage === 'back' ? dims.back : dims.front}
        />
      )}
    </div>
  )
}
