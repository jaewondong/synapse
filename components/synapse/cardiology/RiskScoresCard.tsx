'use client'

import * as React from 'react'
import { ExplainabilityDrawer } from '@/components/synapse/ExplainabilityDrawer'
import type { RiskScore } from '@/lib/types/cardiology'

interface RiskScoresCardProps {
  riskScores: RiskScore[]
}

const severityColors: Record<string, string> = {
  high: 'text-chart-danger-text bg-chart-danger-bg',
  moderate: 'text-chart-warning-text bg-chart-warning-bg',
  low: 'text-chart-success-text bg-chart-success-bg',
}

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

export function RiskScoresCard({ riskScores }: RiskScoresCardProps) {
  const [drawerScore, setDrawerScore] = React.useState<RiskScore | null>(null)

  if (!riskScores.length) return null

  return (
    <>
      <div className="rounded-lg border border-black/[0.08] bg-white p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
          Risk scores — agent-computed
        </p>

        <div className="space-y-2">
          {riskScores.map((rs) => (
            <div key={rs.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${confidenceDot['high']}`}
                  title="high confidence"
                />
                <span className="text-muted-foreground">{rs.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${severityColors[rs.severity]}`}
                >
                  {rs.value} — {rs.severity}
                </span>
                <button
                  onClick={() => setDrawerScore(rs)}
                  className="text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground transition-colors"
                >
                  why
                </button>
              </div>
            </div>
          ))}

          {/* ASCVD placeholder (§11 out of scope) */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30" />
              <span className="text-muted-foreground">ASCVD 10-yr</span>
            </div>
            <span className="text-[11px] text-chart-subtle italic">Not on file</span>
          </div>
        </div>
      </div>

      {drawerScore && (
        <ExplainabilityDrawer
          open={!!drawerScore}
          onClose={() => setDrawerScore(null)}
          title={`${drawerScore.displayName} — Score ${drawerScore.value}`}
          decision={`${drawerScore.displayName} score is ${drawerScore.value}, indicating ${drawerScore.severity} risk.`}
          why={`The score is computed by summing weighted clinical risk factors. Each contributing factor adds to the total. A score of ${drawerScore.value} indicates ${drawerScore.severity} risk for the associated outcome.`}
          inputs={drawerScore.inputs.map((i) => `${i.label}: ${i.value > 0 ? `+${i.value}` : '0'}`)}
          agentName={drawerScore.agentName}
          computedAt={drawerScore.computedAt}
        />
      )}
    </>
  )
}
