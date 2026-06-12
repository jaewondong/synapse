// Mock extraction fixtures (§2.6.6). Used when no ANTHROPIC_API_KEY is set, or
// when an uploaded file is named with the `mock-` convention:
//   mock-clean.*    -> clean BCBS PPO card, all-high confidence
//   mock-blurry.*   -> blurry Medicare card, medium/low fields + a validation failure
//   mock-conflict.* -> eligibility letter whose group number conflicts with on-file coverage

import type {
  ExtractedField,
  FieldConfidence,
  InsuranceExtraction,
  SourceRegion,
} from '@/lib/types/insurance'

export type FixtureKey = 'clean' | 'blurry' | 'conflict'

function f<T = string>(
  value: NoInfer<T> | null,
  confidence: FieldConfidence = 'high',
  sourceRegion?: SourceRegion,
): ExtractedField<T> {
  return { value: value as T | null, confidence, sourceRegion }
}

const r = (x: number, y: number, w: number, h: number, page = 0): SourceRegion => ({
  page,
  x,
  y,
  w,
  h,
})

export const FIXTURES: Record<FixtureKey, Omit<InsuranceExtraction, 'documentId'>> = {
  clean: {
    documentType: 'insurance_card',
    payerName: f('Blue Cross Blue Shield', 'high', r(0.05, 0.05, 0.45, 0.1)),
    planName: f('Blue Advantage PPO', 'high', r(0.05, 0.18, 0.4, 0.07)),
    planType: f('PPO', 'high', r(0.35, 0.18, 0.1, 0.07)),
    memberId: f('XGH882034591', 'high', r(0.05, 0.34, 0.35, 0.07)),
    groupNumber: f('12345', 'high', r(0.05, 0.44, 0.25, 0.07)),
    subscriberName: f('MARIA LOPEZ', 'high', r(0.05, 0.27, 0.35, 0.06)),
    subscriberDob: f('1986-03-14', 'high', r(0.45, 0.27, 0.2, 0.06)),
    relationshipToSubscriber: f('self', 'high'),
    effectiveDate: f('2026-01-01', 'high', r(0.05, 0.54, 0.25, 0.06)),
    rxBin: f('003858', 'high', r(0.6, 0.34, 0.18, 0.06)),
    rxPcn: f('A4', 'high', r(0.6, 0.42, 0.12, 0.06)),
    rxGroup: f('BCTX', 'high', r(0.6, 0.5, 0.15, 0.06)),
    copays: f({ pcp: '$25', specialist: '$50', er: '$250', rx: '$10' }, 'high', r(0.05, 0.66, 0.55, 0.12)),
    payerPhone: f('1-800-521-2227', 'high', r(0.05, 0.1, 0.4, 0.06, 1)),
    claimsAddress: f('PO Box 660044, Dallas, TX 75266-0044', 'high', r(0.05, 0.3, 0.55, 0.1, 1)),
    overallConfidence: 'high',
  },
  blurry: {
    documentType: 'insurance_card',
    payerName: f('Medicare', 'high', r(0.05, 0.05, 0.4, 0.1)),
    planName: f('Medicare Part A & B', 'medium', r(0.05, 0.2, 0.4, 0.08)),
    planType: f('Medicare', 'high'),
    // Smudged digit — fails the member-ID plausibility validator (demoted to low).
    memberId: f('1EG4-TE5-MK7?', 'medium', r(0.05, 0.4, 0.4, 0.08)),
    groupNumber: f(null, 'low'),
    subscriberName: f('ROBERT HERNANDEZ', 'medium', r(0.05, 0.3, 0.4, 0.07)),
    subscriberDob: f(null, 'low'),
    relationshipToSubscriber: f('self', 'medium'),
    // Blur made the year ambiguous.
    effectiveDate: f('03-01', 'low', r(0.05, 0.55, 0.3, 0.07)),
    rxBin: f(null, 'low'),
    rxPcn: f(null, 'low'),
    rxGroup: f(null, 'low'),
    copays: f(null, 'low'),
    payerPhone: f('1-800-633-4227', 'medium', r(0.05, 0.75, 0.4, 0.06)),
    claimsAddress: f(null, 'low'),
    overallConfidence: 'low',
  },
  conflict: {
    documentType: 'eligibility_letter',
    payerName: f('Blue Cross Blue Shield', 'high', r(0.1, 0.08, 0.4, 0.05)),
    planName: f('Blue Advantage PPO', 'high', r(0.1, 0.3, 0.35, 0.04)),
    planType: f('PPO', 'high'),
    memberId: f('XGH882034591', 'high', r(0.1, 0.38, 0.3, 0.04)),
    // Differs from the group number on file — exercises the keep/replace diff.
    groupNumber: f('12346', 'high', r(0.1, 0.46, 0.25, 0.04)),
    subscriberName: f('MARIA LOPEZ', 'high', r(0.1, 0.22, 0.3, 0.04)),
    subscriberDob: f('1986-03-14', 'medium'),
    relationshipToSubscriber: f('self', 'high'),
    effectiveDate: f('2026-07-01', 'high', r(0.1, 0.54, 0.25, 0.04)),
    rxBin: f(null, 'medium'),
    rxPcn: f(null, 'medium'),
    rxGroup: f(null, 'medium'),
    copays: f(null, 'medium'),
    payerPhone: f('1-800-521-2227', 'high', r(0.1, 0.85, 0.3, 0.04)),
    claimsAddress: f(null, 'medium'),
    overallConfidence: 'high',
  },
}

export function fixtureFromFileName(fileName: string): FixtureKey | null {
  const m = fileName.toLowerCase().match(/^mock-(clean|blurry|conflict)/)
  return (m?.[1] as FixtureKey) ?? null
}
