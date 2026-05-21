import * as React from 'react'
import type { ProvenanceType } from '@/lib/types/chart'

function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface AuditStripProps {
  modifiedByType: ProvenanceType
  modifiedByAgentName?: string
  modifiedAt: string
}

export function AuditStrip({ modifiedByType, modifiedByAgentName, modifiedAt }: AuditStripProps) {
  const glyph = modifiedByType === 'agent' ? '⊕' : '⊘'
  const label = modifiedByType === 'agent' ? (modifiedByAgentName ?? 'Agent') : 'Physician'

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-chart-subtle mt-1">
      <span>{glyph}</span>
      <span>{label}</span>
      <span>·</span>
      <span>{formatAuditDate(modifiedAt)}</span>
      <span>·</span>
      {/* TODO: explainability drawer */}
      <button className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
        audit
      </button>
    </div>
  )
}
