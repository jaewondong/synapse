// Synapse §2.9 — outbound confirmation reply (§8). Reuses the existing Resend +
// React Email path (sendNotification). A distinct, explicit action — never
// auto-sent on commit. Privacy (§1.G-G): the confirmation goes only to the
// operator-confirmed destination; if the inbound sender differs from the on-file
// contact, the mismatch is surfaced and the operator chooses — no PHI is sent to
// an unverified/mismatched address by default.
import { createServerClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/email/send'
import type { AppointmentRow, PatientLite, ProviderLite } from '@/lib/email/types'

interface AppointmentJoin extends AppointmentRow {
  patients: { id: string; mrn: string; first_name: string; last_name: string; preferred_email: string | null } | null
  providers: { id: string; first_name: string; last_name: string; email: string | null; specialty: string | null } | null
}

export interface ReplyDestination {
  onFileEmail: string | null
  inboundEmail: string
  mismatch: boolean
}

/** Compute the candidate destinations + whether the operator must choose (§1.G-G). */
export async function resolveReplyDestination(
  appointmentId: string,
  inboundEmail: string,
): Promise<ReplyDestination> {
  const sb = createServerClient()
  const { data } = await sb
    .from('appointments')
    .select('patients(preferred_email)')
    .eq('id', appointmentId)
    .maybeSingle()
  const onFile = (data as { patients?: { preferred_email: string | null } | null } | null)?.patients
    ?.preferred_email ?? null
  const mismatch = !!onFile && onFile.toLowerCase() !== inboundEmail.toLowerCase()
  return { onFileEmail: onFile, inboundEmail, mismatch: mismatch || !onFile }
}

export interface SendConfirmationInput {
  appointmentId: string
  /** Operator-chosen destination (on-file or the confirmed inbound address). */
  toAddress: string
  /** Operator-reviewed (possibly edited) reply body. */
  replyBody: string
}

export async function sendConfirmationReply(
  input: SendConfirmationInput,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('appointments')
    .select(
      'id, patient_id, provider_id, scheduled_ma_id, starts_at, ends_at, visit_type, status, room, notes, created_by_agent, agent_reasoning, agent_confidence, reschedule_reason, cancellation_reason, previous_starts_at, previous_ends_at, created_at, updated_at, patients(id, mrn, first_name, last_name, preferred_email), providers(id, first_name, last_name, email, specialty)',
    )
    .eq('id', input.appointmentId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  const appt = data as AppointmentJoin | null
  if (!appt || !appt.patients || !appt.providers) {
    return { ok: false, error: 'appointment, patient, or provider not found' }
  }

  const patient: PatientLite = {
    id: appt.patients.id,
    mrn: appt.patients.mrn,
    first_name: appt.patients.first_name,
    last_name: appt.patients.last_name,
  }
  const provider: ProviderLite = {
    id: appt.providers.id,
    first_name: appt.providers.first_name,
    last_name: appt.providers.last_name,
    email: appt.providers.email ?? '',
    specialty: appt.providers.specialty,
  }

  // Strip joins back to a clean AppointmentRow for the email context.
  const appointment = { ...appt } as Partial<AppointmentJoin>
  delete appointment.patients
  delete appointment.providers

  return sendNotification({
    kind: 'appointment_confirmation',
    appointment: appointment as AppointmentRow,
    patient,
    provider,
    recipients: [input.toAddress],
    replyBody: input.replyBody,
  })
}
