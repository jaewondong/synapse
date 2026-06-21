// Synapse §2.9 — triage resolver (mock, content-driven). Runs on EVERY email
// before any scheduling proposal (§1.G-B). It classifies for ROUTING, never for
// diagnosis (§1.G-B), and treats the body strictly as data: instruction-like
// text in the email cannot change the classification (§1.G-F).
//
// Mock today; signature is stable for a real model swap later.
import type { EmailIntent, InboundEmail, TriageAssessment, Urgency } from './InboundEmail'

// Red-flag SYMPTOM phrases — these drive urgency. Note we deliberately do NOT
// treat the bare word "urgent" as a symptom: an email saying "book me into the
// urgent slot" is an instruction, not a clinical sign (§1.G-F).
const RED_FLAGS: { phrase: RegExp; label: string }[] = [
  { phrase: /worst headache (of my life|ever)/i, label: '"worst headache of my life"' },
  { phrase: /numbness|tingling/i, label: 'numbness / tingling' },
  { phrase: /weakness (in|on)|can'?t move|left arm|right arm|face droop/i, label: 'focal weakness' },
  { phrase: /slurred speech|can'?t speak|trouble speaking/i, label: 'speech difficulty' },
  { phrase: /chest pain|pressure in my chest/i, label: 'chest pain' },
  { phrase: /can'?t breathe|shortness of breath|trouble breathing/i, label: 'breathing difficulty' },
  { phrase: /suicidal|hurt myself|end my life/i, label: 'self-harm ideation' },
  { phrase: /seizure|convulsion/i, label: 'seizure activity' },
  { phrase: /passed out|fainted|loss of consciousness/i, label: 'loss of consciousness' },
]

const SCHEDULING = /\b(schedule|reschedule|appointment|appt|book|move (my|the) appointment|follow[- ]?up|come in|get in|cancel)\b/i
const ADMIN = /\b(bill|billing|statement|charge|invoice|copay|balance|insurance card|referral form|records request|paperwork)\b/i
const CLINICAL_Q = /\b(medication|prescription|refill|side effect|lab result|test result|dosage|should i)\b/i

function detectUrgency(text: string): { urgency: Urgency; reasons: string[] } {
  const reasons = RED_FLAGS.filter((f) => f.phrase.test(text)).map((f) => f.label)
  if (reasons.length > 0) return { urgency: 'urgent', reasons }
  return { urgency: 'routine', reasons: [] }
}

function detectIntent(text: string): { intent: EmailIntent; strong: boolean } {
  // Scheduling wins when present — it is the actionable surface — but urgency is
  // assessed independently above so it is never buried (§5).
  if (SCHEDULING.test(text)) return { intent: 'scheduling', strong: true }
  if (ADMIN.test(text)) return { intent: 'admin', strong: true }
  if (CLINICAL_Q.test(text)) return { intent: 'clinical_question', strong: true }
  return { intent: 'other', strong: false }
}

export async function triageEmail(email: InboundEmail): Promise<TriageAssessment> {
  const haystack = `${email.subject}\n${email.text}`

  const { urgency, reasons } = detectUrgency(haystack)
  const { intent, strong } = detectIntent(haystack)

  // §1.G-A scope: if there is urgent/clinical content the agent will NOT act on,
  // surface it for a human rather than dropping or answering it.
  let flaggedForClinician: string | undefined
  if (urgency === 'urgent') {
    flaggedForClinician = `Possible red-flag symptom(s) for clinician review: ${reasons.join(', ')}.`
  } else if (intent === 'clinical_question') {
    flaggedForClinician = 'Contains a clinical question the scheduling agent will not answer; route to a clinician.'
  }

  return {
    intent,
    intentConfidence: strong ? 'high' : 'low',
    urgency,
    // High confidence only when a concrete phrase matched; routine-by-absence is medium.
    urgencyConfidence: urgency === 'urgent' ? 'high' : 'medium',
    urgencyReasons: reasons,
    flaggedForClinician,
    provenance: 'agent',
  }
}
