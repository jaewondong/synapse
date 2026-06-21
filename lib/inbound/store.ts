// Synapse §2.9 — server-only persistence for inbound emails (the inbound_emails
// table). Maps the canonical InboundEmail + agent layers ↔ DB rows. Service-role
// client only; never import from a client component.
import { createServerClient } from '@/lib/supabase/server'
import type {
  InboundAttachment,
  InboundEmail,
  InboundEmailRecord,
  InboundStatus,
  SchedulingProposal,
  TriageAssessment,
} from './InboundEmail'

interface InboundEmailRow {
  id: string
  provider_message_id: string | null
  from_email: string
  from_name: string | null
  to_address: string
  subject: string
  body_text: string
  body_html: string | null
  received_at: string
  attachments: InboundAttachment[] | null
  status: InboundStatus
  triage: TriageAssessment | null
  proposal: SchedulingProposal | null
  escalation_actioned: boolean
  confirmed_mrn: string | null
  committed_appointment_id: string | null
  reply_sent: boolean
  created_at: string
  updated_at: string
}

function rowToRecord(row: InboundEmailRow): InboundEmailRecord {
  return {
    id: row.id,
    providerMessageId: row.provider_message_id ?? undefined,
    fromEmail: row.from_email,
    fromName: row.from_name ?? undefined,
    toAddress: row.to_address,
    subject: row.subject,
    text: row.body_text,
    html: row.body_html ?? undefined,
    receivedAt: row.received_at,
    attachments: row.attachments ?? undefined,
    status: row.status,
    triage: row.triage,
    proposal: row.proposal,
    operator: {
      escalationActioned: row.escalation_actioned,
      confirmedMrn: row.confirmed_mrn,
      committedAppointmentId: row.committed_appointment_id,
      replySent: row.reply_sent,
    },
  }
}

/**
 * Persist a freshly-ingested email. Idempotent on providerMessageId — a
 * duplicate webhook delivery returns the existing row instead of inserting (§4.1).
 */
export async function persistInbound(email: InboundEmail): Promise<InboundEmailRecord> {
  const sb = createServerClient()

  if (email.providerMessageId) {
    const { data: existing } = await sb
      .from('inbound_emails')
      .select('*')
      .eq('provider_message_id', email.providerMessageId)
      .maybeSingle()
    if (existing) return rowToRecord(existing as InboundEmailRow)
  }

  const { data, error } = await sb
    .from('inbound_emails')
    .insert({
      provider_message_id: email.providerMessageId ?? null,
      from_email: email.fromEmail,
      from_name: email.fromName ?? null,
      to_address: email.toAddress,
      subject: email.subject,
      body_text: email.text,
      body_html: email.html ?? null,
      received_at: email.receivedAt,
      attachments: email.attachments ?? [],
      status: 'new',
    })
    .select('*')
    .single()

  if (error) throw new Error(`persistInbound failed: ${error.message}`)
  return rowToRecord(data as InboundEmailRow)
}

export async function getInbound(id: string): Promise<InboundEmailRecord | null> {
  const sb = createServerClient()
  const { data, error } = await sb.from('inbound_emails').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`getInbound failed: ${error.message}`)
  return data ? rowToRecord(data as InboundEmailRow) : null
}

export async function listInbound(): Promise<InboundEmailRecord[]> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('inbound_emails')
    .select('*')
    .order('received_at', { ascending: false })
  if (error) throw new Error(`listInbound failed: ${error.message}`)
  return (data as InboundEmailRow[]).map(rowToRecord)
}

type InboundPatch = Partial<{
  status: InboundStatus
  triage: TriageAssessment | null
  proposal: SchedulingProposal | null
  escalation_actioned: boolean
  confirmed_mrn: string | null
  committed_appointment_id: string | null
  reply_sent: boolean
}>

export async function updateInbound(
  id: string,
  patch: InboundPatch,
): Promise<InboundEmailRecord> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('inbound_emails')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateInbound failed: ${error.message}`)
  return rowToRecord(data as InboundEmailRow)
}
