// Explainability Drawer — types + resolver (master PRD §2.7, §1.4).
// The drawer is the global answer to "what did the agent do, with what inputs,
// and why should I trust it?" Every Audit Strip terminates here (B10).

export type ExplainabilityKind = 'agent_action' | 'risk_score' | 'extraction'

export type ConfidenceTier = 'high' | 'medium' | 'low'

// Provenance glyphs (§1.6) — single source; never redeclare literals inline.
export const PROVENANCE_GLYPH = { agent: '⌁', human: '✓' } as const

export interface ExplainabilityHeader {
  kind: ExplainabilityKind
  agentName: string // e.g. "Chart Summary Agent"
  agentVersion?: string // e.g. "v0.4.2" — render small, muted, if present
  modifiedByType: 'agent' | 'human'
  timestamp: string // ISO; render via safeFormatDate (B1/B5)
  patientName?: string
  patientMrn?: string
  confidence?: ConfidenceTier // header-level dot; optional
  title: string // e.g. "CHA₂DS₂-VASc Score", "Insurance Extraction — Commit v3"
}

export interface EvidenceItem {
  label: string // e.g. "Echo report 04/12/2026"
  detail?: string // short excerpt or descriptor
  sourceHref?: string // deep link into chart; omit if N/A — never render dead links (B10)
}

// ---- kind: 'agent_action' ----
export interface AgentActionPayload extends ExplainabilityHeader {
  kind: 'agent_action'
  actionSummary: string // one sentence: what the agent did
  reasoning: string[] // ordered bullets: why
  inputs: EvidenceItem[] // what it read
  output: { label: string; preview: string } // what it produced (truncated preview)
  guardrails?: string[] // safety checks that ran, e.g. "Duplicate-order check: passed"
  decisionState?: 'pending' | 'approved' | 'edited' | 'rejected'
}

// ---- kind: 'risk_score' ----
export interface RiskScoreFactor {
  criterion: string // e.g. "Congestive heart failure"
  points: number
  met: boolean
  evidence?: EvidenceItem // why the agent believes this criterion is met
}

export interface RiskScorePayload extends ExplainabilityHeader {
  kind: 'risk_score'
  scoreName: string // "CHA₂DS₂-VASc" | "HAS-BLED" | future
  // Scores are clinical instruments — numerals ARE the score, not confidence;
  // rendering them does not violate the dots rule (§1.5).
  totalPoints: number
  maxPoints: number
  factors: RiskScoreFactor[]
  interpretation: string // e.g. "Annual stroke risk ~6.7%; anticoagulation recommended"
  guidelineRef?: string // e.g. "2023 ACC/AHA/ACCP/HRS AF Guideline"
}

// ---- kind: 'extraction' ----
export interface ExtractedFieldAudit {
  field: string // "Member ID"
  committedValue: string
  previousValue?: string // present if this commit replaced an on-file value
  confidence: ConfidenceTier // per-field dot
  sourceRegion?: string // human-readable locator, e.g. "Card front, lower left"
  resolution?: 'kept_on_file' | 'replaced' | 'new'
}

export interface ExtractionAuditPayload extends ExplainabilityHeader {
  kind: 'extraction'
  documentLabel: string // "Insurance card (front/back) — uploaded 06/02/2026"
  commitVersion: number
  committedBy: string // human verifier — extraction commits are human-verified (locked)
  fields: ExtractedFieldAudit[]
}

export type ExplainabilityPayload =
  | AgentActionPayload
  | RiskScorePayload
  | ExtractionAuditPayload

// Reference form: surfaces that only hold an audit id pass this; drawer resolves it.
export interface ExplainabilityRef {
  auditId: string
}

export function isExplainabilityRef(
  input: ExplainabilityPayload | ExplainabilityRef,
): input is ExplainabilityRef {
  return 'auditId' in input && !('kind' in input)
}

export class ExplainabilityNotFoundError extends Error {
  constructor(public auditId: string) {
    super(`No explainability record for audit id "${auditId}"`)
    this.name = 'ExplainabilityNotFoundError'
  }
}

// Mock resolver. The real implementation later reads the audit log table
// (Prisma) — keep this signature stable so the swap is backend-only.
export async function resolveExplainability(
  ref: ExplainabilityRef,
): Promise<ExplainabilityPayload> {
  const { EXPLAINABILITY_FIXTURES } = await import('@/lib/mock/explainability-fixtures')
  await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300))
  const payload = EXPLAINABILITY_FIXTURES[ref.auditId]
  if (!payload) throw new ExplainabilityNotFoundError(ref.auditId)
  return payload
}

// Convenience builder so call sites that only hold strip-level data (agent
// name, timestamp, a one-liner) can pass a complete agent_action payload
// without repeating defaults.
export function agentActionPayload(
  args: Pick<AgentActionPayload, 'agentName' | 'timestamp' | 'title' | 'actionSummary'> &
    Partial<Omit<AgentActionPayload, 'kind' | 'modifiedByType'>>,
): AgentActionPayload {
  return {
    kind: 'agent_action',
    modifiedByType: 'agent',
    reasoning: [],
    inputs: [],
    output: { label: 'Result', preview: args.actionSummary },
    ...args,
  }
}
