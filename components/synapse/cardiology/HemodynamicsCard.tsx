'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  Legend,
} from 'recharts'
import { formatDateOnly } from '@/lib/utils'
import type { VitalReading } from '@/lib/types/cardiology'

interface HemodynamicsCardProps {
  vitalsTrend: VitalReading[]
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate().toString().padStart(2, '0')}`
}

export function HemodynamicsCard({ vitalsTrend }: HemodynamicsCardProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!vitalsTrend.length) return null

  const data = vitalsTrend.map((v) => ({
    date: fmtDate(v.date),
    fullDate: v.date,
    sys: v.systolic,
    dia: v.diastolic,
    hr: v.hr,
  }))

  const latest = vitalsTrend[vitalsTrend.length - 1]

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
        Hemodynamics / vitals trend
      </p>

      <div className="flex gap-6 mb-3">
        <div>
          <p className="text-[11px] text-chart-subtle">Latest BP</p>
          <p className="text-lg font-semibold">{latest.systolic}/{latest.diastolic}</p>
          <p className="text-[11px] text-chart-subtle">{formatDateOnly(latest.date)}</p>
        </div>
        <div>
          <p className="text-[11px] text-chart-subtle">Heart rate</p>
          <p className="text-lg font-semibold">{latest.hr} <span className="text-sm font-normal">bpm</span></p>
          <p className="text-[11px] text-chart-success-text">Rate-controlled</p>
        </div>
      </div>

      {mounted ? (
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <ReferenceLine y={130} stroke="hsl(38 92% 50%)" strokeDasharray="3 3" strokeWidth={1} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#999' }} tickLine={false} axisLine={false} />
              <YAxis domain={[50, 160]} tick={{ fontSize: 9, fill: '#999' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, padding: '4px 8px', border: '1px solid rgba(0,0,0,0.08)' }}
                formatter={(v, name) => [
                  `${v ?? ''}${name === 'hr' ? ' bpm' : ' mmHg'}`,
                  name === 'sys' ? 'Systolic' : name === 'dia' ? 'Diastolic' : 'HR',
                ]}
              />
              <Line type="monotone" dataKey="sys" stroke="hsl(0 84% 60%)" strokeWidth={1.5} dot={{ r: 2, strokeWidth: 0 }} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="dia" stroke="hsl(214 100% 56%)" strokeWidth={1.5} dot={{ r: 2, strokeWidth: 0 }} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="hr" stroke="hsl(38 92% 50%)" strokeWidth={1.5} dot={{ r: 2, strokeWidth: 0 }} activeDot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-chart-subtle">
          <span className="inline-block h-0.5 w-3 bg-chart-danger-bg" style={{ background: 'hsl(0 84% 60%)' }} />
          Systolic
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-chart-subtle">
          <span className="inline-block h-0.5 w-3" style={{ background: 'hsl(214 100% 56%)' }} />
          Diastolic
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-chart-subtle">
          <span className="inline-block h-0.5 w-3 border-dashed border-t" style={{ borderColor: 'hsl(38 92% 50%)', borderTopWidth: 2 }} />
          HR
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-chart-subtle ml-2">
          <span className="inline-block h-0.5 w-3" style={{ background: 'hsl(38 92% 50%)', opacity: 0.5 }} />
          Goal ≤130 sys
        </div>
      </div>
    </div>
  )
}
