import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentActionPayload } from '@/lib/explainability'
import type { PanelProps } from '../panel-registry'
import { SectionLabel } from './section-label'

const DECISION_STYLES: Record<NonNullable<AgentActionPayload['decisionState']>, string> = {
  pending: 'bg-chart-neutral-bg text-chart-neutral-text',
  approved: 'bg-chart-success-bg text-chart-success-text',
  edited: 'bg-chart-info-bg text-chart-info-text',
  rejected: 'bg-chart-danger-bg text-chart-danger-text',
}

export function AgentActionPanel({ payload }: PanelProps) {
  if (payload.kind !== 'agent_action') return null
  const p = payload

  return (
    <div className="space-y-4">
      <section>
        <SectionLabel>What the agent did</SectionLabel>
        <p className="text-sm leading-relaxed">{p.actionSummary}</p>
      </section>

      {p.reasoning.length > 0 && (
        <section>
          <SectionLabel>Why</SectionLabel>
          <ol className="list-decimal space-y-1 pl-4 text-sm leading-snug marker:text-muted-foreground">
            {p.reasoning.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      )}

      {p.inputs.length > 0 && (
        <section>
          <SectionLabel>Inputs reviewed</SectionLabel>
          <div className="space-y-2">
            {p.inputs.map((input) => (
              <div key={input.label} className="min-w-0">
                {/* Never a link without an href (B10) */}
                {input.sourceHref ? (
                  <Link
                    href={input.sourceHref}
                    className="text-sm underline underline-offset-2 hover:text-muted-foreground transition-colors break-words"
                  >
                    {input.label}
                  </Link>
                ) : (
                  <p className="text-sm break-words">{input.label}</p>
                )}
                {input.detail && (
                  <p className="text-xs text-muted-foreground break-words">{input.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionLabel>Output</SectionLabel>
        <div className="rounded-lg border border-border px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-1">{p.output.label}</p>
          <p className="text-sm leading-relaxed line-clamp-6 break-words">{p.output.preview}</p>
        </div>
      </section>

      {p.guardrails && p.guardrails.length > 0 && (
        <section>
          <SectionLabel>Safety checks</SectionLabel>
          <div className="space-y-1.5">
            {p.guardrails.map((g) => (
              <p key={g} className="flex items-start gap-1.5 text-sm leading-snug">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-success-text" aria-hidden />
                <span className="break-words">{g}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      {p.decisionState && (
        <section>
          <SectionLabel>Decision state</SectionLabel>
          <span
            className={cn(
              'inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium capitalize',
              DECISION_STYLES[p.decisionState],
            )}
          >
            {p.decisionState}
          </span>
          {p.decisionState === 'pending' && (
            <div className="mt-2">
              {/* Navigation only — no approve/reject from inside the drawer (locked §1.9) */}
              <Link
                href="/inbox"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                Open in Review Queue
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
