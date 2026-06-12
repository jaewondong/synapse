'use client'

import * as React from 'react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { agentActionPayload, type AgentActionPayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { formatDateOnly } from '@/lib/utils'
import type { CardiacStudy } from '@/lib/types/cardiology'

interface DiagnosticsCardProps {
  diagnostics: CardiacStudy[]
}

const studyLabels: Record<string, string> = {
  ecg: 'ECG',
  echo: 'Echocardiogram',
  cath: 'Cardiac cath',
  'chest-xray': 'Chest X-ray',
}

// Shared by the audit link and the "why" button — both open the global drawer.
function studyPayload(s: CardiacStudy): AgentActionPayload {
  return agentActionPayload({
    agentName: s.modifiedByAgentName ?? 'Documentation Agent',
    timestamp: s.performedAt,
    title: `${studyLabels[s.studyType] ?? s.studyType} summarized`,
    actionSummary: s.summary,
    inputs: [{ label: `${studyLabels[s.studyType] ?? s.studyType} report — ${formatDateOnly(s.performedAt)}` }],
    output: { label: 'Study summary', preview: s.summary },
  })
}

export function DiagnosticsCard({ diagnostics }: DiagnosticsCardProps) {
  // Show only the most recent per type (non-echo) + latest echo
  const toShow: CardiacStudy[] = []
  const seenTypes = new Set<string>()
  for (const s of diagnostics) {
    if (!seenTypes.has(s.studyType)) {
      seenTypes.add(s.studyType)
      toShow.push(s)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-black/[0.08] bg-white p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
          Diagnostics
        </p>

        <div className="space-y-0">
          {toShow.map((s, i) => (
            <div
              key={s.id}
              className={`py-2.5 text-[12px] ${i < toShow.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{studyLabels[s.studyType] ?? s.studyType}</span>
                <span className="text-[11px] text-chart-subtle">{formatDateOnly(s.performedAt)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.summary}</p>
              {s.modifiedByType === 'agent' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AuditStrip
                    modifiedByType={s.modifiedByType}
                    modifiedByAgentName={s.modifiedByAgentName}
                    modifiedAt={s.performedAt}
                    explainability={studyPayload(s)}
                  />
                  <button
                    onClick={() => useExplainabilityStore.getState().open(studyPayload(s))}
                    className="text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground transition-colors"
                  >
                    why
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </>
  )
}
