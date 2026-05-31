'use client'

import * as React from 'react'
import { ExplainabilityDrawer } from '@/components/synapse/ExplainabilityDrawer'
import type { SafetyAlert } from '@/lib/types/labs'

interface SafetyChecksProps {
  alerts: SafetyAlert[]
  onResolve: (id: string, override?: string) => void
}

const alertColors = {
  duplicate: { bg: 'var(--chart-warning-bg)', border: 'var(--chart-warning-border)', text: 'var(--chart-warning-text)' },
  missing_indication: { bg: 'var(--chart-warning-bg)', border: 'var(--chart-warning-border)', text: 'var(--chart-warning-text)' },
  abn: { bg: 'var(--chart-danger-bg)', border: 'rgba(185,28,28,0.3)', text: 'var(--chart-danger-text)' },
  drug_level_timing: { bg: 'var(--chart-info-bg)', border: 'rgba(12,68,124,0.3)', text: 'var(--chart-info-text)' },
}

const alertTitles = {
  duplicate: 'Duplicate / recent result',
  missing_indication: 'Missing clinical indication',
  abn: 'Coverage / ABN notice',
  drug_level_timing: 'Drug level timing',
}

function SafetyAlertCard({ alert, onResolve }: { alert: SafetyAlert; onResolve: (id: string, override?: string) => void }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const colors = alertColors[alert.type]

  return (
    <>
      <div
        className="rounded-lg px-3.5 py-3 text-xs"
        style={{ background: colors.bg, border: `0.5px solid ${colors.border}` }}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span className="text-sm leading-none" style={{ color: colors.text }}>⊕</span>
            <span className="h-2 w-2 rounded-full bg-confidence-medium" title="medium confidence" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium" style={{ color: colors.text }}>
              Ordering Agent · {alertTitles[alert.type]}
            </p>
            <p className="text-[13px] font-semibold mt-0.5 leading-snug" style={{ color: colors.text }}>
              {alert.testName}
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: colors.text, opacity: 0.85 }}>
              {alert.message}
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-[11px] underline underline-offset-2 mt-1"
              style={{ color: colors.text, opacity: 0.7 }}
            >
              why
            </button>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              className="text-[11px] rounded-md px-2.5 py-1 font-medium transition-colors"
              style={{ background: colors.text, color: 'white' }}
              onClick={() => onResolve(alert.id, 'override')}
            >
              {alert.type === 'duplicate' ? 'Order anyway' : 'Acknowledge'}
            </button>
            <button
              className="text-[11px] rounded-md px-2.5 py-1 font-medium border transition-colors"
              style={{ borderColor: colors.border, color: colors.text }}
              onClick={() => onResolve(alert.id)}
            >
              {alert.type === 'duplicate' ? 'Remove order' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>

      <ExplainabilityDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`${alertTitles[alert.type]} — ${alert.testName}`}
        decision={alert.message}
        why={alert.detail}
        inputs={[`Test: ${alert.testName}`, `Alert type: ${alert.type}`]}
        agentName="Ordering Agent"
      />
    </>
  )
}

export function SafetyChecks({ alerts, onResolve }: SafetyChecksProps) {
  const unresolved = alerts.filter((a) => !a.resolved)
  if (!unresolved.length) return null

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Safety checks — review before release
      </p>
      {unresolved.map((a) => (
        <SafetyAlertCard key={a.id} alert={a} onResolve={onResolve} />
      ))}
    </div>
  )
}
