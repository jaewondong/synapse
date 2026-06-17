// Neurology dataset seeding (§2.8 §8) — canonical assignment table.
//
// Neurology diagnoses are assigned across the existing 50-patient mock set
// (patients.json). This file is the SINGLE SOURCE OF TRUTH for that assignment:
// `lib/mocks/neurology.fixtures.ts` imports NEURO_ASSIGNMENTS so the demo flow
// and fixtures can never drift (§8/§9 require the table be documented here).
//
// Existing disambiguation edge cases are RESPECTED — the three same-name
// "Maria Lopez" records keep their distinct MRNs/departments; only 00428193
// (the Neurology Maria Lopez) is the MS anchor (§8).
//
// ┌──────────┬──────────────────┬──────────────────┬──────────────────────────────┐
// │ MRN      │ Patient          │ Bucket           │ Demonstrates                 │
// ├──────────┼──────────────────┼──────────────────┼──────────────────────────────┤
// │ 00428193 │ Maria Lopez      │ ms (anchor)      │ EDSS trend + 8 subscores,    │
// │          │                  │                  │ relapses, DMT, MRI lesions;  │
// │          │                  │                  │ pending agent exam findings  │
// │ 00428604 │ James Chen       │ epilepsy (anchor)│ seizure freq clinic+diary,   │
// │          │                  │                  │ AED timeline, GAD-7 + NDDI-E │
// │ 00428878 │ Andrew Moore     │ undifferentiated │ workup; agent differential   │
// │ 00429700 │ Diego Davis      │ undifferentiated │ workup; agent differential   │
// │ 00429837 │ Kimberly Johnson │ unmapped         │ movement disorder → Fallback │
// │          │                  │ (movement_disord)│ + mds_updrs link_out (hard   │
// │          │                  │                  │ rule §5)                     │
// │ 00429974 │ Raj Singh        │ no-neuro         │ spine empty state            │
// │ 00430111 │ Kimberly Wang    │ no-neuro         │ spine empty state            │
// └──────────┴──────────────────┴──────────────────┴──────────────────────────────┘
//
// Agent-drafted, un-reviewed exam findings (⊕, pending) are seeded on the MS
// and epilepsy anchors to exercise the Accept/Edit/Reject review flow (§9).
//
// NOTE: there is no neuro Prisma schema in v1 — exam/scale extraction is mocked
// (§12, "keep signatures stable"). This module therefore exports the assignment
// as typed data consumed by the mock resolver rather than writing DB rows. When
// the real neuro tables land, this becomes the row-builder; the table above is
// the contract either way.

import type { ConditionKey } from '@/lib/neurology'

export type NeuroBucket =
  | 'ms'
  | 'epilepsy'
  | 'undifferentiated'
  | 'unmapped'
  | 'no-neuro'

export interface NeuroAssignment {
  mrn: string
  patientName: string
  bucket: NeuroBucket
  // conditionKey on the seeded active problem; undefined for workup/no-neuro.
  // 'movement_disorders' is intentionally OFF the registry to exercise Fallback.
  conditionKey?: ConditionKey
  hasPendingExamFindings?: boolean
}

export const NEURO_ASSIGNMENTS: readonly NeuroAssignment[] = [
  { mrn: '00428193', patientName: 'Maria Lopez', bucket: 'ms', conditionKey: 'ms', hasPendingExamFindings: true },
  { mrn: '00428604', patientName: 'James Chen', bucket: 'epilepsy', conditionKey: 'epilepsy', hasPendingExamFindings: true },
  { mrn: '00428878', patientName: 'Andrew Moore', bucket: 'undifferentiated' },
  { mrn: '00429700', patientName: 'Diego Davis', bucket: 'undifferentiated' },
  { mrn: '00429837', patientName: 'Kimberly Johnson', bucket: 'unmapped', conditionKey: 'movement_disorders' },
  { mrn: '00429974', patientName: 'Raj Singh', bucket: 'no-neuro' },
  { mrn: '00430111', patientName: 'Kimberly Wang', bucket: 'no-neuro' },
] as const

export const NEURO_ANCHORS = {
  ms: '00428193',
  epilepsy: '00428604',
} as const
