'use client'

import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatDateOnly } from '@/lib/utils'

export interface ExplainabilityDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  decision: string
  why: string
  inputs: string[]
  agentName: string
  computedAt?: string
  modelVersion?: string
}

export function ExplainabilityDrawer({
  open,
  onClose,
  title,
  decision,
  why,
  inputs,
  agentName,
  computedAt,
  modelVersion,
}: ExplainabilityDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[400px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-2">
          {/* Agent metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-chart-subtle">
            <span>⊕</span>
            <span>{agentName}</span>
            {computedAt && (
              <>
                <span>·</span>
                <span>{formatDateOnly(computedAt)}</span>
              </>
            )}
            {modelVersion && (
              <>
                <span>·</span>
                <span>{modelVersion}</span>
              </>
            )}
          </div>

          {/* Decision */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-chart-subtle mb-1.5">
              Decision
            </p>
            <p className="text-sm leading-relaxed">{decision}</p>
          </section>

          {/* Why */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-chart-subtle mb-1.5">
              Why
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{why}</p>
          </section>

          {/* Inputs & sources */}
          {inputs.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-chart-subtle mb-1.5">
                Inputs & sources
              </p>
              <ul className="space-y-1.5">
                {inputs.map((input, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40 mt-1.5" />
                    {input}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
