'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/dialog'
import { safeFormatDate } from '@/lib/utils'
import type { ExtractedField } from '@/lib/types/insurance'
import { ConfidenceDot } from './confidence-dot'

interface ExplainDrawerProps {
  open: boolean
  onClose: () => void
  label: string
  field: ExtractedField<unknown>
  displayValue: string
  edited: boolean
  agentName: string
  modelVersion: string
  extractedAt: string
  // Signed URL for the page the value came from (null for PDFs — no crop overlay).
  pageImageUrl: string | null
  // Natural dimensions of that image, needed for an undistorted crop.
  pageImageDims: { w: number; h: number } | null
}

// Source crop: the exact region of the document the value was read from (B10).
function SourceCrop({
  url,
  dims,
  region,
}: {
  url: string
  dims: { w: number; h: number } | null
  region: NonNullable<ExtractedField['sourceRegion']>
}) {
  // Pad the crop slightly so the value has visual context.
  const pad = 0.02
  const x = Math.max(0, region.x - pad)
  const y = Math.max(0, region.y - pad)
  const w = Math.min(1 - x, region.w + pad * 2)
  const h = Math.min(1 - y, region.h + pad * 2)

  const aspect = dims ? (w * dims.w) / (h * dims.h) : 3

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30"
      style={{ aspectRatio: `${aspect}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Source region of the document"
        className="absolute max-w-none"
        style={{
          width: `${(1 / w) * 100}%`,
          height: `${(1 / h) * 100}%`,
          left: `${(-x / w) * 100}%`,
          top: `${(-y / h) * 100}%`,
        }}
      />
    </div>
  )
}

export function ExplainDrawer({
  open,
  onClose,
  label,
  field,
  displayValue,
  edited,
  agentName,
  modelVersion,
  extractedAt,
  pageImageUrl,
  pageImageDims,
}: ExplainDrawerProps) {
  const confidenceWhy: Record<string, string> = {
    high: 'The value was clearly legible and unambiguous on the document.',
    medium: 'The value was legible but partially uncertain (blur, glare, or ambiguous formatting).',
    low: 'The value was partially illegible, inferred, or failed a validation check.',
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Explainability — {label}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {/* Decision */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-1">
                  Decision
                </p>
                <p>
                  {edited ? (
                    <>Reviewer corrected {label} to <span className="font-medium">{displayValue || '—'}</span> (agent proposal overridden).</>
                  ) : field.value === null ? (
                    <>{agentName} could not extract {label} from this document.</>
                  ) : (
                    <>{agentName} proposed <span className="font-medium">{displayValue}</span> for {label}.</>
                  )}
                </p>
              </div>

              {/* Why */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-1">
                  Why
                </p>
                <p className="flex items-start gap-1.5">
                  <ConfidenceDot confidence={field.confidence} className="mt-1" />
                  <span>{confidenceWhy[field.confidence]}</span>
                </p>
                {field.validationNote && (
                  <p className="mt-1 text-chart-warning-text text-xs">{field.validationNote}</p>
                )}
                {field.conflictsWithOnFile && (
                  <p className="mt-1 text-chart-warning-text text-xs">
                    Differs from coverage on file ({field.onFileValue}) — required an explicit keep/replace choice.
                  </p>
                )}
              </div>

              {/* Inputs */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-1">
                  Inputs
                </p>
                {field.sourceRegion && pageImageUrl ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Source region — page {field.sourceRegion.page + 1} of the uploaded document:
                    </p>
                    <SourceCrop url={pageImageUrl} dims={pageImageDims} region={field.sourceRegion} />
                  </>
                ) : field.sourceRegion ? (
                  <p className="text-xs text-muted-foreground">
                    Read from page {field.sourceRegion.page + 1} of the uploaded PDF (region{' '}
                    {Math.round(field.sourceRegion.x * 100)}%, {Math.round(field.sourceRegion.y * 100)}% →{' '}
                    {Math.round(field.sourceRegion.w * 100)}% × {Math.round(field.sourceRegion.h * 100)}%).
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No source region — the value was not located on the document.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {agentName} · {modelVersion} · {safeFormatDate(extractedAt)}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
