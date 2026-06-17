'use client'

import * as React from 'react'
import { Brain } from 'lucide-react'
import { resolveNeuroChart, type NeuroChart } from '@/lib/neurology'
import { NeuroProblemList } from './spine/NeuroProblemList'
import { NeuroExam } from './spine/NeuroExam'
import { NeuroStudies } from './spine/NeuroStudies'
import { NeuroMedications } from './spine/NeuroMedications'
import { resolveModules } from './conditionRegistry'

interface NeurologyViewProps {
  mrn: string
  patientName: string
}

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5" aria-busy>
      <div className="mb-3 h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  )
}

export function NeurologyView({ mrn, patientName }: NeurologyViewProps) {
  // Hold the resolved chart tagged with its mrn so a stale result (or an mrn
  // change) shows skeletons without a synchronous setState reset in the effect.
  const [loaded, setLoaded] = React.useState<{ mrn: string; chart: NeuroChart } | null>(null)

  React.useEffect(() => {
    let alive = true
    void resolveNeuroChart(mrn, patientName).then((c) => {
      if (alive) setLoaded({ mrn, chart: c })
    })
    return () => {
      alive = false
    }
  }, [mrn, patientName])

  const chart = loaded && loaded.mrn === mrn ? loaded.chart : null

  // Skeletons, never spinners (§1.6).
  if (!chart) {
    return (
      <div className="space-y-3 tnum">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={2} />
      </div>
    )
  }

  const modules = resolveModules(chart.problems)

  return (
    <div className="space-y-3 tnum">
      {/* Spine — renders for every neuro patient regardless of diagnosis */}
      <NeuroProblemList problems={chart.problems} />
      <NeuroExam exam={chart.exam} patientName={chart.patientName} mrn={chart.mrn} />

      {/* Condition modules — resolved from active problems; unmapped → fallback;
          none → clean empty state (never broken widgets, §7). */}
      {modules.length > 0 ? (
        modules.map(({ module, problem, renderKey }) => {
          const Module = module.Component
          return <Module key={renderKey} chart={chart} problem={problem} />
        })
      ) : (
        <div className="rounded-xl border border-dashed border-black/[0.15] bg-white px-4 py-6">
          <div className="flex items-start gap-2.5">
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-chart-subtle" aria-hidden />
            <div>
              <p className="text-[13px] font-medium">No active neurology condition</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                The structured exam, studies, and medications remain available. A specialty module
                appears here when an active or workup neurology problem is on file.
              </p>
            </div>
          </div>
        </div>
      )}

      <NeuroStudies studies={chart.studies} patientName={chart.patientName} mrn={chart.mrn} />
      <NeuroMedications
        medications={chart.medications}
        flags={chart.exceptionFlags}
        patientName={chart.patientName}
        mrn={chart.mrn}
      />
    </div>
  )
}
