'use client'

import * as React from 'react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { ExplainabilityDrawer } from '@/components/synapse/ExplainabilityDrawer'
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

export function DiagnosticsCard({ diagnostics }: DiagnosticsCardProps) {
  const [drawerStudy, setDrawerStudy] = React.useState<CardiacStudy | null>(null)

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
                  />
                  <button
                    onClick={() => setDrawerStudy(s)}
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

      {drawerStudy && (
        <ExplainabilityDrawer
          open={!!drawerStudy}
          onClose={() => setDrawerStudy(null)}
          title={`${studyLabels[drawerStudy.studyType] ?? drawerStudy.studyType} — ${formatDateOnly(drawerStudy.performedAt)}`}
          decision={drawerStudy.summary}
          why={`Agent extracted and summarized findings from the ${studyLabels[drawerStudy.studyType] ?? drawerStudy.studyType} report received on ${formatDateOnly(drawerStudy.performedAt)}.`}
          inputs={['Source document: structured report', `Study type: ${drawerStudy.studyType}`, `Date: ${formatDateOnly(drawerStudy.performedAt)}`]}
          agentName={drawerStudy.modifiedByAgentName ?? 'Documentation Agent'}
          computedAt={drawerStudy.performedAt}
        />
      )}
    </>
  )
}
