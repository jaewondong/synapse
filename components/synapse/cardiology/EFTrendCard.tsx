'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { agentActionPayload } from '@/lib/explainability'
import { formatDateOnly } from '@/lib/utils'
import type { EFDataPoint } from '@/lib/types/cardiology'

interface EFTrendCardProps {
  efTrend: EFDataPoint[]
  latestEf: { value: number; date: string; agentName: string; modifiedAt: string } | null
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`
}

export function EFTrendCard({ efTrend, latestEf }: EFTrendCardProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const data = efTrend.map((p) => ({ date: fmtDate(p.date), value: p.value, fullDate: p.date }))
  const latest = latestEf ?? efTrend[efTrend.length - 1]
  const prev = efTrend.length >= 2 ? efTrend[efTrend.length - 2] : null
  const isImproving = prev && latest && latest.value > prev.value

  // Classify the EF severity from the actual value — not a hardcoded label.
  const efValue = latestEf?.value ?? (efTrend.length ? efTrend[efTrend.length - 1].value : null)
  const efCategory =
    efValue == null
      ? null
      : efValue < 40
        ? { tone: 'danger' as const, label: 'Reduced EF (<40%)' }
        : efValue < 50
          ? { tone: 'warning' as const, label: 'Mildly reduced EF (40–49%)' }
          : { tone: 'success' as const, label: 'Preserved EF (≥50%)' }
  const toneBadge = {
    danger: 'bg-chart-danger-bg text-chart-danger-text',
    warning: 'bg-chart-warning-bg text-chart-warning-text',
    success: 'bg-chart-success-bg text-chart-success-text',
  }
  const seriesColor = efCategory ? `var(--chart-${efCategory.tone}-text)` : 'var(--chart-neutral-text)'

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
            Cardiac function — LVEF
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold">{latestEf?.value ?? '—'}%</span>
            {isImproving && (
              <span className="text-xs font-medium text-chart-success-text">↑ improving</span>
            )}
          </div>
          <p className="text-[11px] text-chart-subtle mt-0.5">
            {latestEf ? formatDateOnly(latestEf.date) : ''} · from echo
          </p>
        </div>
        {efCategory && (
          <span className={`text-[11px] rounded px-1.5 py-0.5 font-medium ${toneBadge[efCategory.tone]}`}>
            {efCategory.label}
          </span>
        )}
      </div>

      {data.length > 0 && mounted && (
        <div className="h-[88px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="efGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={seriesColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={seriesColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine y={40} stroke="var(--chart-danger-text)" strokeDasharray="3 3" strokeWidth={1} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--chart-neutral-text)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[20, 50]} tick={{ fontSize: 9, fill: 'var(--chart-neutral-text)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, padding: '4px 8px', border: '1px solid rgba(0,0,0,0.08)' }}
                formatter={(v) => [`${v ?? ''}%`, 'EF']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={seriesColor}
                strokeWidth={1.5}
                fill="url(#efGradient)"
                dot={{ r: 2.5, fill: seriesColor, strokeWidth: 0 }}
                activeDot={{ r: 3.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {latestEf && (
        <div className="mt-2">
          <AuditStrip
            modifiedByType="agent"
            modifiedByAgentName={latestEf.agentName}
            modifiedAt={latestEf.modifiedAt}
            explainability={agentActionPayload({
              agentName: latestEf.agentName,
              timestamp: latestEf.modifiedAt,
              title: 'LVEF extracted from echo report',
              actionSummary: `Extracted LVEF ${latestEf.value}% from the most recent echocardiogram report and updated the EF trend.`,
              inputs: [{ label: `Echo report — ${formatDateOnly(latestEf.date)}` }],
              output: { label: 'EF trend update', preview: `LVEF ${latestEf.value}% recorded ${formatDateOnly(latestEf.date)}.` },
            })}
          />
        </div>
      )}
    </div>
  )
}
