'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import { formatDateOnly, joinDot, cn } from '@/lib/utils'
import type { NeuroModuleProps } from '../conditionRegistry'
import { ScaleCard } from '../scales/ScaleCard'
import type { TherapyEntry } from '@/lib/neurology'

function TherapyTimeline({ title, entries }: { title: string; entries: TherapyEntry[] }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">{title}</p>
      <div className="space-y-1.5">
        {entries.map((t) => (
          <div key={t.id} className="flex items-start justify-between gap-3 text-[13px]">
            <div className="min-w-0">
              <p className="font-medium break-words">{t.name}</p>
              <p className="mt-0.5 text-[11px] text-chart-subtle">
                {joinDot([
                  `${formatDateOnly(t.startDate)} – ${t.endDate ? formatDateOnly(t.endDate) : 'present'}`,
                  t.note,
                ])}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium',
                t.status === 'active' ? 'bg-chart-success-bg text-chart-success-text' : 'bg-muted text-muted-foreground',
              )}
            >
              {t.status === 'active' ? 'Active' : 'Discontinued'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MsModule({ chart }: NeuroModuleProps) {
  // Mount guard so Recharts measures a real container (avoids SSR hydration
  // mismatch); the one-time flip is intentional.
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  const ms = chart.ms
  if (!ms) return null

  const data = ms.edssTrend.map((p) => ({
    year: new Date(p.date).getFullYear().toString(),
    value: p.value,
  }))

  // Relapse markers anchored to the trend where the relapse year has a data point.
  const relapseDots = ms.relapses
    .map((r) => ({
      year: new Date(r.date).getFullYear().toString(),
      value: r.edssAtVisit,
      description: r.description,
    }))
    .filter((r): r is { year: string; value: number; description: string } => r.value != null)

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[15px] font-medium">Multiple sclerosis</span>
        <span className="rounded-full bg-agent-tint px-1.5 py-0.5 text-[10px] font-medium text-accent">specialty module</span>
      </div>

      {/* Scales */}
      <div className="grid grid-cols-2 gap-2">
        <ScaleCard scale={ms.edss} patientName={chart.patientName} mrn={chart.mrn} />
        {ms.msfc && <ScaleCard scale={ms.msfc} patientName={chart.patientName} mrn={chart.mrn} />}
      </div>

      {/* EDSS trend + relapse overlay */}
      <div className="mt-4">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          EDSS over time · relapses overlaid
        </p>
        {mounted && data.length > 0 && (
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', border: '1px solid rgba(0,0,0,0.08)' }} formatter={(v) => [v, 'EDSS']} />
                <Line type="monotone" dataKey="value" stroke="hsl(221 70% 55%)" strokeWidth={1.75} dot={{ r: 2.5, fill: 'hsl(221 70% 55%)', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                {relapseDots.map((r, i) => (
                  <ReferenceDot key={`${r.year}-${i}`} x={r.year} y={r.value} r={4} fill="hsl(0 84% 60%)" stroke="white" strokeWidth={1} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {relapseDots.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-chart-subtle">
            <span className="h-2 w-2 rounded-full bg-chart-danger-text" />
            <span>Relapse events</span>
          </div>
        )}
      </div>

      {/* Relapse history */}
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">Relapse history</p>
        <div className="space-y-1">
          {ms.relapses.map((r) => (
            <div key={r.date} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="min-w-0 break-words">{r.description}</span>
              <span className="shrink-0 text-[11px] text-chart-subtle">
                {joinDot([formatDateOnly(r.date), r.edssAtVisit != null ? `EDSS ${r.edssAtVisit}` : ''])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* DMT timeline */}
      <div className="mt-4">
        <TherapyTimeline title="Disease-modifying therapy timeline" entries={ms.dmtTimeline} />
      </div>
    </div>
  )
}
