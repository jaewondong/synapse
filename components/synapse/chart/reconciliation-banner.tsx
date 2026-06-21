'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/dialog'
import { formatDateOnly } from '@/lib/utils'
import type { ReconciliationPrompt } from '@/lib/types/chart'

interface ReconciliationBannerProps {
  prompts: ReconciliationPrompt[]
}

function AuditModal({
  prompt,
  open,
  onClose,
}: {
  prompt: ReconciliationPrompt
  open: boolean
  onClose: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Audit provenance</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Modified by</span>
                <span className="font-medium">{prompt.agentName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Origin</span>
                <span className="font-medium">Agent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatDateOnly(prompt.createdAt)}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground/70 italic">
                Full explainability coming soon.
              </p>
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

export function ReconciliationBanner({ prompts }: ReconciliationBannerProps) {
  const [openAuditId, setOpenAuditId] = React.useState<string | null>(null)
  const unresolved = prompts.filter((p) => !p.resolved)
  if (unresolved.length === 0) return null

  const activePrompt = unresolved.find((p) => p.id === openAuditId) ?? null

  return (
    <>
      <div
        className="rounded-xl px-4 py-3.5"
        style={{
          background: 'var(--chart-warning-bg)',
          border: '0.5px solid var(--chart-warning-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle className="h-4 w-4 text-chart-warning-text shrink-0" aria-hidden />
          <span className="text-[13px] font-medium text-chart-warning-text">Reconciliation needed</span>
        </div>

        <div className="space-y-2">
          {unresolved.map((p) => (
            <div key={p.id}>
              <p className="text-xs text-chart-warning-text">{p.message}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-chart-warning-text/70 mt-1">
                <span>⌁</span>
                <span>{p.agentName}</span>
                <span>·</span>
                <span>{formatDateOnly(p.createdAt)}</span>
                <span>·</span>
                <button
                  onClick={() => setOpenAuditId(p.id)}
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  audit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activePrompt && (
        <AuditModal
          prompt={activePrompt}
          open={true}
          onClose={() => setOpenAuditId(null)}
        />
      )}
    </>
  )
}
