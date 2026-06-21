// Synapse §2.9 — per-message operator actions. Every step here is human-initiated
// (the agent only proposes). Dispatch on `action` in the POST body:
//   triage   → confirm/override the triage assessment (⊕ → ⊘), status 'triaged'
//   propose  → run the Scheduling Agent (proposeFromEmail); store the proposal
//   escalate → record that the urgent escalation was actioned (§1.G-B)
//   commit   → confirmed match + slot → commitAppointment; status 'in_progress'
//   reply-destination → compute on-file/inbound destinations + mismatch (§1.G-G)
//   reply    → send the confirmation; status 'resolved' (gated on escalation)
import { NextResponse, type NextRequest } from 'next/server'
import { getInbound, updateInbound } from '@/lib/inbound/store'
import { proposeFromEmail } from '@/lib/scheduling/proposeFromEmail'
import { commitAppointment } from '@/lib/scheduling/commitAppointment'
import {
  resolveReplyDestination,
  sendConfirmationReply,
} from '@/lib/scheduling/sendConfirmationReply'
import type { InboundEmail, TriageAssessment } from '@/lib/inbound/InboundEmail'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const record = await getInbound(id)
  if (!record) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ record })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const record = await getInbound(id)
  if (!record) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try {
    const text = await req.text()
    body = text ? JSON.parse(text) : {}
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const action = String(body.action ?? '')

  try {
    switch (action) {
      // ---- Triage confirm / override (operator owns; ⊕ → ⊘) ----------------
      case 'triage': {
        const override = body.triage as Partial<TriageAssessment> | undefined
        const triage: TriageAssessment = {
          ...record.triage!,
          ...override,
          provenance: 'human',
        }
        const updated = await updateInbound(id, { triage, status: 'triaged' })
        return NextResponse.json({ record: updated })
      }

      // ---- Invoke the Scheduling Agent (proposal only; no booking) ----------
      case 'propose': {
        const email = toInboundEmail(record)
        const proposal = await proposeFromEmail(email)
        const updated = await updateInbound(id, { proposal })
        return NextResponse.json({ record: updated })
      }

      // ---- Operator actioned the urgent escalation (§1.G-B) -----------------
      case 'escalate': {
        const updated = await updateInbound(id, { escalation_actioned: true })
        return NextResponse.json({ record: updated })
      }

      // ---- Commit: confirmed match + selected slot → existing Schedule ------
      case 'commit': {
        const proposal = record.proposal
        if (!proposal) return NextResponse.json({ error: 'no proposal' }, { status: 400 })

        const mrn = String(body.mrn ?? '')
        const slotIndex = Number(body.slotIndex ?? -1)
        const candidate = proposal.matchCandidates.find((c) => c.mrn === mrn)
        const slot = proposal.slots[slotIndex]
        if (!candidate) return NextResponse.json({ error: 'confirm a patient match' }, { status: 400 })
        if (candidate.needsSecondIdentifier) {
          return NextResponse.json(
            { error: 'this match needs a second identifier before commit (§1.G-C)' },
            { status: 400 },
          )
        }
        if (proposal.requestedIntent === 'new' && !slot) {
          return NextResponse.json({ error: 'select a slot' }, { status: 400 })
        }
        if (proposal.requestedIntent !== 'new' && !proposal.targetAppointmentId) {
          return NextResponse.json(
            { error: 'confirm which existing appointment is affected (§1.G-E)' },
            { status: 400 },
          )
        }

        const result = await commitAppointment({
          mrn,
          slot: slot ?? proposal.slots[0],
          sourceEmailId: id,
          mode: proposal.requestedIntent,
          targetAppointmentId: proposal.targetAppointmentId,
          agentConfidencePct: proposal.schedulingConfidencePct,
        })

        const updated = await updateInbound(id, {
          confirmed_mrn: mrn,
          committed_appointment_id: result.appointmentId,
          proposal: { ...proposal, provenance: 'human' },
          status: 'in_progress',
        })
        return NextResponse.json({ record: updated, ...result })
      }

      // ---- Reply destination (on-file vs inbound mismatch, §1.G-G) ----------
      case 'reply-destination': {
        if (!record.operator.committedAppointmentId) {
          return NextResponse.json({ error: 'commit first' }, { status: 400 })
        }
        const dest = await resolveReplyDestination(
          record.operator.committedAppointmentId,
          record.fromEmail,
        )
        return NextResponse.json({ destination: dest })
      }

      // ---- Send the confirmation reply; resolve the message -----------------
      case 'reply': {
        if (!record.operator.committedAppointmentId) {
          return NextResponse.json({ error: 'commit first' }, { status: 400 })
        }
        // §1.G-B urgency gate: an urgent message can't be resolved by scheduling
        // alone — the escalation must have been actioned.
        if (record.triage?.urgency === 'urgent' && !record.operator.escalationActioned) {
          return NextResponse.json(
            { error: 'flag the urgent symptom to a clinician before resolving (§1.G-B)' },
            { status: 400 },
          )
        }

        const toAddress = String(body.toAddress ?? '')
        const replyBody = String(body.replyBody ?? '')
        if (!toAddress) return NextResponse.json({ error: 'choose a destination' }, { status: 400 })

        const result = await sendConfirmationReply({
          appointmentId: record.operator.committedAppointmentId,
          toAddress,
          replyBody,
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

        const updated = await updateInbound(id, { reply_sent: true, status: 'resolved' })
        return NextResponse.json({ record: updated, messageId: result.messageId })
      }

      default:
        return NextResponse.json({ error: `unknown action "${action}"` }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'action failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function toInboundEmail(record: Awaited<ReturnType<typeof getInbound>>): InboundEmail {
  const r = record!
  return {
    id: r.id,
    providerMessageId: r.providerMessageId,
    fromEmail: r.fromEmail,
    fromName: r.fromName,
    toAddress: r.toAddress,
    subject: r.subject,
    text: r.text,
    html: r.html,
    receivedAt: r.receivedAt,
    attachments: r.attachments,
    status: r.status,
  }
}
