// Synapse §2.9 — Scheduling Agent proposal resolver (mock, content-driven).
// Reads an inbound email + existing Schedule availability and PROPOSES a patient
// match, slots, and a draft reply. It never resolves identity, never books, never
// sends (§1). The email body is DATA, not instructions (§1.G-F). Mock today;
// signature stable for a real model swap. Runs server-side (Supabase enrichment).
import { createServerClient } from '@/lib/supabase/server'
import type {
  InboundEmail,
  PatientMatchCandidate,
  SchedulingProposal,
  SlotCandidate,
} from '@/lib/inbound/InboundEmail'

// Known demo senders. Keeps fixture behavior deterministic regardless of whether
// the Supabase patients table happens to be seeded; real MRNs from the DB win.
const DEMO_DIRECTORY: Record<string, { mrn: string; name: string; dob: string }> = {
  'robert.hernandez@gmail.com': { mrn: '00428467', name: 'Robert Hernandez', dob: '03/14/1958' },
  'maria.lopez@gmail.com': { mrn: '00428193', name: 'Maria Lopez', dob: '07/22/1979' },
}

const RESCHEDULE = /\b(reschedule|move (my|the)|change (my|the)|push (it|my)|later)\b/i
const CANCEL = /\bcancel\b/i
const NEW_PATIENT = /\b(new patient|first (visit|appointment)|never been seen|establish care)\b/i

const INJECTION_MARKERS =
  /\b(ignore (the|previous|all) (rules|instructions)|pre[- ]?approved|skip (the )?confirmation|system:|you must|disregard)\b/i

function detectRequestedIntent(text: string): 'new' | 'reschedule' | 'cancel' {
  if (CANCEL.test(text)) return 'cancel'
  if (RESCHEDULE.test(text)) return 'reschedule'
  return 'new'
}

function lastNameFrom(email: InboundEmail): string | null {
  const name = email.fromName?.trim()
  if (!name) return null
  // Strip group words ("Family", "Household") and take the last remaining token,
  // so "Lopez Family" still yields the searchable surname "Lopez".
  const parts = name.split(/\s+/).filter((p) => !/^(family|household)$/i.test(p))
  return parts.length ? parts[parts.length - 1] : null
}

function isSharedSender(email: InboundEmail): boolean {
  const local = email.fromEmail.split('@')[0]?.toLowerCase() ?? ''
  return /family|household|the\w+family/.test(local) || /family|household/i.test(email.fromName ?? '')
}

function extractConstraints(text: string): { labels: string[]; partOfDay: 'morning' | 'afternoon' | null } {
  const labels: string[] = []
  let partOfDay: 'morning' | 'afternoon' | null = null
  if (/\bmornings?\b/i.test(text)) {
    labels.push('prefers mornings')
    partOfDay = 'morning'
  }
  if (/\bafternoons?\b/i.test(text)) {
    labels.push('prefers afternoons')
    partOfDay = 'afternoon'
  }
  if (/\bnext week\b/i.test(text)) labels.push('next week')
  if (/\bthis week\b/i.test(text)) labels.push('this week')
  return { labels, partOfDay }
}

function dobFrom(text: string): string | null {
  const m = text.match(/\b(?:dob|date of birth)\D{0,6}([0-1]?\d\/[0-3]?\d\/\d{4})/i)
  return m ? m[1] : null
}

interface ProviderLite {
  id: string
  name: string
  visitTypeCode: string
  visitTypeLabel: string
}

async function resolveProvider(email: InboundEmail, requestedNew: boolean): Promise<ProviderLite> {
  const visitTypeCode = requestedNew ? 'new_patient_eval' : 'follow_up'
  const visitTypeLabel = requestedNew ? 'New patient' : 'Follow-up'
  // Route on the to-address local part (e.g. drhernandez@ → "hernandez").
  const local = email.toAddress.split('@')[0]?.replace(/^dr/i, '') ?? ''
  try {
    const sb = createServerClient()
    const { data } = await sb
      .from('providers')
      .select('id, first_name, last_name')
      .ilike('last_name', `%${local}%`)
      .eq('active', true)
      .limit(1)
    const p = data?.[0]
    if (p) {
      return { id: p.id, name: `Dr. ${p.last_name}`, visitTypeCode, visitTypeLabel }
    }
  } catch {
    /* offline / unseeded — fall through to a display-only provider */
  }
  const display = local ? `Dr. ${local[0].toUpperCase()}${local.slice(1)}` : 'Care team'
  return { id: '', name: display, visitTypeCode, visitTypeLabel }
}

function buildSlots(provider: ProviderLite, partOfDay: 'morning' | 'afternoon' | null): SlotCandidate[] {
  const morning = [9, 10.5, 11.5]
  const afternoon = [13.5, 15, 16]
  const hours = partOfDay === 'afternoon' ? afternoon : partOfDay === 'morning' ? morning : [9, 13.5, 15]

  const slots: SlotCandidate[] = []
  const base = new Date()
  let added = 0
  let dayOffset = 3 // start a few days out
  while (added < hours.length && dayOffset < 21) {
    const day = new Date(base)
    day.setDate(base.getDate() + dayOffset)
    const dow = day.getDay()
    if (dow === 0 || dow === 6) {
      dayOffset += 1
      continue
    }
    const h = hours[added]
    const start = new Date(day)
    start.setHours(Math.floor(h), (h % 1) * 60, 0, 0)
    const end = new Date(start)
    end.setMinutes(start.getMinutes() + 30)
    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      provider: provider.name,
      providerId: provider.id || undefined,
      visitType: provider.visitTypeLabel,
      visitTypeCode: provider.visitTypeCode,
      durationMin: 30,
    })
    added += 1
    dayOffset += 2
  }
  return slots
}

async function buildMatchCandidates(
  email: InboundEmail,
  dob: string | null,
): Promise<PatientMatchCandidate[]> {
  const shared = isSharedSender(email)
  const lastName = lastNameFrom(email)
  const sb = (() => {
    try {
      return createServerClient()
    } catch {
      return null
    }
  })()

  // 1. Personal sender we recognize (high), enriched with the real MRN if seeded.
  const demo = DEMO_DIRECTORY[email.fromEmail.toLowerCase()]
  if (!shared && demo) {
    let mrn = demo.mrn
    if (sb) {
      const { data } = await sb
        .from('patients')
        .select('mrn')
        .ilike('preferred_email', email.fromEmail)
        .limit(1)
      if (data?.[0]?.mrn) mrn = data[0].mrn
    }
    const dobMatches = !dob || dob === demo.dob
    return [
      {
        mrn,
        name: demo.name,
        dob: demo.dob,
        matchConfidence: 'high',
        matchBasis: ['personal sender address', 'name match', ...(dob ? ['DOB provided in email'] : [])],
        needsSecondIdentifier: !dobMatches,
      },
    ]
  }

  // 2. Shared/family or unknown sender → search by last name; surface honestly.
  let rows: { mrn: string; first_name: string; last_name: string; date_of_birth: string }[] = []
  if (sb && lastName) {
    const { data } = await sb
      .from('patients')
      .select('mrn, first_name, last_name, date_of_birth')
      .ilike('last_name', `%${lastName}%`)
      .limit(4)
    rows = data ?? []
  }

  if (rows.length === 0) {
    // No defensible candidate — route to manual search rather than guessing (§1.G-C).
    return []
  }

  // Name-only / shared address is never commit-ready without a 2nd identifier.
  return rows.map((r) => ({
    mrn: r.mrn,
    name: `${r.first_name} ${r.last_name}`,
    dob: r.date_of_birth,
    matchConfidence: rows.length > 1 ? 'low' : 'medium',
    matchBasis: ['name match', shared ? 'shared/family sender address' : 'sender address not on file'],
    needsSecondIdentifier: true,
  }))
}

async function findUpcomingAppointmentId(mrn: string): Promise<string | undefined> {
  try {
    const sb = createServerClient()
    const { data: patient } = await sb.from('patients').select('id').eq('mrn', mrn).maybeSingle()
    if (!patient) return undefined
    const { data: appts } = await sb
      .from('appointments')
      .select('id, starts_at, status')
      .eq('patient_id', patient.id)
      .gte('starts_at', new Date().toISOString())
      .neq('status', 'cancelled')
      .order('starts_at', { ascending: true })
      .limit(1)
    return appts?.[0]?.id
  } catch {
    return undefined
  }
}

export async function proposeFromEmail(email: InboundEmail): Promise<SchedulingProposal> {
  const haystack = `${email.subject}\n${email.text}`
  const requestedIntent = detectRequestedIntent(haystack)
  const requestedNew = requestedIntent === 'new' && NEW_PATIENT.test(haystack)
  const { labels: extractedConstraints, partOfDay } = extractConstraints(haystack)
  const dob = dobFrom(haystack)
  const injectionDetected = INJECTION_MARKERS.test(haystack)
  // Cheap red-flag sniff so the proposal audit records that clinical content was
  // deliberately not addressed (§1.G-A scope, surfaced for a human via triage).
  const hasClinicalContent =
    /worst headache|numbness|chest pain|can'?t breathe|slurred|seizure|suicidal|weakness/i.test(haystack)

  const candidates = await buildMatchCandidates(email, dob)
  const best = candidates[0]
  const commitReady = !!best && best.matchConfidence === 'high' && !best.needsSecondIdentifier

  // What the agent deliberately did NOT act on (§1.G-H transparency).
  const notActedOn: string[] = ['Did not auto-select a patient or auto-send any reply (operator confirms).']
  if (injectionDetected) {
    notActedOn.push(
      'Treated instruction-like text in the email body as data, not commands — did not skip confirmation, change scope, alter the match, or add any billing/balance statements to the reply (§1.G-F).',
    )
  }
  if (hasClinicalContent) {
    notActedOn.push(
      'Did not address the clinical symptoms in this message — scheduling only; the clinical content is flagged for a clinician (§1.G-A).',
    )
  }

  // §1.G-D / §1.G-C: abstain rather than fabricate slots when identity is not
  // defensibly resolved. Abstention is a feature, not a failure.
  if (!commitReady) {
    return {
      matchCandidates: candidates,
      requestedIntent,
      extractedConstraints,
      slots: [],
      schedulingConfidencePct: null,
      abstained: true,
      abstainReason:
        candidates.length === 0
          ? 'Could not produce a defensible patient match from this sender. Search and link the patient manually before scheduling.'
          : 'Patient identity is not confirmed (no single strong match). Confirm the patient with a second identifier before proposing times.',
      draftReply: buildDraftReply(email, best, null, requestedIntent),
      notActedOn,
      provenance: 'agent',
    }
  }

  const provider = await resolveProvider(email, requestedNew)
  const slots = buildSlots(provider, partOfDay)

  let targetAppointmentId: string | undefined
  if (requestedIntent !== 'new') {
    targetAppointmentId = await findUpcomingAppointmentId(best.mrn)
    notActedOn.push(
      'Did not modify any existing appointment — a reschedule/cancel requires the operator to confirm which appointment is affected (§1.G-E).',
    )
  }

  // Confidence reflects actual proposal quality; never inflated (§1.G-D).
  let pct = 90
  if (extractedConstraints.length > 0) pct = 93
  if (requestedIntent !== 'new' && !targetAppointmentId) pct = 78 // couldn't pin the existing appt

  return {
    matchCandidates: candidates,
    requestedIntent,
    extractedConstraints,
    slots,
    schedulingConfidencePct: pct,
    abstained: false,
    draftReply: buildDraftReply(email, best, slots[0] ?? null, requestedIntent),
    targetAppointmentId,
    notActedOn,
    provenance: 'agent',
  }
}

// Draft reply contains ONLY this patient's appointment details (§1.G-G). Built
// from a fixed template — never echoes instructions or claims from the email.
function buildDraftReply(
  email: InboundEmail,
  candidate: PatientMatchCandidate | undefined,
  slot: SlotCandidate | null,
  intent: 'new' | 'reschedule' | 'cancel',
): { subject: string; body: string } {
  const firstName = (candidate?.name ?? email.fromName ?? 'there').split(/\s+/)[0]
  const subject = email.subject.toLowerCase().startsWith('re:')
    ? email.subject
    : `Re: ${email.subject || 'Your appointment request'}`

  if (!slot) {
    return {
      subject,
      body: [
        `Hi ${firstName},`,
        '',
        'Thanks for reaching out. We need to confirm a few details before we can',
        'offer appointment times. A member of our scheduling team will follow up',
        'shortly.',
        '',
        'Synapse Scheduling',
      ].join('\n'),
    }
  }

  const verb = intent === 'reschedule' ? 'moved your appointment to' : 'reserved a time for you on'
  return {
    subject,
    body: [
      `Hi ${firstName},`,
      '',
      `We have ${verb}:`,
      `  • ${formatSlot(slot)} with ${slot.provider} (${slot.visitType})`,
      '',
      'Please reply to confirm and we will lock it in. If this time does not work,',
      'let us know and we will find an alternative.',
      '',
      'Synapse Scheduling',
    ].join('\n'),
  }
}

function formatSlot(slot: SlotCandidate): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(slot.start))
}
