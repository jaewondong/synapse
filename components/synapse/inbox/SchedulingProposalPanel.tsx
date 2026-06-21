'use client'

// Synapse §2.9 §6 — scheduling proposal. The agent PROPOSES match + slots +
// draft reply; the operator confirms each and commits, then sends the reply as a
// separate explicit action. No single button does match+book+send (§1.1). Match
// confidence is a DOT; scheduling confidence is the one numeric % (§10).
import { useCallback, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Check, CalendarClock, ShieldAlert, Send } from 'lucide-react'
import { toast } from 'sonner'
import { ConfidenceDot } from '@/components/synapse/insurance/confidence-dot'
import { agentActionPayload } from '@/lib/explainability'
import { cn, formatChartDate } from '@/lib/utils'
import { AgentAuditLine } from './agent-audit-line'
import type { InboundEmailRecord, SlotCandidate } from '@/lib/inbound/InboundEmail'
import type { ReplyDestination } from '@/lib/scheduling/sendConfirmationReply'

function slotLabel(slot: SlotCandidate): string {
  return `${formatChartDate(slot.start)} · ${slot.provider} · ${slot.visitType}`
}

function confidenceCue(pct: number): string {
  if (pct >= 90) return 'High confidence — slots look right'
  if (pct >= 75) return 'Good confidence — review the slot'
  return 'Lower confidence — double-check before booking'
}

export function SchedulingProposalPanel({
  record,
  busy,
  onCommit,
  onSendReply,
  onLoadDestination,
}: {
  record: InboundEmailRecord
  busy: boolean
  onCommit: (mrn: string, slotIndex: number) => void
  onSendReply: (toAddress: string, body: string) => void
  onLoadDestination: () => Promise<ReplyDestination>
}) {
  const proposal = record.proposal
  const committed = !!record.operator.committedAppointmentId
  const isDestructive = proposal?.requestedIntent !== 'new'

  const [selectedMrn, setSelectedMrn] = useState<string | null>(record.operator.confirmedMrn)
  const [selectedSlot, setSelectedSlot] = useState<number>(0)
  const [targetConfirmed, setTargetConfirmed] = useState(false)
  const [draftBody, setDraftBody] = useState(proposal?.draftReply.body ?? '')
  const [draftEdited, setDraftEdited] = useState(false)
  const [destination, setDestination] = useState<ReplyDestination | null>(null)
  const [chosenAddress, setChosenAddress] = useState('')

  const commitReadyCandidate = proposal?.matchCandidates.find(
    (c) => c.mrn === selectedMrn && !c.needsSecondIdentifier,
  )
  const slotOk = isDestructive ? targetConfirmed : !!proposal?.slots[selectedSlot]
  const canCommit = !committed && !!commitReadyCandidate && slotOk && !busy

  const doCommit = useCallback(() => {
    if (!canCommit || !selectedMrn) return
    onCommit(selectedMrn, selectedSlot)
  }, [canCommit, selectedMrn, selectedSlot, onCommit])

  // Load reply destination once committed (surfaces on-file/inbound mismatch).
  useEffect(() => {
    if (committed && !destination) {
      onLoadDestination()
        .then((d) => {
          setDestination(d)
          setChosenAddress(d.mismatch ? '' : d.onFileEmail ?? d.inboundEmail)
        })
        .catch(() => setDestination({ onFileEmail: null, inboundEmail: record.fromEmail, mismatch: true }))
    }
  }, [committed, destination, onLoadDestination, record.fromEmail])

  // Hotkeys (don't fire while typing in the textarea — default enableOnFormTags=false).
  useHotkeys('m', () => {
    const first = proposal?.matchCandidates.find((c) => !c.needsSecondIdentifier)
    if (first) setSelectedMrn(first.mrn)
  }, [proposal])
  useHotkeys('1', () => setSelectedSlot(0))
  useHotkeys('2', () => setSelectedSlot(1))
  useHotkeys('3', () => setSelectedSlot(2))
  useHotkeys('c', () => doCommit(), [doCommit])

  if (!proposal) return null

  const payload = agentActionPayload({
    agentName: 'Scheduling Agent',
    timestamp: record.receivedAt,
    title: 'Scheduling proposal',
    actionSummary: proposal.abstained
      ? 'Declined to propose slots — identity or confidence too low to book safely.'
      : `Proposed a ${proposal.requestedIntent} with ${proposal.slots.length} candidate slot(s).`,
    reasoning: [
      `Requested intent: ${proposal.requestedIntent}.`,
      proposal.extractedConstraints.length
        ? `Constraints: ${proposal.extractedConstraints.join(', ')}.`
        : 'No scheduling constraints extracted.',
    ],
    inputs: [
      { label: 'Inbound email', detail: record.subject },
      { label: 'Schedule availability', detail: 'existing provider availability' },
    ],
    output: {
      label: 'Proposal',
      preview: proposal.abstained ? 'abstained' : proposal.slots.map(slotLabel).join(' | '),
    },
    guardrails: [
      'No patient auto-selected; operator confirms match (§1.G-C).',
      'Did not book or send — operator commits and sends (§1.1).',
      ...proposal.notActedOn,
    ],
  })

  return (
    <section className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Scheduling proposal</h3>
        <AgentAuditLine
          provenance={proposal.provenance}
          agentName="Scheduling Agent"
          timestamp={record.receivedAt}
          payload={payload}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Scheduling confidence — the ONE numeric % (§10), with plain-language cue */}
        {!proposal.abstained && proposal.schedulingConfidencePct !== null && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {proposal.schedulingConfidencePct}%
            </span>
            <span className="text-xs text-muted-foreground">
              {confidenceCue(proposal.schedulingConfidencePct)}
            </span>
          </div>
        )}

        {/* Abstention (§1.G-D) — no fabricated slots */}
        {proposal.abstained && (
          <div className="flex items-start gap-2 rounded-md bg-chart-warning-bg/40 border border-chart-warning-text/30 p-3 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-chart-warning-text" />
            <span>{proposal.abstainReason}</span>
          </div>
        )}

        {/* 1. Patient match — DOTS, operator confirms one (no auto-select) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Patient match
          </p>
          {proposal.matchCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No defensible match — search and link the patient manually.
            </p>
          ) : (
            proposal.matchCandidates.map((c) => {
              const selected = c.mrn === selectedMrn
              return (
                <button
                  key={c.mrn}
                  onClick={() => setSelectedMrn(c.mrn)}
                  disabled={committed}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-md border p-3 text-left transition-colors min-h-[44px]',
                    selected ? 'border-accent bg-agent-tint' : 'border-border hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2',
                      selected ? 'border-accent bg-accent' : 'border-muted-foreground/40',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{c.name}</span>
                      <ConfidenceDot confidence={c.matchConfidence} />
                      <span className="text-xs text-muted-foreground">MRN {c.mrn}</span>
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      DOB {c.dob} · {c.matchBasis.join(' · ')}
                    </span>
                    {c.needsSecondIdentifier && (
                      <span className="mt-1 inline-block text-[11px] text-chart-warning-text">
                        Needs a second identifier (DOB / on-file contact) before commit (§1.G-C)
                      </span>
                    )}
                  </span>
                </button>
              )
            })
          )}
          {!committed && proposal.matchCandidates.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Confirm a patient <kbd className="text-muted-foreground">m</kbd>
            </p>
          )}
        </div>

        {/* 2. Slots (new) OR target appointment (reschedule/cancel, §1.G-E) */}
        {!proposal.abstained && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isDestructive ? 'Existing appointment to change' : 'Proposed times'}
            </p>

            {isDestructive ? (
              <label className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={targetConfirmed}
                  disabled={committed || !proposal.targetAppointmentId}
                  onChange={(e) => setTargetConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  {proposal.targetAppointmentId ? (
                    <>
                      Confirm this {proposal.requestedIntent} affects the patient&apos;s upcoming
                      appointment{' '}
                      {proposal.slots[selectedSlot] && (
                        <>→ new time {slotLabel(proposal.slots[selectedSlot])}</>
                      )}
                      .
                    </>
                  ) : (
                    <span className="text-chart-warning-text">
                      Could not pin the existing appointment — open the Schedule and confirm manually.
                    </span>
                  )}
                </span>
              </label>
            ) : (
              proposal.slots.map((slot, i) => {
                const selected = i === selectedSlot
                return (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(i)}
                    disabled={committed}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-md border p-3 text-left transition-colors min-h-[44px]',
                      selected ? 'border-accent bg-agent-tint' : 'border-border hover:bg-muted/40',
                    )}
                  >
                    <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{slotLabel(slot)}</span>
                    <kbd className="ml-auto text-xs text-muted-foreground">{i + 1}</kbd>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* 3. Draft reply — editable (⊕ until edited/sent) */}
        {!proposal.abstained && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Draft reply {draftEdited && <span className="normal-case">(edited)</span>}
            </p>
            <textarea
              value={draftBody}
              onChange={(e) => {
                setDraftBody(e.target.value)
                setDraftEdited(true)
              }}
              rows={6}
              disabled={record.operator.replySent}
              className="w-full resize-y rounded-md border border-border bg-background p-3 text-sm font-mono leading-relaxed disabled:opacity-60"
            />
          </div>
        )}

        {/* 4. Commit, then 5. Send reply — distinct explicit steps */}
        {!proposal.abstained && (
          <div className="flex flex-col gap-2 pt-1">
            {!committed ? (
              <button
                onClick={doCommit}
                disabled={!canCommit}
                className="min-h-[44px] rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
              >
                Commit to schedule <kbd className="ml-1 opacity-70">c</kbd>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-chart-success-text">
                <Check className="h-4 w-4" /> Committed to schedule
              </span>
            )}

            {committed && !record.operator.replySent && (
              <ReplyDestinationControl
                destination={destination}
                chosenAddress={chosenAddress}
                setChosenAddress={setChosenAddress}
                onSend={() => {
                  if (!chosenAddress) {
                    toast.error('Choose a destination for the reply.')
                    return
                  }
                  onSendReply(chosenAddress, draftBody)
                }}
                busy={busy}
              />
            )}

            {record.operator.replySent && (
              <span className="flex items-center gap-1.5 text-sm text-chart-success-text">
                <Check className="h-4 w-4" /> Reply sent · message resolved
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// §1.G-G: when the inbound sender differs from the on-file contact, the operator
// must choose the destination — the confirmation is never auto-sent to the
// unverified inbound address.
function ReplyDestinationControl({
  destination,
  chosenAddress,
  setChosenAddress,
  onSend,
  busy,
}: {
  destination: ReplyDestination | null
  chosenAddress: string
  setChosenAddress: (v: string) => void
  onSend: () => void
  busy: boolean
}) {
  if (!destination) {
    return <div className="h-9 w-40 rounded bg-muted animate-pulse" />
  }

  const options = [
    destination.onFileEmail ? { label: `On-file: ${destination.onFileEmail}`, value: destination.onFileEmail } : null,
    { label: `Inbound sender: ${destination.inboundEmail}`, value: destination.inboundEmail },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="rounded-md border border-border p-3 space-y-2">
      {destination.mismatch && (
        <p className="flex items-start gap-1.5 text-xs text-chart-warning-text">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Sender address differs from the on-file contact (or none on file). Choose where to send —
          we won&apos;t send PHI to an unverified address automatically.
        </p>
      )}
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reply-dest"
              checked={chosenAddress === o.value}
              onChange={() => setChosenAddress(o.value)}
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
      </div>
      <button
        onClick={onSend}
        disabled={busy || !chosenAddress}
        className="min-h-[40px] rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
      >
        <Send className="h-3.5 w-3.5" /> Send reply
      </button>
    </div>
  )
}
