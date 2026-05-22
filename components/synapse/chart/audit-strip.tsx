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
import type { ProvenanceType } from '@/lib/types/chart'

interface AuditStripProps {
  modifiedByType: ProvenanceType
  modifiedByAgentName?: string
  modifiedAt: string
}

export function AuditStrip({ modifiedByType, modifiedByAgentName, modifiedAt }: AuditStripProps) {
  const [open, setOpen] = React.useState(false)

  // Only render for agent-origin records (B1: human-origin shows no audit strip)
  if (modifiedByType !== 'agent') return null

  const agentLabel = modifiedByAgentName ?? 'Agent'
  const dateStr = safeFormatDate(modifiedAt)

  return (
    <>
      <div className="flex items-center gap-1.5 text-[11px] text-chart-subtle mt-1">
        <span>⊕</span>
        <span>{agentLabel}</span>
        {dateStr && (
          <>
            <span>·</span>
            <span>{dateStr}</span>
          </>
        )}
        <span>·</span>
        <button
          onClick={() => setOpen(true)}
          className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
        >
          audit
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Audit provenance</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Modified by</span>
                  <span className="font-medium">{agentLabel}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Origin</span>
                  <span className="font-medium capitalize">{modifiedByType}</span>
                </div>
                {dateStr && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{dateStr}</span>
                  </div>
                )}
                <p className="pt-2 text-xs text-muted-foreground/70 italic">
                  Full explainability coming soon.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
