'use client'

import { ExternalLink } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AgentAction } from '@/lib/types/agent'

const confidenceLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-confidence-high' },
  medium: { label: 'Medium', color: 'bg-confidence-medium' },
  low: { label: 'Low', color: 'bg-confidence-low' },
}

interface WhyDrawerProps {
  action: AgentAction | null
  open: boolean
  onClose: () => void
}

export function WhyDrawer({ action, open, onClose }: WhyDrawerProps) {
  const conf = action ? confidenceLabels[action.confidence] : null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-96 max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>
            {action ? (
              <div className="flex items-center gap-2">
                <span>{action.agentName}</span>
                {conf && (
                  <span className={cn('h-2 w-2 rounded-full shrink-0', conf.color)} />
                )}
                {conf && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {conf.label} confidence
                  </span>
                )}
              </div>
            ) : (
              'Why?'
            )}
          </SheetTitle>
        </SheetHeader>

        {action && (
          <div className="mt-4 space-y-5 overflow-y-auto flex-1">
            {/* Timestamp */}
            <p className="text-xs text-muted-foreground">
              Frozen at {new Date(action.timestamp).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>

            {/* Decision */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Decision
              </h3>
              <p className="text-sm leading-relaxed">{action.summary}</p>
            </section>

            {/* Why */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Why
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {action.reasoningSummary}
              </p>
            </section>

            {/* Sources */}
            {action.sources.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Inputs & sources
                </h3>
                <ul className="space-y-1.5">
                  {action.sources.map((src, i) => (
                    <li key={i}>
                      <button
                        className="flex items-start gap-2 w-full text-left rounded-md p-2 hover:bg-muted transition-colors group"
                        onClick={() => console.log('open source', src)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-accent" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:text-accent">{src.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{src.reference}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Freeze notice */}
            <p className="text-xs text-muted-foreground/70 border-t border-border pt-4 leading-relaxed">
              Reasoning frozen when action was created. Underlying data may have changed since.
            </p>

            {/* Footer actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                Close
              </button>
              <button
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => console.log('audit log', action.id)}
              >
                Audit log
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
