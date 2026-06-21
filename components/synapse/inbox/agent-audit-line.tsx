'use client'

// Synapse §2.9 — provenance + audit line for inbound agent steps. Shows the
// glyph (⌁ agent-drafted / ✓ human-confirmed, §1.6) and an `audit` link that
// opens the global Explainability Drawer with an agent_action payload (B10, §9).
import { joinDot, safeFormatDate } from '@/lib/utils'
import { PROVENANCE_GLYPH } from '@/lib/explainability'
import type { AgentActionPayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import type { Provenance } from '@/lib/inbound/InboundEmail'

export function AgentAuditLine({
  provenance,
  agentName,
  timestamp,
  payload,
}: {
  provenance: Provenance
  agentName: string
  timestamp: string
  payload: AgentActionPayload
}) {
  const glyph = provenance === 'human' ? PROVENANCE_GLYPH.human : PROVENANCE_GLYPH.agent
  const who = provenance === 'human' ? 'Confirmed by you' : agentName
  const line = joinDot([`${glyph} ${who}`, safeFormatDate(timestamp)])

  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] text-chart-subtle">
      <span>{line}</span>
      <span>·</span>
      <button
        onClick={() => useExplainabilityStore.getState().open(payload)}
        aria-label="Open explanation"
        className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
      >
        audit
      </button>
    </div>
  )
}
