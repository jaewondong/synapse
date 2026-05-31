'use client'

import * as React from 'react'
import { ExplainabilityDrawer } from '@/components/synapse/ExplainabilityDrawer'
import { formatDateOnly } from '@/lib/utils'
import type { GdmtFlag } from '@/lib/types/cardiology'

interface GdmtFlagsCardProps {
  flags: GdmtFlag[]
}

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

function GdmtFlagItem({ flag }: { flag: GdmtFlag }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  if (dismissed) return null

  return (
    <>
      <div
        className="rounded-lg px-3.5 py-3 text-xs"
        style={{
          background: 'var(--chart-warning-bg)',
          border: '0.5px solid var(--chart-warning-border)',
        }}
      >
        <div className="flex items-start gap-2.5">
          {/* Agent glyph + confidence dot */}
          <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span className="text-chart-warning-text text-sm leading-none">⊕</span>
            <span
              className={`h-2 w-2 rounded-full ${confidenceDot[flag.confidence]}`}
              title={`${flag.confidence} confidence`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-chart-warning-text/70">{flag.agentName}</p>
            <p className="text-[13px] font-semibold text-chart-warning-text mt-0.5 leading-snug">
              {flag.title}
            </p>
            <p className="text-xs text-chart-warning-text/80 mt-0.5 leading-relaxed">{flag.detail}</p>

            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-chart-warning-text/60">
              <span>{formatDateOnly(flag.computedAt)}</span>
              <span>·</span>
              <button
                onClick={() => setDrawerOpen(true)}
                className="underline underline-offset-2 hover:text-chart-warning-text transition-colors"
              >
                why
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              className="text-[11px] rounded-md px-2.5 py-1 font-medium transition-colors"
              style={{ background: 'var(--chart-warning-text)', color: 'white' }}
              onClick={() => console.log('order/discuss', flag.id)}
            >
              {flag.title.toLowerCase().includes('arni') ? 'Order uptitration' : 'Discuss'}
            </button>
            <button
              className="text-[11px] rounded-md px-2.5 py-1 font-medium border transition-colors"
              style={{ borderColor: 'var(--chart-warning-border)', color: 'var(--chart-warning-text)' }}
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <ExplainabilityDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={flag.title}
        decision={flag.detail}
        why={flag.whyRationale}
        inputs={flag.whyInputs}
        agentName={flag.agentName}
        computedAt={flag.computedAt}
      />
    </>
  )
}

export function GdmtFlagsCard({ flags }: GdmtFlagsCardProps) {
  if (!flags.length) return null

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
        GDMT optimization — physician judgment needed
      </p>
      <div className="space-y-2.5">
        {flags.map((f) => (
          <GdmtFlagItem key={f.id} flag={f} />
        ))}
      </div>
    </div>
  )
}
