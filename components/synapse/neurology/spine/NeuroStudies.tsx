'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { ScanLine, Brain, Activity, Zap, Check } from 'lucide-react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { agentActionPayload } from '@/lib/explainability'
import { formatDateOnly, joinDot, cn } from '@/lib/utils'
import type { NeuroStudy } from '@/lib/neurology'

interface NeuroStudiesProps {
  studies: NeuroStudy[]
  patientName: string
  mrn: string
}

const MODALITY_ICON: Record<NeuroStudy['modality'], React.ElementType> = {
  MRI: Brain,
  CT: ScanLine,
  EEG: Activity,
  EMG: Zap,
}

export function NeuroStudies({ studies, patientName, mrn }: NeuroStudiesProps) {
  // Confirmation is local + optimistic with rollback (§1.7); an agent-extracted
  // impression is provisional until a clinician confirms it.
  const [confirmed, setConfirmed] = React.useState<Record<string, boolean>>({})

  const ordered = studies
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  function confirm(study: NeuroStudy) {
    setConfirmed((prev) => ({ ...prev, [study.id]: true }))
    toast.success('Impression confirmed', {
      description: `${study.modality}${study.region ? ` — ${study.region}` : ''}`,
      action: {
        label: 'Undo',
        onClick: () => setConfirmed((prev) => ({ ...prev, [study.id]: false })),
      },
    })
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Studies — MRI · CT · EEG · EMG
      </p>

      {ordered.length === 0 ? (
        <p className="py-2 text-[13px] text-muted-foreground">No neuro studies on file.</p>
      ) : (
        <div className="space-y-2">
          {ordered.map((s) => {
            const Icon = MODALITY_ICON[s.modality]
            const isConfirmed = s.confirmed || confirmed[s.id]
            const showConfirm = s.provenance === 'agent' && !isConfirmed
            return (
              <div key={s.id} className="rounded-lg border border-black/[0.06] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-chart-subtle" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">
                        {joinDot([s.modality, s.region, formatDateOnly(s.date)])}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground break-words">
                        {s.impression}
                      </p>
                      {s.provenance === 'agent' && (
                        <AuditStrip
                          modifiedByType="agent"
                          modifiedByAgentName="Imaging Extraction Agent"
                          modifiedAt={s.date}
                          explainability={agentActionPayload({
                            agentName: 'Imaging Extraction Agent',
                            timestamp: s.date,
                            patientName,
                            patientMrn: mrn,
                            title: `${s.modality} impression extracted`,
                            confidence: s.confidence,
                            actionSummary: `Extracted the impression from the ${s.modality}${s.region ? ` (${s.region})` : ''} report dated ${formatDateOnly(s.date)}.`,
                            inputs: [{ label: `${s.modality} report — ${formatDateOnly(s.date)}` }],
                            output: { label: 'Extracted impression', preview: s.impression },
                            decisionState: isConfirmed ? 'approved' : 'pending',
                          })}
                        />
                      )}
                    </div>
                  </div>

                  {showConfirm ? (
                    <button
                      onClick={() => confirm(s)}
                      title="Confirm impression (c)"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-black/[0.12] px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted/50"
                    >
                      <Check className="h-3 w-3" aria-hidden />
                      Confirm
                    </button>
                  ) : (
                    <span
                      className={cn(
                        'shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium',
                        isConfirmed ? 'bg-chart-success-bg text-chart-success-text' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isConfirmed ? 'Confirmed' : 'On file'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
