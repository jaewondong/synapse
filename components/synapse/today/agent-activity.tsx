'use client'

import { formatRelativeTime } from '@/lib/utils'
import { agentActionPayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import type { AgentActivityItem } from '@/lib/types/agent'

function AuditStrip({ item }: { item: AgentActivityItem }) {
  // [audit] opens the global Explainability Drawer (B10)
  function openAudit() {
    useExplainabilityStore.getState().open(
      agentActionPayload({
        agentName: item.agentName,
        timestamp: item.timestamp,
        title: 'Agent activity',
        actionSummary: item.summary,
        output: { label: 'Activity summary', preview: item.summary },
      }),
    )
  }

  return (
    <div className="flex items-start gap-2 py-2.5">
      <span className="text-accent text-xs mt-0.5 shrink-0">⚡</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-snug">
          <span className="font-medium">{item.agentName}</span>
          <span className="mx-1 text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{formatRelativeTime(item.timestamp)}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.summary}</p>
      </div>
      <button
        onClick={openAudit}
        className="text-xs text-accent hover:underline shrink-0 mt-0.5"
      >
        [audit]
      </button>
    </div>
  )
}

interface AgentActivityProps {
  items: AgentActivityItem[]
}

export function AgentActivity({ items }: AgentActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 pt-5 pb-4">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm font-semibold">Recent agent activity</h2>
        <span className="text-xs text-muted-foreground">Last 24 hours</span>
      </div>
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <AuditStrip key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
