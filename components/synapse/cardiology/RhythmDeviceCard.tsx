'use client'

import * as React from 'react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { agentActionPayload, type RiskScorePayload } from '@/lib/explainability'
import { useExplainabilityStore } from '@/lib/stores/explainability-store'
import { formatDateOnly } from '@/lib/utils'
import type { RiskScore, DeviceRecord } from '@/lib/types/cardiology'

interface RhythmDeviceCardProps {
  currentRhythm: string
  cha2ds2Vasc: RiskScore | null
  hasBled: RiskScore | null
  device: DeviceRecord | null
}

const severityColors: Record<string, string> = {
  high: 'text-chart-danger-text bg-chart-danger-bg',
  moderate: 'text-chart-warning-text bg-chart-warning-bg',
  low: 'text-chart-success-text bg-chart-success-bg',
}

const confidenceDot: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

const interpretations: Record<RiskScore['severity'], string> = {
  high: 'High risk for the associated outcome — review the factor breakdown and current therapy.',
  moderate: 'Moderate risk for the associated outcome; weigh against treatment risk factors.',
  low: 'Low risk for the associated outcome at this time.',
}

// Opens the global Explainability Drawer with a risk_score payload (§2.7.6.2)
function openScore(rs: RiskScore) {
  const payload: RiskScorePayload = {
    kind: 'risk_score',
    title: `${rs.displayName} Score`,
    agentName: rs.agentName,
    modifiedByType: 'agent',
    timestamp: rs.computedAt,
    confidence: 'high',
    scoreName: rs.displayName,
    totalPoints: rs.value,
    maxPoints: 9,
    factors: rs.inputs.map((i) => ({ criterion: i.label, points: i.value, met: i.value > 0 })),
    interpretation: interpretations[rs.severity],
  }
  useExplainabilityStore.getState().open(payload)
}

export function RhythmDeviceCard({ currentRhythm, cha2ds2Vasc, hasBled, device }: RhythmDeviceCardProps) {
  return (
    <>
      <div className="rounded-lg border border-black/[0.08] bg-white p-4 space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          Rhythm & Device
        </p>

        {/* Rhythm */}
        <div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-muted-foreground text-xs">Current rhythm</span>
            <span className="font-medium text-xs">{currentRhythm}</span>
          </div>
        </div>

        {/* Risk scores */}
        <div className="space-y-2">
          {cha2ds2Vasc && (
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${confidenceDot[cha2ds2Vasc.agentName ? 'high' : 'medium']}`}
                  title="high confidence"
                />
                <span className="text-muted-foreground">CHA₂DS₂-VASc</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${severityColors[cha2ds2Vasc.severity]}`}
                >
                  {cha2ds2Vasc.value} — {cha2ds2Vasc.severity}
                </span>
                <button
                  onClick={() => openScore(cha2ds2Vasc)}
                  className="text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground transition-colors"
                >
                  why
                </button>
              </div>
            </div>
          )}

          {hasBled && (
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${confidenceDot['high']}`}
                  title="high confidence"
                />
                <span className="text-muted-foreground">HAS-BLED</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${severityColors[hasBled.severity]}`}
                >
                  {hasBled.value} — {hasBled.severity}
                </span>
                <button
                  onClick={() => openScore(hasBled)}
                  className="text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground transition-colors"
                >
                  why
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Device */}
        {device && (
          <div className="pt-2 border-t border-black/[0.06] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Device</span>
              <span className="font-medium">{device.deviceType}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Implanted</span>
              <span>{formatDateOnly(device.implantedAt)}{device.physician ? ` · ${device.physician}` : ''}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Last interrogation</span>
              <span>{formatDateOnly(device.lastInterrogationAt)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Battery</span>
              <span>{device.batteryStatus}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">AF burden</span>
              <span className="font-medium">{device.afBurdenPct}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Therapies delivered</span>
              <span className={device.therapiesDelivered === 0 ? 'text-chart-success-text font-medium' : 'text-chart-danger-text font-medium'}>
                {device.therapiesDelivered}
              </span>
            </div>
            <AuditStrip
              modifiedByType={device.modifiedByType}
              modifiedByAgentName={device.modifiedByAgentName}
              modifiedAt={device.lastInterrogationAt}
              explainability={agentActionPayload({
                agentName: device.modifiedByAgentName ?? 'Device Agent',
                timestamp: device.lastInterrogationAt,
                title: 'Device interrogation filed',
                actionSummary: `Filed the remote ${device.deviceType} interrogation from ${formatDateOnly(device.lastInterrogationAt)}: AF burden ${device.afBurdenPct}%, ${device.therapiesDelivered} therapies delivered, battery ${device.batteryStatus}.`,
                inputs: [
                  { label: `Remote interrogation — ${formatDateOnly(device.lastInterrogationAt)}` },
                  { label: `Device record`, detail: `${device.deviceType}, implanted ${formatDateOnly(device.implantedAt)}` },
                ],
                output: {
                  label: 'Interrogation summary',
                  preview: `AF burden ${device.afBurdenPct}% · therapies delivered ${device.therapiesDelivered} · battery ${device.batteryStatus}`,
                },
              })}
            />
          </div>
        )}
      </div>

    </>
  )
}
