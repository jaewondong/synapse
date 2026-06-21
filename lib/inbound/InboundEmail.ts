// Synapse §2.9 — canonical, provider-agnostic inbound message type plus the
// agent-drafted triage / scheduling-proposal layers that ride on top of it.
//
// Confidence display split (§1.2, §10):
//   - scheduling confidence  → numeric %  (the single §1.5 carve-out)
//   - patient-match + urgency + intent confidence → ConfidenceTier dots, never numbers
//
// Reuses the shared primitives rather than redeclaring them.
import type { ConfidenceTier } from '@/lib/explainability'
import type { Provenance } from '@/lib/neurology'

export type { ConfidenceTier, Provenance }

// ---- Inbound message (canonical) ------------------------------------------
export type InboundStatus = 'new' | 'triaged' | 'in_progress' | 'resolved'

export interface InboundAttachment {
  filename: string
  contentType: string
  sizeBytes: number
}

export interface InboundEmail {
  id: string
  providerMessageId?: string // svix/Resend id — idempotency key
  fromEmail: string
  fromName?: string
  toAddress: string // e.g. drhernandez@synapse.org — route on this
  subject: string
  text: string
  html?: string
  receivedAt: string // ISO
  attachments?: InboundAttachment[]
  status: InboundStatus
}

// ---- Triage (agent-drafted, human owns) -----------------------------------
export type Urgency = 'routine' | 'attention' | 'urgent'
export type EmailIntent = 'scheduling' | 'clinical_question' | 'admin' | 'other'

export interface TriageAssessment {
  intent: EmailIntent
  intentConfidence: ConfidenceTier // DOT
  urgency: Urgency
  urgencyConfidence: ConfidenceTier // DOT
  urgencyReasons: string[] // e.g. ["mentions 'worst headache of my life'"]
  // §1.G-A: scope. Non-scheduling content the agent must NOT act on but must
  // surface for a human (e.g. the clinical question inside a mixed email).
  flaggedForClinician?: string
  provenance: Provenance // ⊕ until operator confirms → ⊘
  auditId?: string // opens drawer (agent_action)
}

// ---- Patient identity (PROPOSED, not resolved) ----------------------------
export interface PatientMatchCandidate {
  mrn: string
  name: string
  dob: string
  matchConfidence: ConfidenceTier // DOT — never a number
  matchBasis: string[] // ["email on file", "name match"]
  // §1.G-C: a name-only / single-weak-signal match is not commit-ready until a
  // second identifier (DOB / on-file contact) is confirmed by the operator.
  needsSecondIdentifier?: boolean
}

// ---- Scheduling proposal ---------------------------------------------------
export interface SlotCandidate {
  start: string // ISO
  end: string // ISO
  provider: string
  providerId?: string // resolved provider uuid, when known (for commit)
  visitType: string // "Follow-up", "New patient", etc.
  visitTypeCode?: string // appointments enum value (follow_up, ...), when known
  durationMin: number
}

export interface DraftReply {
  subject: string
  body: string
}

export interface SchedulingProposal {
  matchCandidates: PatientMatchCandidate[] // operator confirms one
  requestedIntent: 'new' | 'reschedule' | 'cancel'
  extractedConstraints: string[] // ["prefers mornings", "next week"]
  slots: SlotCandidate[] // 2–3 candidates ([] when abstaining)
  // §1.5 EXCEPTION — numeric % allowed. null = the agent abstained (§1.G-D).
  schedulingConfidencePct: number | null
  abstained: boolean
  abstainReason?: string // shown to the operator when abstained
  draftReply: DraftReply
  // §1.G-E: the existing appointment a reschedule/cancel would affect. The
  // operator must confirm THIS before a destructive commit.
  targetAppointmentId?: string
  // §1.G-H: transparency — what the agent deliberately did NOT act on.
  notActedOn: string[]
  provenance: Provenance // ⊕
  auditId?: string // agent_action
}

// ---- Persisted operator-verified state (mirrors inbound_emails columns) ----
export interface InboundOperatorState {
  escalationActioned: boolean // §1.G-B
  confirmedMrn: string | null
  committedAppointmentId: string | null
  replySent: boolean
}

// Full row as surfaced to the UI: the email + its agent layers + operator state.
export interface InboundEmailRecord extends InboundEmail {
  triage: TriageAssessment | null
  proposal: SchedulingProposal | null
  operator: InboundOperatorState
}
