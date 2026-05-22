import * as React from 'react'
import { formatDateOnly } from '@/lib/utils'
import type { SeizureLog } from '@/lib/types/chart'

interface NeurologyWidgetProps {
  seizureLog: SeizureLog
}

export function NeurologyWidget({ seizureLog }: NeurologyWidgetProps) {
  const trend = seizureLog.trendVsPriorQuarterPercent
  const isImproving = trend <= 0
  const trendLabel = `${isImproving ? '↓' : '↑'} ${Math.abs(trend)}%`

  return (
    <div>
      <p className="mt-4 mb-1.5 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Specialty data — seizure log
      </p>
      <div className="rounded-lg bg-chart-surface px-3 py-2.5 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last 90 days</span>
          <span className="font-medium">{seizureLog.last90Days} events</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trend vs. prior quarter</span>
          <span
            className={`font-medium ${isImproving ? 'text-chart-success-text' : 'text-chart-danger-text'}`}
          >
            {trendLabel}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last event</span>
          <span>
            {formatDateOnly(seizureLog.lastEvent.date)} · {seizureLog.lastEvent.duration} ·{' '}
            {seizureLog.lastEvent.type}
          </span>
        </div>
      </div>
    </div>
  )
}
