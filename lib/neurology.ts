// Neurology Specialty View (§2.8) — types + mock resolvers.
//
// This surface is a STABLE SPINE (every neuro patient) plus a REGISTRY of
// condition modules swapped in by active diagnosis — structurally identical to
// the §2.7 Explainability Drawer's shell + panel registry. Keep these resolver
// signatures stable so the real backend swap is a data-layer change only (§12).

import type { ConfidenceTier } from '@/lib/explainability'

export type { ConfidenceTier }

// Open union: v1 ships epilepsy / ms / undifferentiated; unknown keys (e.g. a v2
// 'movement_disorders' problem) flow to the FallbackModule, never a crash (§9).
export type ConditionKey = 'epilepsy' | 'ms' | 'undifferentiated' | (string & {})

export type Provenance = 'agent' | 'human'

// ---- Problem list -----------------------------------------------------------

export interface NeuroProblem {
  id: string
  label: string
  icd10: string
  department: 'Neurology' // B6: only neuro-tagged problems render here
  conditionKey?: ConditionKey // links problem → module; absent = unmapped → fallback
  onsetDate?: string
  status: 'active' | 'resolved' | 'workup'
}

// ---- Structured exam --------------------------------------------------------

export type ExamDomainKey =
  | 'mental_status'
  | 'cranial_nerves'
  | 'motor'
  | 'sensory'
  | 'coordination'
  | 'reflexes'
  | 'gait'

export type ReviewState = 'pending' | 'accepted' | 'edited' | 'rejected'

export interface ExamFinding {
  id: string
  text: string // discrete finding, NOT a paragraph
  provenance: Provenance // ⊕ until reviewed → ⊘
  confidence?: ConfidenceTier // dot; only on agent-drafted, un-reviewed findings
  reviewState: ReviewState
  auditId?: string // opens drawer (agent_action payload)
  // Source context surfaced inside the drawer (what the agent read / why).
  sourceLabel?: string
  rationale?: string
}

export interface ExamDomain {
  key: ExamDomainKey
  label: string
  findings: ExamFinding[]
  normal: boolean // domain marked WNL
}

// ---- Scales (with licensing gate, §5) --------------------------------------

export type ScaleLicensing = 'compute' | 'record_only' | 'link_out'

export type ScaleKey =
  | 'edss'
  | 'msfc'
  | 'gad7'
  | 'nddie'
  | 'seizure_frequency'
  // v2 / verify-before-embedding — never compute without authorization (§5)
  | 'mds_updrs'
  | 'moca'
  | 'ess'
  | 'qolie10'
  | 'hit6'
  | 'midas'

export interface ScaleFactor {
  // compute-licensed scales only
  criterion: string
  points: number
  met: boolean
  evidenceLabel?: string
  evidenceHref?: string
  confidence?: ConfidenceTier
}

export interface NeuroScale {
  key: ScaleKey
  name: string
  licensing: ScaleLicensing
  totalPoints?: number // numerals OK — clinical value, not confidence (§1.5 carve-out)
  maxPoints?: number
  factors?: ScaleFactor[] // present when 'compute'
  recordedValue?: string // present when 'record_only' (entered, not computed)
  externalHref?: string // present when 'link_out'
  capturedAt?: string
  provenance: Provenance
  auditId?: string // 'compute' scales open drawer as risk_score
  interpretation?: string // shown inside the drawer
}

// ---- Longitudinal trackers --------------------------------------------------

export interface TrendPoint {
  date: string
  value: number
  label?: string
}

export interface SeizureEntry {
  date: string
  type: string
  count: number
  source: 'clinic' | 'patient_diary' // patient-generated data is first-class (§6.1)
}

export interface RelapseEntry {
  date: string
  description: string
  edssAtVisit?: number
}

// Therapy timeline entry — reused for DMT (MS) and AED (epilepsy) histories.
export interface TherapyEntry {
  id: string
  name: string
  startDate: string
  endDate?: string
  status: 'active' | 'discontinued'
  note?: string
}

// ---- Medications + exception flags (reuse §2.4 pattern) --------------------

export interface NeuroMedication {
  id: string
  name: string
  dose: string
  frequency: string
  drugClass?: string // e.g. "AED", "DMT"
  startDate?: string
  active: boolean
}

export interface NeuroExceptionFlag {
  id: string
  title: string
  detail: string
  severity: 'warning' | 'info'
  agentName: string
  confidence: ConfidenceTier
  computedAt: string
  whyRationale: string
  whyInputs: string[]
}

// ---- Studies ----------------------------------------------------------------

export interface NeuroStudy {
  id: string
  modality: 'MRI' | 'CT' | 'EEG' | 'EMG'
  region?: string
  date: string
  impression: string
  provenance: Provenance // agent-extracted impression until clinician confirms
  confidence?: ConfidenceTier
  confirmed: boolean
  auditId?: string
}

// ---- Module-specific payloads ----------------------------------------------

export interface MsData {
  edss: NeuroScale // compute, 8 functional-system subscores as factors
  msfc?: NeuroScale // compute
  edssTrend: TrendPoint[]
  relapses: RelapseEntry[]
  dmtTimeline: TherapyEntry[]
}

export interface EpilepsyData {
  scales: NeuroScale[] // gad7, nddie (compute)
  seizures: SeizureEntry[]
  aedTimeline: TherapyEntry[]
}

export interface DifferentialItem {
  id: string
  label: string
  icd10?: string
  rationale: string
  confidence: ConfidenceTier
  auditId?: string
}

export interface UndifferentiatedData {
  presentingSymptoms: string[]
  differential: DifferentialItem[] // agent SUGGESTION, not diagnosis (§6.3)
  pendingWorkup: string[]
}

// ---- Module contract (data descriptor; component lives in conditionRegistry) ----

export interface ConditionModule {
  key: ConditionKey
  label: string
  scaleKeys: ScaleKey[]
  trend?: { title: string; points: TrendPoint[]; unit?: string }
  exceptionFlagIds: string[] // reuse §2.4 exception-flag component
}

export interface NeuroChart {
  mrn: string
  patientName: string
  problems: NeuroProblem[]
  exam: ExamDomain[]
  studies: NeuroStudy[]
  medications: NeuroMedication[]
  exceptionFlags: NeuroExceptionFlag[]
  // Free-standing scales not owned by a rendered module (e.g. record_only /
  // link_out instruments surfaced by the FallbackModule).
  scales: NeuroScale[]
  ms?: MsData
  epilepsy?: EpilepsyData
  undifferentiated?: UndifferentiatedData
}

// ---- Resolvers (mock now, signature-stable for real backend later) ----------

// Empty spine for any patient with no seeded neuro data — never broken widgets,
// always a clean empty state (§7).
function emptyChart(mrn: string, patientName: string): NeuroChart {
  return {
    mrn,
    patientName,
    problems: [],
    exam: emptyExamSpine(),
    studies: [],
    medications: [],
    exceptionFlags: [],
    scales: [],
  }
}

// The seven exam domains always render, even with no findings (WNL-ready spine).
export function emptyExamSpine(): ExamDomain[] {
  const domains: Array<[ExamDomainKey, string]> = [
    ['mental_status', 'Mental Status'],
    ['cranial_nerves', 'Cranial Nerves'],
    ['motor', 'Motor'],
    ['sensory', 'Sensory'],
    ['coordination', 'Coordination'],
    ['reflexes', 'Reflexes'],
    ['gait', 'Gait'],
  ]
  return domains.map(([key, label]) => ({ key, label, findings: [], normal: false }))
}

export async function resolveNeuroChart(mrn: string, patientName = `MRN ${mrn}`): Promise<NeuroChart> {
  const { NEURO_FIXTURES } = await import('@/lib/mocks/neurology.fixtures')
  // Mimic a network round-trip so skeletons (never spinners, §1.6) are exercised.
  await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 200))
  const fixture = NEURO_FIXTURES[mrn]
  if (!fixture) return emptyChart(mrn, patientName)
  // Prefer the live patient name from the route over the fixture's seeded copy.
  return { ...fixture, patientName: patientName || fixture.patientName }
}
