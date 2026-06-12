import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { PanelProps } from '../panel-registry'
import { SectionLabel } from './section-label'

export function RiskScorePanel({ payload }: PanelProps) {
  if (payload.kind !== 'risk_score') return null
  const p = payload

  return (
    <div className="space-y-4">
      {/* Clinical score, not a confidence value — numerals are correct here (§1.5) */}
      <section className="rounded-lg bg-muted/40 px-3 py-3">
        <p className="text-sm text-muted-foreground">{p.scoreName}</p>
        <p className="text-2xl font-semibold leading-tight">
          {p.totalPoints}
          <span className="text-base font-normal text-muted-foreground"> / {p.maxPoints}</span>
        </p>
      </section>

      <section>
        <SectionLabel>Factors checked</SectionLabel>
        <div className="divide-y divide-border/60">
          {p.factors.map((f) => (
            <div key={f.criterion} className="flex items-start gap-2 py-2">
              <div className={cn('min-w-0 flex-1', !f.met && 'text-muted-foreground')}>
                <p className="text-sm leading-snug break-words">{f.criterion}</p>
                {f.met && f.evidence && (
                  <div className="mt-0.5">
                    {f.evidence.sourceHref ? (
                      <Link
                        href={f.evidence.sourceHref}
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors break-words"
                      >
                        {f.evidence.label}
                      </Link>
                    ) : (
                      <p className="text-xs text-muted-foreground break-words">{f.evidence.label}</p>
                    )}
                    {f.evidence.detail && (
                      <p className="text-xs text-muted-foreground/80 break-words">
                        {f.evidence.detail}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm tabular-nums',
                  f.met ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                {f.met ? `+${f.points}` : '0'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel>Interpretation</SectionLabel>
        <div className="border-l-2 border-accent pl-3">
          <p className="text-sm leading-relaxed">{p.interpretation}</p>
        </div>
      </section>

      {p.guidelineRef && <p className="text-xs text-muted-foreground">{p.guidelineRef}</p>}
    </div>
  )
}
