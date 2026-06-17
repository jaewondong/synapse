'use client'

import * as React from 'react'
import { ExternalLink, ArrowUpRight } from 'lucide-react'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { PROVENANCE_GLYPH } from '@/lib/explainability'
import type {
  AgentActionPayload,
  ExplainabilityPayload,
  RiskScorePayload,
} from '@/lib/explainability'
import { safeFormatDate } from '@/lib/utils'
import type { NeuroScale } from '@/lib/neurology'
import { resolveScaleDefinition } from './scaleRegistry'

interface ScaleCardProps {
  scale: NeuroScale
  patientName: string
  mrn: string
}

// compute + additive factors + a maxPoints → risk_score (the §2.7 RiskScorePanel
// contract). A computed-but-non-additive composite (e.g. MSFC) instead opens an
// agent_action explaining the computation — both honor `compute` licensing.
function buildComputePayload(scale: NeuroScale, patientName: string, mrn: string): ExplainabilityPayload {
  const header = {
    agentName: 'Neuro Scale Agent',
    modifiedByType: 'agent' as const,
    timestamp: scale.capturedAt ?? '',
    patientName,
    patientMrn: mrn,
    title: scale.name,
  }

  const isAdditive = scale.maxPoints != null && (scale.factors?.length ?? 0) > 0
  if (isAdditive) {
    const payload: RiskScorePayload = {
      ...header,
      kind: 'risk_score',
      confidence: 'high',
      scoreName: scale.name,
      totalPoints: scale.totalPoints ?? 0,
      maxPoints: scale.maxPoints ?? 0,
      factors: (scale.factors ?? []).map((f) => ({
        criterion: f.criterion,
        points: f.points,
        met: f.met,
        evidence: f.evidenceLabel
          ? { label: f.evidenceLabel, sourceHref: f.evidenceHref }
          : undefined,
      })),
      interpretation: scale.interpretation ?? 'Agent-computed clinical scale; review the factor breakdown.',
    }
    return payload
  }

  const payload: AgentActionPayload = {
    ...header,
    kind: 'agent_action',
    actionSummary: `Computed ${scale.name}${scale.totalPoints != null ? ` = ${scale.totalPoints}` : ''} from its component measures.`,
    reasoning: scale.interpretation ? [scale.interpretation] : [],
    inputs: (scale.factors ?? []).map((f) => ({ label: f.criterion, detail: f.evidenceLabel })),
    output: { label: scale.name, preview: scale.interpretation ?? `${scale.name}: ${scale.totalPoints ?? '—'}` },
  }
  return payload
}

export function ScaleCard({ scale, patientName, mrn }: ScaleCardProps) {
  // Defensive: trust the instance licensing, but a fixture that drifts from the
  // registry should never accidentally compute a non-compute instrument.
  const def = resolveScaleDefinition(scale.key)
  const licensing = def.licensing === 'compute' ? scale.licensing : def.licensing

  const glyph = PROVENANCE_GLYPH[scale.provenance]

  if (licensing === 'link_out') {
    return (
      <div className="rounded-lg border border-black/[0.08] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[13px] font-medium" title={scale.name}>
            {scale.name}
          </span>
          {scale.externalHref ? (
            <a
              href={scale.externalHref}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1 text-[11px] text-accent underline underline-offset-2 hover:opacity-80"
            >
              Open instrument
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <span className="shrink-0 text-[11px] italic text-chart-subtle">External</span>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-chart-subtle">
          Not hosted in Synapse — licensing restricted. Score is recorded externally.
        </p>
      </div>
    )
  }

  if (licensing === 'record_only') {
    return (
      <div className="rounded-lg border border-black/[0.08] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[13px] font-medium" title={scale.name}>
            <span className="mr-1 text-chart-subtle" aria-hidden>{glyph}</span>
            {scale.name}
          </span>
          <span className="shrink-0 text-[13px] font-semibold tnum">{scale.recordedValue ?? '—'}</span>
        </div>
        <p className="mt-1 text-[11px] text-chart-subtle">
          Recorded value — entered, not computed by Synapse.
        </p>
      </div>
    )
  }

  // compute
  const openDrawer = () =>
    useExplainabilityStore.getState().open(buildComputePayload(scale, patientName, mrn))

  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-chart-subtle" aria-hidden>{glyph}</span>
          <span className="min-w-0 truncate text-[13px] font-medium" title={scale.name}>{scale.name}</span>
        </div>
        <span className="shrink-0 text-[15px] font-semibold tnum">
          {scale.totalPoints ?? '—'}
          {scale.maxPoints != null && (
            <span className="text-[12px] font-normal text-chart-subtle"> / {scale.maxPoints}</span>
          )}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-chart-subtle">
        {scale.capturedAt && <span>{safeFormatDate(scale.capturedAt)}</span>}
        {scale.capturedAt && <span>·</span>}
        <button
          onClick={openDrawer}
          title="Open explainability (o)"
          className="inline-flex items-center gap-0.5 underline underline-offset-2 transition-colors hover:text-muted-foreground"
        >
          why
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  )
}
