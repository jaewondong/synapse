'use client'

// Synapse §2.9 — inbound message detail. Composes the email + triage + scheduling
// proposal. Owns the record + the optimistic action runner (rollback toasts on
// commit/send, §1.7). "Invoke Scheduling Agent" appears only after scheduling
// intent is operator-confirmed (§5).
import { useCallback, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { joinDot, safeFormatDate } from '@/lib/utils'
import { TriagePanel } from './TriagePanel'
import { SchedulingProposalPanel } from './SchedulingProposalPanel'
import { fetchReplyDestination, inboundAction } from './inbound-api'
import type { InboundEmailRecord } from '@/lib/inbound/InboundEmail'

export function InboxMessageDetail({
  record: initial,
  onUpdated,
  onClose,
}: {
  record: InboundEmailRecord
  onUpdated: (record: InboundEmailRecord) => void
  onClose: () => void
}) {
  const [record, setRecord] = useState(initial)
  const [busy, setBusy] = useState(false)

  const apply = useCallback(
    (next: InboundEmailRecord) => {
      setRecord(next)
      onUpdated(next)
    },
    [onUpdated],
  )

  const run = useCallback(
    async (body: Record<string, unknown> & { action: string }, optimistic?: InboundEmailRecord) => {
      const prev = record
      if (optimistic) apply(optimistic)
      setBusy(true)
      try {
        const { record: next } = await inboundAction(record.id, body)
        apply(next)
        return next
      } catch (err) {
        if (optimistic) apply(prev) // rollback
        toast.error(err instanceof Error ? err.message : 'Action failed')
        return null
      } finally {
        setBusy(false)
      }
    },
    [record, apply],
  )

  const triage = record.triage
  const schedulingConfirmed = triage?.intent === 'scheduling' && triage.provenance === 'human'
  const canInvoke = schedulingConfirmed && !record.proposal

  const invokeAgent = useCallback(async () => {
    if (!canInvoke || busy) return
    const t = toast.loading('Scheduling Agent reading the email…')
    const next = await run({ action: 'propose' })
    toast.dismiss(t)
    if (next) toast.success('Proposal ready')
  }, [canInvoke, busy, run])

  // Hotkeys: t = confirm triage, s = invoke agent, e = escalate.
  useHotkeys('t', () => {
    if (triage && triage.provenance !== 'human') run({ action: 'triage' })
  }, [triage, run])
  useHotkeys('s', () => invokeAgent(), [invokeAgent])
  useHotkeys('e', () => {
    if (triage?.urgency === 'urgent' && !record.operator.escalationActioned) {
      run({ action: 'escalate' })
    }
  }, [triage, record, run])

  const meta = joinDot([record.fromEmail, `to ${record.toAddress}`, safeFormatDate(record.receivedAt)])

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-border bg-background">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{record.subject || '(no subject)'}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate" title={meta}>
            <span className="font-medium text-foreground/80">{record.fromName ?? record.fromEmail}</span>
            <span className="mx-1.5">·</span>
            {meta}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Identity is operator-confirmed, not authenticated — anyone can email the clinic address.
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted/50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Original email */}
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
            {record.text}
          </pre>
        </div>

        {/* Triage */}
        <TriagePanel
          record={record}
          busy={busy}
          onConfirm={() => run({ action: 'triage' })}
          onEscalate={() => run({ action: 'escalate' })}
        />

        {/* Invoke Scheduling Agent — only after scheduling intent confirmed (§5) */}
        {canInvoke && (
          <button
            onClick={invokeAgent}
            disabled={busy}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-accent bg-agent-tint px-4 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Invoke Scheduling Agent <kbd className="ml-1 text-muted-foreground">s</kbd>
          </button>
        )}

        {/* Scheduling proposal */}
        {record.proposal && (
          <SchedulingProposalPanel
            record={record}
            busy={busy}
            onCommit={(mrn, slotIndex) =>
              run(
                { action: 'commit', mrn, slotIndex },
                { ...record, operator: { ...record.operator, confirmedMrn: mrn }, status: 'in_progress' },
              )
            }
            onSendReply={(toAddress, body) =>
              run(
                { action: 'reply', toAddress, replyBody: body },
                { ...record, operator: { ...record.operator, replySent: true }, status: 'resolved' },
              )
            }
            onLoadDestination={() => fetchReplyDestination(record.id)}
          />
        )}

        {/* Non-scheduling routing note (§5) */}
        {triage && triage.provenance === 'human' && triage.intent !== 'scheduling' && (
          <p className="text-sm text-muted-foreground">
            Not a scheduling request — routed to the appropriate queue. The Scheduling Agent is not
            offered for this message.
          </p>
        )}
      </div>
    </div>
  )
}
