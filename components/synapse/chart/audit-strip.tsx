'use client'

import { joinDot, safeFormatDate } from '@/lib/utils'
import {
  PROVENANCE_GLYPH,
  type ExplainabilityPayload,
  type ExplainabilityRef,
} from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import type { ProvenanceType } from '@/lib/types/chart'

interface AuditStripProps {
  modifiedByType: ProvenanceType
  modifiedByAgentName?: string
  modifiedAt: string
  // Required (B10): the audit link must open the Explainability Drawer.
  // Pass `null` explicitly only when no target exists yet — the link is then
  // omitted entirely; a visible link that does nothing is the bug being killed.
  explainability: ExplainabilityPayload | ExplainabilityRef | null
}

export function AuditStrip({
  modifiedByType,
  modifiedByAgentName,
  modifiedAt,
  explainability,
}: AuditStripProps) {
  // Only render for agent-origin records (B1: human-origin shows no audit strip)
  if (modifiedByType !== 'agent') return null

  const agentLabel = modifiedByAgentName ?? 'Agent'
  // B1/B5: safeFormatDate; B2: joinDot filters the empty date segment
  const line = joinDot([`${PROVENANCE_GLYPH.agent} ${agentLabel}`, safeFormatDate(modifiedAt)])

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-chart-subtle mt-1">
      <span>{line}</span>
      {explainability && (
        <>
          <span>·</span>
          <button
            onClick={() => useExplainabilityStore.getState().open(explainability)}
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            audit
          </button>
        </>
      )}
    </div>
  )
}
