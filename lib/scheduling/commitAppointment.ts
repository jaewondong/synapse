// Synapse §2.9 — commit a proposed appointment to the EXISTING Schedule.
// Reuses the Supabase `appointments` model (does not fork it). Always
// human-initiated (§1.G-E). Idempotent on sourceEmailId so a double-click or a
// webhook redelivery can't double-book (§1.G-E, §7). Server-side only.
import { createServerClient } from '@/lib/supabase/server'
import type { SlotCandidate } from '@/lib/inbound/InboundEmail'

export interface CommitAppointmentInput {
  mrn: string
  slot: SlotCandidate
  sourceEmailId: string
  // 'new' books a fresh appointment. reschedule/cancel are destructive and carry
  // the operator-confirmed target appointment (§1.G-E).
  mode?: 'new' | 'reschedule' | 'cancel'
  targetAppointmentId?: string
  reason?: string
  agentReasoning?: string
  agentConfidencePct?: number | null
}

export interface CommitAppointmentResult {
  appointmentId: string
  idempotentReplay?: boolean
}

const VISIT_TYPES = new Set([
  'new_patient_eval',
  'follow_up',
  'procedure',
  'infusion',
  'telehealth',
  'other',
])

export async function commitAppointment(
  input: CommitAppointmentInput,
): Promise<CommitAppointmentResult> {
  const sb = createServerClient()
  const mode = input.mode ?? 'new'

  // Idempotency: if this email already produced an appointment, return it.
  {
    const { data: existing } = await sb
      .from('appointments')
      .select('id')
      .eq('source_email_id', input.sourceEmailId)
      .maybeSingle()
    if (existing) return { appointmentId: existing.id, idempotentReplay: true }
  }

  // Destructive paths operate on the operator-confirmed existing appointment.
  if (mode === 'reschedule' || mode === 'cancel') {
    if (!input.targetAppointmentId) {
      throw new Error('reschedule/cancel requires a confirmed target appointment (§1.G-E)')
    }
    if (mode === 'cancel') {
      const { data, error } = await sb
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: input.reason ?? 'Patient request (via inbound email)',
          source_email_id: input.sourceEmailId,
        })
        .eq('id', input.targetAppointmentId)
        .select('id')
        .single()
      if (error) throw new Error(`cancel failed: ${error.message}`)
      return { appointmentId: data.id }
    }
    const { data, error } = await sb
      .from('appointments')
      .update({
        starts_at: input.slot.start,
        ends_at: input.slot.end,
        reschedule_reason: input.reason ?? 'Patient request (via inbound email)',
        source_email_id: input.sourceEmailId,
      })
      .eq('id', input.targetAppointmentId)
      .select('id')
      .single()
    if (error) throw new Error(`reschedule failed: ${error.message}`)
    return { appointmentId: data.id }
  }

  // New booking — resolve patient + provider, then insert.
  const { data: patient, error: pErr } = await sb
    .from('patients')
    .select('id')
    .eq('mrn', input.mrn)
    .maybeSingle()
  if (pErr) throw new Error(`patient lookup failed: ${pErr.message}`)
  if (!patient) throw new Error(`No patient on file for MRN ${input.mrn}`)

  const providerId = await resolveProviderId(sb, input.slot)
  if (!providerId) throw new Error('Could not resolve a provider for this slot')

  const visitType = VISIT_TYPES.has(input.slot.visitTypeCode ?? '')
    ? input.slot.visitTypeCode!
    : 'follow_up'

  const { data, error } = await sb
    .from('appointments')
    .insert({
      patient_id: patient.id,
      provider_id: providerId,
      starts_at: input.slot.start,
      ends_at: input.slot.end,
      visit_type: visitType,
      status: 'scheduled',
      source_email_id: input.sourceEmailId,
      created_by_agent: 'scheduling_agent_v1',
      agent_reasoning: input.agentReasoning ?? 'Booked from operator-confirmed inbound email proposal.',
      agent_confidence:
        typeof input.agentConfidencePct === 'number' ? input.agentConfidencePct / 100 : null,
    })
    .select('id')
    .single()

  // Unique index on source_email_id is the idempotency backstop: a racing
  // double-submit surfaces as a unique violation — fetch and return the winner.
  if (error) {
    const { data: raced } = await sb
      .from('appointments')
      .select('id')
      .eq('source_email_id', input.sourceEmailId)
      .maybeSingle()
    if (raced) return { appointmentId: raced.id, idempotentReplay: true }
    throw new Error(`commit failed: ${error.message}`)
  }

  return { appointmentId: data.id }
}

async function resolveProviderId(
  sb: ReturnType<typeof createServerClient>,
  slot: SlotCandidate,
): Promise<string | null> {
  if (slot.providerId) return slot.providerId
  // Fall back to matching on the display name's last token.
  const last = slot.provider.replace(/^dr\.?\s*/i, '').split(/\s+/).pop() ?? ''
  if (!last) return null
  const { data } = await sb
    .from('providers')
    .select('id')
    .ilike('last_name', `%${last}%`)
    .eq('active', true)
    .limit(1)
  return data?.[0]?.id ?? null
}
