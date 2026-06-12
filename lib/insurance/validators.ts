// Post-extraction validation (§2.6.4). Validators can only *demote* confidence
// and attach a note — a field that fails validation is never silently dropped;
// it renders low-confidence with the failure reason in the Explainability Drawer.

import type {
  ExtractedField,
  FieldConfidence,
  InsuranceExtraction,
  OnFileCoverage,
} from '@/lib/types/insurance'
import { matchesKnownPayer } from './payers'

const RANK: Record<FieldConfidence, number> = { high: 2, medium: 1, low: 0 }

function demote<T>(field: ExtractedField<T>, to: FieldConfidence, note: string) {
  if (RANK[to] < RANK[field.confidence]) {
    field.confidence = to
  }
  field.validationNote = field.validationNote ? `${field.validationNote} ${note}` : note
}

function isParseableDate(value: string): boolean {
  return !isNaN(new Date(value).getTime())
}

export function runValidators(extraction: InsuranceExtraction): InsuranceExtraction {
  const { payerName, memberId, subscriberDob, effectiveDate, payerPhone } = extraction

  if (payerName.value) {
    const match = matchesKnownPayer(payerName.value)
    if (!match) {
      demote(payerName, 'medium', 'Payer name did not match any payer on the known-payer list.')
    }
  }

  if (memberId.value) {
    if (!/^[A-Za-z0-9][A-Za-z0-9\- ]{4,24}$/.test(memberId.value.trim())) {
      demote(memberId, 'low', 'Member ID format failed plausibility check (expected 5–25 alphanumeric characters).')
    }
  }

  for (const [field, label] of [
    [subscriberDob, 'Subscriber DOB'],
    [effectiveDate, 'Effective date'],
  ] as const) {
    if (field.value && !isParseableDate(field.value)) {
      demote(field, 'low', `${label} is not a parseable date.`)
    }
  }

  if (effectiveDate.value && isParseableDate(effectiveDate.value)) {
    const d = new Date(effectiveDate.value)
    const now = new Date()
    const max = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())
    if (d.getFullYear() < 1990 || d > max) {
      demote(effectiveDate, 'low', 'Effective date is outside a plausible range.')
    }
  }

  if (payerPhone.value) {
    const digits = payerPhone.value.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) {
      demote(payerPhone, 'low', 'Payer phone does not look like a valid US phone number.')
    }
  }

  // Overall confidence = floor of the identity-critical fields.
  const critical = [extraction.payerName, extraction.memberId, extraction.groupNumber]
  const minRank = Math.min(...critical.map((f) => (f.value === null ? 1 : RANK[f.confidence])))
  extraction.overallConfidence = (['low', 'medium', 'high'] as const)[minRank]

  return extraction
}

// Conflict detection (§2.6.3.3): any extracted field that differs from coverage
// already on file gets flagged and carries the on-file value for the diff UI.
export function applyConflicts(
  extraction: InsuranceExtraction,
  onFile: OnFileCoverage | null,
): InsuranceExtraction {
  if (!onFile) return extraction

  const checks: Array<[ExtractedField, string | null]> = [
    [extraction.payerName, onFile.payerName],
    [extraction.planName, onFile.planName],
    [extraction.memberId, onFile.memberId],
    [extraction.groupNumber, onFile.groupNumber],
    [extraction.effectiveDate, onFile.effectiveDate],
  ]

  for (const [field, onFileValue] of checks) {
    if (!field.value || !onFileValue) continue
    const a = field.value.trim().toLowerCase()
    const b = onFileValue.trim().toLowerCase()
    if (a !== b) {
      field.conflictsWithOnFile = true
      field.onFileValue = onFileValue
    }
  }

  return extraction
}
