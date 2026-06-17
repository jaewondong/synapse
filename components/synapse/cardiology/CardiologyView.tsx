'use client'

import * as React from 'react'
import { agentActionPayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { EFTrendCard } from './EFTrendCard'
import { RhythmDeviceCard } from './RhythmDeviceCard'
import { HemodynamicsCard } from './HemodynamicsCard'
import { BiomarkersCard } from './BiomarkersCard'
import { DiagnosticsCard } from './DiagnosticsCard'
import { RiskScoresCard } from './RiskScoresCard'
import { GdmtFlagsCard } from './GdmtFlagsCard'
import { formatDateOnly } from '@/lib/utils'
import type { CardiacData } from '@/lib/types/cardiology'

interface CardiologyViewProps {
  cardiacData: CardiacData
}

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

export function CardiologyView({ cardiacData }: CardiologyViewProps) {
  const cha2ds2Vasc = cardiacData.riskScores.find((rs) => rs.name === 'cha2ds2vasc') ?? null
  const hasBled = cardiacData.riskScores.find((rs) => rs.name === 'hasbled') ?? null

  // "why" on the summary banner opens the global Explainability Drawer (§2.7)
  function openSummaryWhy() {
    useExplainabilityStore.getState().open(
      agentActionPayload({
        agentName: 'Cardiology Summary Agent',
        timestamp: cardiacData.agentSummaryGeneratedAt,
        title: 'Cardiology summary',
        confidence: cardiacData.agentSummaryConfidence as 'high' | 'medium' | 'low',
        actionSummary: cardiacData.agentSummary,
        reasoning: [
          "Synthesized from the patient's echocardiogram trend, active medication list, computed risk scores, and device interrogation data.",
        ],
        inputs: [
          { label: 'Echo 04/2026', detail: 'LVEF 38%' },
          { label: 'GDMT regimen', detail: 'ARNI + beta-blocker + MRA + SGLT2i' },
          { label: `CHA₂DS₂-VASc: ${cha2ds2Vasc?.value ?? '—'}` },
          { label: 'Apixaban active anticoagulation' },
        ],
        output: { label: 'Chart summary', preview: cardiacData.agentSummary },
      }),
    )
  }

  return (
    // .tnum cascades tabular numerals to all clinical values below (§2.8, §7.3)
    <div className="mt-4 tnum">
      {/* Section label */}
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Cardiology — agent-summarized
      </p>

      {/* Agent summary banner */}
      {cardiacData.agentSummary && (
        <div className="rounded-lg bg-agent-tint border border-black/[0.06] px-3.5 py-2.5 mb-4 flex items-start gap-2.5">
          <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span className="text-accent text-sm leading-none">⊕</span>
            <span
              className={`h-2 w-2 rounded-full ${confidenceDot[cardiacData.agentSummaryConfidence]}`}
              title={`${cardiacData.agentSummaryConfidence} confidence`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] italic text-muted-foreground leading-relaxed">
              &ldquo;{cardiacData.agentSummary}&rdquo;
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-chart-subtle mt-1">
              <span>Cardiology Summary Agent</span>
              {cardiacData.agentSummaryGeneratedAt && (
                <>
                  <span>·</span>
                  <span>{formatDateOnly(cardiacData.agentSummaryGeneratedAt)}</span>
                </>
              )}
              <span>·</span>
              <button
                onClick={openSummaryWhy}
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                why
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-column responsive grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* (a) EF Trend */}
        {cardiacData.efTrend.length > 0 && (
          <EFTrendCard efTrend={cardiacData.efTrend} latestEf={cardiacData.latestEf} />
        )}

        {/* (b) Rhythm & Device */}
        <RhythmDeviceCard
          currentRhythm={cardiacData.currentRhythm}
          cha2ds2Vasc={cha2ds2Vasc}
          hasBled={hasBled}
          device={cardiacData.device}
        />

        {/* (c) Hemodynamics */}
        {cardiacData.vitalsTrend.length > 0 && (
          <HemodynamicsCard vitalsTrend={cardiacData.vitalsTrend} />
        )}

        {/* (d) Biomarkers & labs */}
        {cardiacData.labResults.length > 0 && (
          <BiomarkersCard labResults={cardiacData.labResults} ntProBnpTrend={cardiacData.ntProBnpTrend} />
        )}
      </div>

      {/* Full-width panels */}
      <div className="mt-3 space-y-3">
        {/* (e) Diagnostics */}
        {cardiacData.diagnostics.length > 0 && (
          <DiagnosticsCard diagnostics={cardiacData.diagnostics} />
        )}

        {/* (f) Risk scores */}
        {cardiacData.riskScores.length > 0 && (
          <RiskScoresCard riskScores={cardiacData.riskScores} />
        )}

        {/* (g) GDMT flags */}
        {cardiacData.gdmtFlags.length > 0 && (
          <GdmtFlagsCard flags={cardiacData.gdmtFlags} />
        )}
      </div>

    </div>
  )
}
