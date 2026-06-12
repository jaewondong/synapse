'use client'

import * as React from 'react'
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { agentActionPayload } from '@/lib/explainability'
import { formatDateOnly } from '@/lib/utils'
import type { LabResult } from '@/lib/types/cardiology'

interface BiomarkersCardProps {
  labResults: LabResult[]
  ntProBnpTrend: number[]
}

const flagColors: Record<string, string> = {
  Normal: 'text-chart-success-text',
  'At goal': 'text-chart-success-text',
  High: 'text-chart-danger-text',
  'High, improving': 'text-chart-warning-text',
  Low: 'text-chart-warning-text',
  Borderline: 'text-chart-warning-text',
  Critical: 'text-chart-danger-text',
}

function NtProBnpSparkline({ trend }: { trend: number[] }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (trend.length < 2 || !mounted) return null
  const data = trend.map((v, i) => ({ i, v }))
  return (
    <span className="inline-flex items-center ml-1.5" style={{ width: 48, height: 18 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line type="monotone" dataKey="v" stroke="hsl(38 92% 50%)" strokeWidth={1.5} dot={false} />
          <Tooltip
            contentStyle={{ fontSize: 10, padding: '2px 6px', border: '1px solid rgba(0,0,0,0.08)' }}
            formatter={(v) => [`${v ?? ''} pg/mL`, 'NT-proBNP']}
          />
        </LineChart>
      </ResponsiveContainer>
    </span>
  )
}

export function BiomarkersCard({ labResults, ntProBnpTrend }: BiomarkersCardProps) {
  // Show latest value for each unique test
  const seen = new Set<string>()
  const latest: LabResult[] = []
  for (const r of [...labResults].sort((a, b) => b.resultedAt.localeCompare(a.resultedAt))) {
    if (!seen.has(r.testName)) {
      seen.add(r.testName)
      latest.push(r)
    }
  }

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle mb-3">
        Cardiac biomarkers & relevant labs
      </p>

      <div className="space-y-0">
        {latest.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center justify-between py-2 text-[12px] ${i < latest.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-muted-foreground truncate">{r.testName}</span>
              {r.testName.toLowerCase().includes('nt-probnp') && ntProBnpTrend.length > 1 && (
                <NtProBnpSparkline trend={ntProBnpTrend} />
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <div className="text-right">
                <span className="font-medium">
                  {r.value} <span className="text-[10px] text-chart-subtle font-normal">{r.unit}</span>
                </span>
                {r.refRange && (
                  <p className="text-[10px] text-chart-subtle">ref {r.refRange}</p>
                )}
              </div>
              <span className={`text-[11px] font-medium ${flagColors[r.flag] ?? 'text-muted-foreground'} w-24 text-right`}>
                {r.flag}
              </span>
              <span className="text-[10px] text-chart-subtle w-16 text-right">
                {formatDateOnly(r.resultedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {latest[0]?.modifiedByType === 'agent' && (
        <div className="mt-2">
          <AuditStrip
            modifiedByType="agent"
            modifiedByAgentName={latest[0].modifiedByAgentName}
            modifiedAt={latest[0].resultedAt}
            explainability={agentActionPayload({
              agentName: latest[0].modifiedByAgentName ?? 'Results Agent',
              timestamp: latest[0].resultedAt,
              title: 'Cardiac biomarkers filed',
              actionSummary: `Filed ${latest.length} cardiac biomarker result${latest.length === 1 ? '' : 's'} from the lab interface, most recently ${latest[0].testName} ${latest[0].value} ${latest[0].unit ?? ''}.`,
              inputs: latest.slice(0, 4).map((r) => ({
                label: `${r.testName} — ${formatDateOnly(r.resultedAt)}`,
                detail: [r.value, r.unit, r.flag].filter(Boolean).join(' '),
              })),
              output: {
                label: 'Biomarker panel update',
                preview: latest.map((r) => `${r.testName}: ${r.value} ${r.unit ?? ''}`).join('; '),
              },
            })}
          />
        </div>
      )}
    </div>
  )
}
