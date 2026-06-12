'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'
import { X, Copy, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { joinDot, safeFormatDate } from '@/lib/utils'
import { PROVENANCE_GLYPH } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { ConfidenceDot } from '@/components/synapse/insurance/confidence-dot'
import { PANEL_REGISTRY } from './panel-registry'
import { FallbackPanel } from './panels/fallback-panel'

// Explainability Drawer shell (§2.7) — global primitive, mounted once in the
// app shell. Owns chrome and behavior; content panels are registered per kind.
// Read-only with respect to clinical content: it explains, it never mutates.

function SkeletonState() {
  return (
    <div className="space-y-4 px-5 py-4" aria-busy>
      <div className="space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}

export function ExplainabilityDrawer() {
  const router = useRouter()
  const { isOpen, payload, status, lastRef, close, retry } = useExplainabilityStore()
  const auditId = lastRef?.auditId ?? null

  const copyAuditId = React.useCallback(() => {
    if (!auditId) return
    void navigator.clipboard.writeText(auditId).then(() => toast.success('Audit ID copied'))
  }, [auditId])

  const openAuditLog = React.useCallback(() => {
    if (!auditId) return
    close()
    router.push(`/audit?ref=${encodeURIComponent(auditId)}`)
  }, [auditId, close, router])

  useHotkeys('c', copyAuditId, { enabled: isOpen && !!auditId }, [copyAuditId])
  useHotkeys('l', openAuditLog, { enabled: isOpen && !!auditId }, [openAuditLog])

  const Panel = payload ? (PANEL_REGISTRY[payload.kind] ?? FallbackPanel) : null

  // B1: drop the date segment entirely on invalid input — never "Invalid Date".
  const headerLine = payload
    ? joinDot([payload.agentName, payload.agentVersion, safeFormatDate(payload.timestamp)])
    : ''
  const patientLine = payload
    ? joinDot([payload.patientName, payload.patientMrn ? `MRN ${payload.patientMrn}` : ''])
    : ''

  const showFooter = status === 'ready' && !!auditId

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-[480px] max-w-full flex-col bg-card shadow-lg transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
          aria-describedby={undefined}
        >
          {/* Header (fixed) */}
          <div className="shrink-0 border-b border-border px-5 py-3.5">
            {status === 'loading' ? (
              <div className="space-y-2 pr-8">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                <DialogPrimitive.Title className="sr-only">Loading explanation</DialogPrimitive.Title>
              </div>
            ) : payload ? (
              <div className="min-w-0 pr-8">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-muted-foreground" aria-hidden>
                    {PROVENANCE_GLYPH[payload.modifiedByType]}
                  </span>
                  <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-sm font-semibold" title={payload.title}>
                    {payload.title}
                  </DialogPrimitive.Title>
                  {payload.confidence && (
                    <ConfidenceDot confidence={payload.confidence} className="shrink-0" />
                  )}
                </div>
                {headerLine && <p className="mt-0.5 truncate text-sm text-muted-foreground">{headerLine}</p>}
                {patientLine && <p className="mt-0.5 truncate text-xs text-muted-foreground">{patientLine}</p>}
              </div>
            ) : (
              <DialogPrimitive.Title className="pr-8 text-sm font-semibold">
                Explainability
              </DialogPrimitive.Title>
            )}
            <DialogPrimitive.Close className="absolute right-4 top-3.5 rounded p-1 opacity-70 transition-colors hover:bg-muted hover:opacity-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Panel content (scrollable) */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {status === 'loading' && <SkeletonState />}

            {status === 'error' && (
              <div className="flex flex-col items-start gap-3 px-5 py-6">
                <p className="text-sm text-muted-foreground">Couldn&apos;t load this explanation.</p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  Retry
                </button>
              </div>
            )}

            {status === 'ready' && payload && Panel && (
              <div className="px-5 py-4">
                <Panel payload={payload} />
              </div>
            )}
          </div>

          {/* Footer (fixed, audit trail) — omitted entirely when no auditId: no dead links */}
          {showFooter && (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-muted/40 px-5 py-2.5">
              <button
                type="button"
                onClick={copyAuditId}
                title="Copy audit ID (c)"
                className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Copy className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">Audit ID: {auditId}</span>
              </button>
              <button
                type="button"
                onClick={openAuditLog}
                title="View full audit log (l)"
                className="flex shrink-0 items-center gap-1 text-xs font-medium transition-colors hover:text-muted-foreground"
              >
                View full audit log
                <ArrowRight className="h-3 w-3" aria-hidden />
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
