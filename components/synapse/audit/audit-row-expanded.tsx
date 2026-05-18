'use client'

import { DecisionPill } from './decision-pill'
import type { AuditEntry } from '@/lib/api/client'

interface AuditRowExpandedProps {
  entry: AuditEntry
}

export function AuditRowExpanded({ entry }: AuditRowExpandedProps) {
  const { action } = entry

  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-4 bg-muted/30 border-t border-border text-xs">
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Decision</p>
          <div className="flex items-center gap-2">
            <DecisionPill operation={entry.operation} />
            {entry.reason && (
              <span className="text-foreground">{entry.reason}</span>
            )}
            {!entry.reason && (
              <span className="text-muted-foreground/60 italic">No reason given</span>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            by {entry.decidedBy} · {new Date(entry.decidedAt).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Agent summary</p>
          <p className="text-foreground leading-relaxed">{action.summary}</p>
          <p className="text-muted-foreground mt-1">{action.detail}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Patient</p>
          <p className="text-foreground">{action.patientName}</p>
          <p className="text-muted-foreground">MRN {action.patientMrn}</p>
        </div>

        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Agent</p>
          <p className="text-foreground">{action.agentName}</p>
          <p className="text-muted-foreground capitalize">{action.category} · {action.confidence} confidence</p>
        </div>

        <div>
          <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Action timestamp</p>
          <p className="text-foreground">{new Date(action.actionTimestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
