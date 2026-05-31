'use client'

import * as React from 'react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { ExplainabilityDrawer } from '@/components/synapse/ExplainabilityDrawer'
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

export function RhythmDeviceCard({ currentRhythm, cha2ds2Vasc, hasBled, device }: RhythmDeviceCardProps) {
  const [drawerScore, setDrawerScore] = React.useState<RiskScore | null>(null)

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
                  onClick={() => setDrawerScore(cha2ds2Vasc)}
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
                  onClick={() => setDrawerScore(hasBled)}
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
            />
          </div>
        )}
      </div>

      {drawerScore && (
        <ExplainabilityDrawer
          open={!!drawerScore}
          onClose={() => setDrawerScore(null)}
          title={`${drawerScore.displayName} — Score ${drawerScore.value}`}
          decision={`${drawerScore.displayName} score is ${drawerScore.value} (${drawerScore.severity} risk).`}
          why={`The score is computed by summing weighted risk factors. A score of ${drawerScore.value} indicates ${drawerScore.severity} risk.`}
          inputs={drawerScore.inputs.map((i) => `${i.label}: +${i.value}`)}
          agentName={drawerScore.agentName}
          computedAt={drawerScore.computedAt}
        />
      )}
    </>
  )
}
