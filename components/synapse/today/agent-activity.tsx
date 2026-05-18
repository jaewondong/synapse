'use client'

import { formatRelativeTime } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { AgentActivityItem } from '@/lib/types/agent'

function AuditStrip({ item }: { item: AgentActivityItem }) {
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
      <Sheet>
        <SheetTrigger asChild>
          <button className="text-xs text-accent hover:underline shrink-0 mt-0.5">
            [audit]
          </button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Agent Audit Trail</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm font-medium">{item.agentName}</p>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
            <p className="text-xs text-muted-foreground">
              Completed {formatRelativeTime(item.timestamp)}
            </p>
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Full explainability detail and confidence trace would appear here.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
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
