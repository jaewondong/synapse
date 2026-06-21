'use client'

// Synapse §2.9 §5 — triage panel. Agent-drafted assessment (⊕) the operator owns
// (→ ⊘). Urgency escalates INDEPENDENTLY of intent: an urgent email shows a
// persistent escalation affordance even when intent is scheduling, so a red-flag
// symptom is never buried behind the calendar task.
import { AlertTriangle, Check, Stethoscope } from 'lucide-react'
import { ConfidenceDot } from '@/components/synapse/insurance/confidence-dot'
import { agentActionPayload } from '@/lib/explainability'
import { cn } from '@/lib/utils'
import { AgentAuditLine } from './agent-audit-line'
import type { InboundEmailRecord } from '@/lib/inbound/InboundEmail'

const INTENT_LABEL: Record<string, string> = {
  scheduling: 'Scheduling',
  clinical_question: 'Clinical question',
  admin: 'Administrative',
  other: 'Other',
}

const URGENCY_LABEL: Record<string, string> = {
  routine: 'Routine',
  attention: 'Needs attention',
  urgent: 'Urgent',
}

const URGENCY_DOT: Record<string, 'high' | 'medium' | 'low'> = {
  urgent: 'low',
  attention: 'medium',
  routine: 'high',
}

export function TriagePanel({
  record,
  busy,
  onConfirm,
  onEscalate,
}: {
  record: InboundEmailRecord
  busy: boolean
  onConfirm: () => void
  onEscalate: () => void
}) {
  const triage = record.triage
  if (!triage) {
    return (
      <div className="rounded-lg border border-border p-4">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-3 w-48 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  const confirmed = triage.provenance === 'human'
  const isUrgent = triage.urgency === 'urgent'

  const payload = agentActionPayload({
    agentName: 'Triage Agent',
    timestamp: record.receivedAt,
    title: 'Email triage',
    actionSummary: `Classified this email as ${INTENT_LABEL[triage.intent]} · ${URGENCY_LABEL[triage.urgency]}.`,
    confidence: triage.urgencyConfidence,
    reasoning: [
      `Intent: ${INTENT_LABEL[triage.intent]} (${triage.intentConfidence} confidence).`,
      triage.urgencyReasons.length
        ? `Urgency driven by: ${triage.urgencyReasons.join(', ')}.`
        : 'No red-flag symptom language detected.',
    ],
    inputs: [
      { label: 'Subject', detail: record.subject },
      { label: 'Message body', detail: record.text.slice(0, 240) },
    ],
    output: { label: 'Triage', preview: `${INTENT_LABEL[triage.intent]} / ${URGENCY_LABEL[triage.urgency]}` },
    guardrails: [
      'Classifies for routing, not diagnosis (§1.G-B).',
      'Email body treated as data, not instructions (§1.G-F).',
    ],
  })

  return (
    <section className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Triage</h3>
        <AgentAuditLine
          provenance={triage.provenance}
          agentName="Triage Agent"
          timestamp={record.receivedAt}
          payload={payload}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Intent */}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 text-muted-foreground">Intent</span>
          <span className="font-medium">{INTENT_LABEL[triage.intent]}</span>
          <ConfidenceDot confidence={triage.intentConfidence} />
        </div>

        {/* Urgency */}
        <div className="flex items-start gap-2 text-sm">
          <span className="w-20 shrink-0 text-muted-foreground">Urgency</span>
          <div className="min-w-0">
            <span className={cn('font-medium', isUrgent && 'text-chart-danger-text')}>
              {URGENCY_LABEL[triage.urgency]}
            </span>
            <ConfidenceDot confidence={URGENCY_DOT[triage.urgency]} className="ml-2" />
            {triage.urgencyReasons.length > 0 && (
              <ul className="mt-1 text-xs text-muted-foreground list-disc pl-4">
                {triage.urgencyReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* §1.G-A scope — clinical remainder the agent will NOT act on */}
        {triage.flaggedForClinician && (
          <div className="flex items-start gap-2 rounded-md bg-chart-warning-bg/40 border border-chart-warning-text/30 p-2.5 text-xs">
            <Stethoscope className="h-3.5 w-3.5 shrink-0 mt-0.5 text-chart-warning-text" />
            <span>{triage.flaggedForClinician}</span>
          </div>
        )}

        {/* §1.G-B urgency gate — persistent escalation affordance */}
        {isUrgent && (
          <div className="flex items-center justify-between rounded-md bg-chart-danger-bg/40 border border-chart-danger-text/30 p-2.5">
            <div className="flex items-center gap-2 text-xs text-chart-danger-text">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Urgent symptom — must be flagged to a clinician.</span>
            </div>
            {record.operator.escalationActioned ? (
              <span className="flex items-center gap-1 text-xs font-medium text-chart-success-text">
                <Check className="h-3.5 w-3.5" /> Flagged
              </span>
            ) : (
              <button
                onClick={onEscalate}
                disabled={busy}
                className="min-h-[36px] rounded-md bg-chart-danger-text px-3 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Flag to clinician <kbd className="ml-1 opacity-70">e</kbd>
              </button>
            )}
          </div>
        )}

        {/* Confirm / override */}
        <div className="pt-1">
          {confirmed ? (
            <span className="flex items-center gap-1.5 text-xs text-chart-success-text">
              <Check className="h-3.5 w-3.5" /> Triage confirmed
            </span>
          ) : (
            <button
              onClick={onConfirm}
              disabled={busy}
              className="min-h-[40px] rounded-md border border-border px-3 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
            >
              Confirm triage <kbd className="ml-1 text-muted-foreground">t</kbd>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
