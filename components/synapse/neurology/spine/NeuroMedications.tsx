'use client'

import * as React from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { agentActionPayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { formatDateOnly, joinDot, cn } from '@/lib/utils'
import type { NeuroExceptionFlag, NeuroMedication } from '@/lib/neurology'

interface NeuroMedicationsProps {
  medications: NeuroMedication[]
  flags: NeuroExceptionFlag[]
  patientName: string
  mrn: string
}

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

// Exception-flag item — reuses the §2.4 GDMT pattern: agent glyph + confidence
// dot, a "why" that opens the global Explainability Drawer, and a dismiss.
function ExceptionFlagItem({
  flag,
  patientName,
  mrn,
}: {
  flag: NeuroExceptionFlag
  patientName: string
  mrn: string
}) {
  const [dismissed, setDismissed] = React.useState(false)
  const warning = flag.severity === 'warning'

  function openWhy() {
    useExplainabilityStore.getState().open(
      agentActionPayload({
        agentName: flag.agentName,
        timestamp: flag.computedAt,
        patientName,
        patientMrn: mrn,
        title: flag.title,
        confidence: flag.confidence,
        actionSummary: flag.detail,
        reasoning: [flag.whyRationale],
        inputs: flag.whyInputs.map((label) => ({ label })),
        output: { label: 'Exception flag', preview: flag.detail },
        decisionState: 'pending',
      }),
    )
  }

  if (dismissed) return null

  const Icon = warning ? AlertTriangle : Info

  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2.5 text-xs',
        warning ? 'bg-chart-warning-bg' : 'bg-chart-info-bg',
      )}
      style={warning ? { border: '0.5px solid var(--chart-warning-border)' } : undefined}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          <Icon className={cn('h-3.5 w-3.5', warning ? 'text-chart-warning-text' : 'text-chart-info-text')} aria-hidden />
          <span className={cn('h-2 w-2 rounded-full', confidenceDot[flag.confidence])} title={`${flag.confidence} confidence`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[13px] font-semibold leading-snug', warning ? 'text-chart-warning-text' : 'text-chart-info-text')}>
            {flag.title}
          </p>
          <p className={cn('mt-0.5 leading-relaxed', warning ? 'text-chart-warning-text/80' : 'text-chart-info-text/80')}>
            {flag.detail}
          </p>
          <div className={cn('mt-1.5 flex items-center gap-1.5 text-[11px]', warning ? 'text-chart-warning-text/60' : 'text-chart-info-text/60')}>
            <span>{joinDot([flag.agentName, formatDateOnly(flag.computedAt)])}</span>
            <span>·</span>
            <button onClick={openWhy} className="underline underline-offset-2 hover:opacity-80">why</button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={cn(
            'shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
            warning ? 'border-chart-warning-border text-chart-warning-text' : 'border-black/[0.12] text-chart-info-text',
          )}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export function NeuroMedications({ medications, flags, patientName, mrn }: NeuroMedicationsProps) {
  const active = medications.filter((m) => m.active)

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Neuro medications
      </p>

      {active.length === 0 ? (
        <p className="py-2 text-[13px] text-muted-foreground">No active neuro medications.</p>
      ) : (
        <div className="space-y-1.5">
          {active.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 text-[13px]">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {m.name} <span className="font-normal text-muted-foreground">{m.dose} · {m.frequency}</span>
                </p>
                {(m.drugClass || m.startDate) && (
                  <p className="mt-0.5 text-[11px] text-chart-subtle">
                    {joinDot([m.drugClass, m.startDate ? `since ${formatDateOnly(m.startDate)}` : ''])}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {flags.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
            Exception flags — physician judgment needed
          </p>
          {flags.map((f) => (
            <ExceptionFlagItem key={f.id} flag={f} patientName={patientName} mrn={mrn} />
          ))}
        </div>
      )}
    </div>
  )
}
