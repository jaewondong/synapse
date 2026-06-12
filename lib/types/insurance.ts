// Insurance Document Agent — extraction contract (master PRD §2.6.4)

export type FieldConfidence = 'high' | 'medium' | 'low'

export type InsuranceDocumentType =
  | 'insurance_card'
  | 'eligibility_letter'
  | 'eob'
  | 'unknown'

export type InsuranceDocumentStatus =
  | 'uploaded'
  | 'scanning'
  | 'pending_review'
  | 'approved'
  | 'rejected'

// Region of the source document a value came from, normalized 0–1 per page.
// Drives the on-focus highlight and the Explainability Drawer's source crop.
export interface SourceRegion {
  page: number // 0-indexed; page 1 = back of a card pair
  x: number
  y: number
  w: number
  h: number
}

export interface ExtractedField<T = string> {
  value: T | null
  confidence: FieldConfidence
  sourceRegion?: SourceRegion
  conflictsWithOnFile?: boolean
  // On-file value when conflictsWithOnFile — feeds the keep/replace diff.
  onFileValue?: string
  // Why a validator demoted this field — shown in the Explainability Drawer.
  validationNote?: string
}

export type PlanType =
  | 'PPO'
  | 'HMO'
  | 'EPO'
  | 'POS'
  | 'Medicare'
  | 'Medicaid'
  | 'Other'

export type SubscriberRelationship = 'self' | 'spouse' | 'child' | 'other'

export interface Copays {
  pcp?: string
  specialist?: string
  er?: string
  rx?: string
}

export interface InsuranceExtraction {
  documentId: string
  documentType: InsuranceDocumentType
  payerName: ExtractedField
  planName: ExtractedField
  planType: ExtractedField<PlanType>
  memberId: ExtractedField
  groupNumber: ExtractedField
  subscriberName: ExtractedField
  subscriberDob: ExtractedField // ISO date string
  relationshipToSubscriber: ExtractedField<SubscriberRelationship>
  effectiveDate: ExtractedField // ISO date string
  rxBin: ExtractedField
  rxPcn: ExtractedField
  rxGroup: ExtractedField
  copays: ExtractedField<Copays>
  payerPhone: ExtractedField
  claimsAddress: ExtractedField
  overallConfidence: FieldConfidence
}

// Field keys that render as editable rows in the review form (everything
// except documentId/documentType/overallConfidence).
export const EXTRACTION_FIELD_KEYS = [
  'payerName',
  'planName',
  'planType',
  'memberId',
  'groupNumber',
  'subscriberName',
  'subscriberDob',
  'relationshipToSubscriber',
  'effectiveDate',
  'rxBin',
  'rxPcn',
  'rxGroup',
  'copays',
  'payerPhone',
  'claimsAddress',
] as const

export type ExtractionFieldKey = (typeof EXTRACTION_FIELD_KEYS)[number]

export const FIELD_LABELS: Record<ExtractionFieldKey, string> = {
  payerName: 'Payer',
  planName: 'Plan name',
  planType: 'Plan type',
  memberId: 'Member ID',
  groupNumber: 'Group #',
  subscriberName: 'Subscriber',
  subscriberDob: 'Subscriber DOB',
  relationshipToSubscriber: 'Relationship',
  effectiveDate: 'Effective date',
  rxBin: 'RxBIN',
  rxPcn: 'RxPCN',
  rxGroup: 'RxGroup',
  copays: 'Copays',
  payerPhone: 'Payer phone',
  claimsAddress: 'Claims address',
}

// ---- API DTOs ----

export interface InsuranceDocumentDto {
  id: string
  patientMrn: string
  documentType: InsuranceDocumentType
  status: InsuranceDocumentStatus
  rejectReason: string | null
  pages: number
  hasBack: boolean
  isPdf: boolean
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  extraction: StoredExtraction | null
}

export interface StoredExtraction {
  id: string
  documentId: string
  payload: InsuranceExtraction
  agentName: string
  modelVersion: string
  extractedAt: string
}

export interface InsuranceCoverageDto {
  id: string
  patientMrn: string
  priority: 'primary' | 'secondary'
  payerName: string
  planName: string | null
  planType: string | null
  memberId: string | null
  groupNumber: string | null
  subscriberName: string | null
  subscriberDob: string | null
  relationshipToSubscriber: string | null
  effectiveDate: string | null
  rxBin: string | null
  rxPcn: string | null
  rxGroup: string | null
  copays: Copays | null
  payerPhone: string | null
  claimsAddress: string | null
  verifiedAt: string | null
  sourceDocumentId: string | null
  version: number
  supersededById: string | null
  modifiedByType: 'agent' | 'human'
  modifiedByAgentName: string | null
  createdAt: string
}

// Snapshot of what's currently on file, used for conflict detection + the diff UI.
export interface OnFileCoverage {
  payerName: string | null
  planName: string | null
  memberId: string | null
  groupNumber: string | null
  effectiveDate: string | null
}

export interface DecideRequest {
  operation: 'approve' | 'reject'
  reason?: string
  // Field overrides from per-field human edits: key -> final string value.
  edits?: Partial<Record<ExtractionFieldKey, string>>
  // Which keys were human-edited (provenance flips ⊕ -> ⊘).
  editedKeys?: ExtractionFieldKey[]
  // Required resolution for every conflicting field: keep on-file or replace.
  conflictResolutions?: Partial<Record<ExtractionFieldKey, 'keep' | 'replace'>>
}

// `insurance.updated` event payload — emitted on commit (§2.6.3.5).
// Future consumers: Eligibility Agent re-verification, billing.
export interface InsuranceUpdatedEvent {
  type: 'insurance.updated'
  patientMrn: string
  coverageId: string
  sourceDocumentId: string | null
  version: number
  occurredAt: string
}
