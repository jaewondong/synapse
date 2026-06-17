'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, X, FlaskConical } from 'lucide-react'
import { agentActionPayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { joinDot, cn } from '@/lib/utils'
import type { NeuroModuleProps } from '../conditionRegistry'
import type { DifferentialItem } from '@/lib/neurology'

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

function DifferentialRow({
  item,
  patientName,
  mrn,
  onResolve,
}: {
  item: DifferentialItem
  patientName: string
  mrn: string
  onResolve: (id: string, kind: 'added' | 'dismissed') => void
}) {
  function openWhy() {
    useExplainabilityStore.getState().open(
      agentActionPayload({
        agentName: 'Differential Agent',
        timestamp: '',
        patientName,
        patientMrn: mrn,
        title: `Differential suggestion — ${item.label}`,
        confidence: item.confidence,
        actionSummary: `Suggested "${item.label}" as a differential consideration. This is a suggestion, not a diagnosis — it becomes a problem only on explicit clinician action.`,
        reasoning: [item.rationale],
        inputs: [{ label: 'Presenting symptoms + structured exam' }],
        output: { label: 'Suggested differential', preview: `${item.label}${item.icd10 ? ` (${item.icd10})` : ''}` },
        decisionState: 'pending',
      }),
    )
  }

  return (
    <div className="rounded-lg border border-black/[0.06] bg-agent-tint px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          <span className="text-sm leading-none text-accent" title="Agent-suggested">⊕</span>
          <span className={cn('h-2 w-2 rounded-full', confidenceDot[item.confidence])} title={`${item.confidence} confidence`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug break-words">
            {joinDot([item.label, item.icd10])}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground break-words">{item.rationale}</p>
          <button onClick={openWhy} className="mt-1 text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground">
            why
          </button>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={() => onResolve(item.id, 'added')}
            title="Add to problem list"
            className="inline-flex items-center gap-1 rounded-md border border-black/[0.12] px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted/50"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Add to problems
          </button>
          <button
            onClick={() => onResolve(item.id, 'dismissed')}
            title="Dismiss suggestion"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-chart-subtle transition-colors hover:text-muted-foreground"
          >
            <X className="h-3 w-3" aria-hidden />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export function UndifferentiatedModule({ chart, problem }: NeuroModuleProps) {
  const data = chart.undifferentiated
  const [resolved, setResolved] = React.useState<Record<string, 'added' | 'dismissed'>>({})

  if (!data) return null

  // Explicit action only — nothing becomes a problem-list entry on its own (§3, §6.3).
  function resolve(id: string, kind: 'added' | 'dismissed', label: string) {
    setResolved((prev) => ({ ...prev, [id]: kind }))
    toast.success(kind === 'added' ? 'Added to problem list' : 'Suggestion dismissed', {
      description: label,
      action: { label: 'Undo', onClick: () => setResolved((prev) => { const n = { ...prev }; delete n[id]; return n }) },
    })
  }

  const open = data.differential.filter((d) => !resolved[d.id])

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[15px] font-medium">Undifferentiated workup</span>
        <span className="rounded-full bg-chart-neutral-bg px-1.5 py-0.5 text-[10px] font-medium text-chart-neutral-text">diagnosis pending</span>
      </div>

      {/* Presenting symptoms */}
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">Presenting symptoms</p>
        <p className="text-[13px] leading-snug break-words">{joinDot([problem.label, ...data.presentingSymptoms])}</p>
      </div>

      {/* Agent differential — suggestion, not diagnosis */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          Agent-suggested differential — clinician owns this
        </p>
        {open.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">All suggestions reviewed.</p>
        ) : (
          <div className="space-y-2">
            {open.map((item) => (
              <DifferentialRow
                key={item.id}
                item={item}
                patientName={chart.patientName}
                mrn={chart.mrn}
                onResolve={(id, kind) => resolve(id, kind, item.label)}
              />
            ))}
          </div>
        )}
        <p className="mt-1.5 text-[11px] italic text-chart-subtle">
          Suggestions, not diagnoses. Nothing is added to the problem list without your explicit action.
        </p>
      </div>

      {/* Pending workup */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">Recommended / pending workup</p>
        <div className="space-y-1">
          {data.pendingWorkup.map((w) => (
            <div key={w} className="flex items-center gap-2 text-[13px]">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 text-chart-subtle" aria-hidden />
              <span className="break-words">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
