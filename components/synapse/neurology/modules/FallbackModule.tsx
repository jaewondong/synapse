'use client'

import * as React from 'react'
import { PackageOpen } from 'lucide-react'
import type { NeuroModuleProps } from '../conditionRegistry'
import { ScaleCard } from '../scales/ScaleCard'

// Renders when an active neuro problem has no mapped conditionKey (e.g. a v2
// condition like movement disorders before its module ships). The spine stays
// fully functional; this region is never blank and never crashes (§6.4, §9).
export function FallbackModule({ chart, problem }: NeuroModuleProps) {
  // Any record_only / link_out scales still surface here (e.g. the MDS-UPDRS
  // link_out — proving the hard licensing rule via the unmapped path, §5).
  const scales = chart.scales

  return (
    <div className="rounded-xl border border-dashed border-black/[0.15] bg-white px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <PackageOpen className="mt-0.5 h-4 w-4 shrink-0 text-chart-subtle" aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-medium">No specialty module for &ldquo;{problem.label}&rdquo; yet</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
            The structured exam, studies, and medications above remain fully available. A dedicated
            module for this condition is planned; until then, recorded and externally-hosted
            instruments appear below.
          </p>
        </div>
      </div>

      {scales.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {scales.map((s) => (
            <ScaleCard key={s.key} scale={s} patientName={chart.patientName} mrn={chart.mrn} />
          ))}
        </div>
      )}
    </div>
  )
}
