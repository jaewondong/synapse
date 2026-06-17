'use client'

import * as React from 'react'
import { Check, Pencil, X, RotateCcw } from 'lucide-react'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { PROVENANCE_GLYPH, agentActionPayload } from '@/lib/explainability'
import { cn } from '@/lib/utils'
import type { ExamDomain, ExamFinding } from '@/lib/neurology'

export type FindingAction = 'accept' | 'edit' | 'reject'

interface NeuroExamDomainProps {
  domain: ExamDomain
  patientName: string
  mrn: string
  onAct: (findingId: string, action: FindingAction) => void
  onToggleWnl: () => void
}

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

function FindingRow({
  finding,
  patientName,
  mrn,
  onAct,
}: {
  finding: ExamFinding
  patientName: string
  mrn: string
  onAct: (findingId: string, action: FindingAction) => void
}) {
  const pending = finding.reviewState === 'pending'
  const rejected = finding.reviewState === 'rejected'

  function openAudit() {
    if (!finding.auditId) return
    useExplainabilityStore.getState().open(
      agentActionPayload({
        agentName: 'Neuro Exam Agent',
        timestamp: '',
        patientName,
        patientMrn: mrn,
        title: 'Exam finding — agent pre-draft',
        confidence: finding.confidence,
        actionSummary: `Pre-drafted the finding "${finding.text}" for clinician review.`,
        reasoning: finding.rationale ? [finding.rationale] : [],
        inputs: finding.sourceLabel ? [{ label: finding.sourceLabel }] : [],
        output: { label: 'Proposed exam finding', preview: finding.text },
        decisionState: 'pending',
      }),
    )
  }

  // Keyboard shortcuts are focus-scoped so many findings never collide on the
  // global a/e/r keys (§1.5). The row is focusable; hint chips are visible.
  function onKeyDown(e: React.KeyboardEvent) {
    if (!pending) return
    const key = e.key.toLowerCase()
    if (key === 'a') { e.preventDefault(); onAct(finding.id, 'accept') }
    else if (key === 'e') { e.preventDefault(); onAct(finding.id, 'edit') }
    else if (key === 'r') { e.preventDefault(); onAct(finding.id, 'reject') }
  }

  return (
    <div
      tabIndex={pending ? 0 : -1}
      onKeyDown={onKeyDown}
      className={cn(
        'group rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors',
        pending ? 'bg-agent-tint focus:ring-2 focus:ring-accent/40' : 'bg-transparent',
      )}
    >
      <div className="flex items-start gap-2">
        {/* Provenance glyph + (pending-only) confidence dot */}
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          <span
            className={cn('text-sm leading-none', finding.provenance === 'agent' ? 'text-accent' : 'text-chart-subtle')}
            title={finding.provenance === 'agent' ? 'Agent-touched' : 'Human-reviewed'}
            aria-label={finding.provenance === 'agent' ? 'Agent-touched' : 'Human-reviewed'}
          >
            {PROVENANCE_GLYPH[finding.provenance]}
          </span>
          {pending && finding.confidence && (
            <span
              className={cn('h-2 w-2 rounded-full', confidenceDot[finding.confidence])}
              title={`${finding.confidence} confidence`}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn('leading-snug break-words', rejected && 'text-muted-foreground line-through')}>
            {finding.text}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-chart-subtle">
            {finding.reviewState !== 'pending' && (
              <span className="capitalize">{finding.reviewState}</span>
            )}
            {pending && finding.auditId && (
              <button onClick={openAudit} className="underline underline-offset-2 hover:text-muted-foreground">
                audit
              </button>
            )}
          </div>
        </div>

        {/* Actions — only on un-reviewed agent proposals (nothing auto-commits, §3) */}
        {pending && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => onAct(finding.id, 'accept')}
              title="Accept (a)"
              className="inline-flex items-center gap-1 rounded-md bg-chart-success-text px-2 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Check className="h-3 w-3" aria-hidden />
              <kbd className="font-mono text-[9px] opacity-80">a</kbd>
            </button>
            <button
              onClick={() => onAct(finding.id, 'edit')}
              title="Edit (e)"
              className="inline-flex items-center gap-1 rounded-md border border-black/[0.12] px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted/50"
            >
              <Pencil className="h-3 w-3" aria-hidden />
              <kbd className="font-mono text-[9px] opacity-60">e</kbd>
            </button>
            <button
              onClick={() => onAct(finding.id, 'reject')}
              title="Reject (r)"
              className="inline-flex items-center gap-1 rounded-md border border-black/[0.12] px-2 py-1 text-[11px] font-medium text-chart-danger-text transition-colors hover:bg-chart-danger-bg"
            >
              <X className="h-3 w-3" aria-hidden />
              <kbd className="font-mono text-[9px] opacity-60">r</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function NeuroExamDomain({ domain, patientName, mrn, onAct, onToggleWnl }: NeuroExamDomainProps) {
  const active = domain.findings.filter((f) => f.reviewState !== 'rejected')
  const pendingCount = domain.findings.filter((f) => f.reviewState === 'pending').length
  const showNormal = domain.normal && active.length === 0

  return (
    <div className="rounded-lg border border-black/[0.06] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium">{domain.label}</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-agent-tint px-1.5 py-0.5 text-[10px] font-medium text-accent">
              {pendingCount} to review
            </span>
          )}
        </div>
        <button
          onClick={onToggleWnl}
          title="Mark within normal limits"
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
            domain.normal ? 'bg-chart-success-bg text-chart-success-text' : 'border border-black/[0.12] hover:bg-muted/50',
          )}
        >
          {domain.normal ? <RotateCcw className="h-3 w-3" aria-hidden /> : <Check className="h-3 w-3" aria-hidden />}
          {domain.normal ? 'WNL — undo' : 'Mark WNL'}
        </button>
      </div>

      <div className="mt-1.5 space-y-1">
        {showNormal ? (
          <p className="px-2.5 py-1.5 text-[13px] italic text-muted-foreground">
            Within normal limits — no abnormal findings.
          </p>
        ) : domain.findings.length === 0 ? (
          <p className="px-2.5 py-1.5 text-[13px] text-chart-subtle">No findings recorded.</p>
        ) : (
          domain.findings.map((f) => (
            <FindingRow key={f.id} finding={f} patientName={patientName} mrn={mrn} onAct={onAct} />
          ))
        )}
      </div>
    </div>
  )
}
