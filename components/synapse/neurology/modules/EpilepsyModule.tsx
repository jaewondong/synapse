'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { formatDateOnly, joinDot, cn } from '@/lib/utils'
import type { NeuroModuleProps } from '../conditionRegistry'
import { ScaleCard } from '../scales/ScaleCard'

function monthLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`
}

export function EpilepsyModule({ chart }: NeuroModuleProps) {
  // Mount guard so Recharts measures a real container (avoids SSR hydration
  // mismatch); the one-time flip is intentional.
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  const ep = chart.epilepsy
  if (!ep) return null

  // Clinic- vs patient-diary-sourced counts are plotted as distinct series so
  // patient-generated data is first-class and visually distinguished (§6.1).
  const data = ep.seizures
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      label: monthLabel(s.date),
      clinic: s.source === 'clinic' ? s.count : null,
      diary: s.source === 'patient_diary' ? s.count : null,
    }))

  // Window anchored to the latest recorded entry (pure — no Date.now() in render).
  const latestMs = ep.seizures.reduce((max, s) => Math.max(max, new Date(s.date).getTime()), 0)
  const total90 = ep.seizures
    .filter((s) => latestMs - new Date(s.date).getTime() <= 90 * 864e5)
    .reduce((n, s) => n + s.count, 0)

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[15px] font-medium">Epilepsy</span>
        <span className="rounded-full bg-agent-tint px-1.5 py-0.5 text-[10px] font-medium text-accent">specialty module</span>
      </div>

      {/* Scales */}
      <div className="grid grid-cols-2 gap-2">
        {ep.scales.map((s) => (
          <ScaleCard key={s.key} scale={s} patientName={chart.patientName} mrn={chart.mrn} />
        ))}
      </div>

      {/* Seizure frequency trend — clinic vs patient diary */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
            Seizure frequency
          </p>
          <span className="text-[11px] text-chart-subtle">{total90} in last 90 days</span>
        </div>
        {mounted && data.length > 0 && (
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#999' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#999' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', border: '1px solid rgba(0,0,0,0.08)' }} />
                <Line name="Clinic" type="monotone" dataKey="clinic" connectNulls stroke="hsl(221 70% 55%)" strokeWidth={1.75} dot={{ r: 2.5, fill: 'hsl(221 70% 55%)', strokeWidth: 0 }} />
                <Line name="Patient diary" type="monotone" dataKey="diary" connectNulls stroke="hsl(262 60% 60%)" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2.5, fill: 'hsl(262 60% 60%)', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-1 flex items-center gap-4 text-[11px] text-chart-subtle">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'hsl(221 70% 55%)' }} />Clinic</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'hsl(262 60% 60%)' }} />Patient diary</span>
        </div>
      </div>

      {/* AED timeline */}
      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">AED history</p>
        <div className="space-y-1.5">
          {ep.aedTimeline.map((t) => (
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
    </div>
  )
}
