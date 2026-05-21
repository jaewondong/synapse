import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { ReconciliationPrompt } from '@/lib/types/chart'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface ReconciliationBannerProps {
  prompts: ReconciliationPrompt[]
}

export function ReconciliationBanner({ prompts }: ReconciliationBannerProps) {
  const unresolved = prompts.filter((p) => !p.resolved)
  if (unresolved.length === 0) return null

  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{
        background: 'var(--chart-warning-bg)',
        border: '0.5px solid var(--chart-warning-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className="h-4 w-4 text-chart-warning-text shrink-0" aria-hidden />
        <span className="text-[13px] font-medium text-chart-warning-text">Reconciliation needed</span>
      </div>

      <div className="space-y-2">
        {unresolved.map((p) => (
          <div key={p.id}>
            <p className="text-xs text-chart-warning-text">{p.message}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-chart-warning-text/70 mt-1">
              <span>⊕</span>
              <span>{p.agentName}</span>
              <span>·</span>
              <span>{formatDate(p.createdAt)}</span>
              <span>·</span>
              {/* TODO: explainability drawer */}
              <button className="underline underline-offset-2 hover:opacity-80 transition-opacity">
                audit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
