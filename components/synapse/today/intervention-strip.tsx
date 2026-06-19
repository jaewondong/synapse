'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EscalationItem } from '@/lib/types/agent'

interface InterventionStripProps {
  escalation: EscalationItem
}

export function InterventionStrip({ escalation }: InterventionStripProps) {
  return (
    <div className="rounded-xl border border-border border-l-4 border-l-signal-med bg-signal-med-bg px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle className="h-4 w-4 text-signal-med shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{escalation.agentName}</p>
            <p className="text-sm text-foreground/80 mt-0.5">{escalation.situation}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{escalation.patientRef}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="bg-signal-med hover:bg-signal-med/90 text-white border-none">
            Take action
          </Button>
          <Button size="sm" variant="ghost" className="text-signal-med hover:bg-signal-med/10">
            Defer to inbox
          </Button>
        </div>
      </div>
    </div>
  )
}
