// Scale registry (§2.8 §5) — ScaleKey → definition + licensing.
//
// The licensing gate is a HARD constraint. A scale's licensing controls whether
// Synapse may compute it, only record an externally-entered value, or merely
// link out. Any scale NOT on the confirmed-`compute` list defaults to
// `record_only` with a build-time TODO — never silently embed an instrument.

import type { ScaleKey, ScaleLicensing } from '@/lib/neurology'

export interface ScaleDefinition {
  key: ScaleKey
  name: string
  licensing: ScaleLicensing
  // Short note rendered/documented for the licensing rationale.
  licensingNote?: string
}

export const SCALE_REGISTRY: Record<ScaleKey, ScaleDefinition> = {
  // ---- compute (free to implement) ----
  edss: { key: 'edss', name: 'EDSS (Kurtzke)', licensing: 'compute' },
  msfc: { key: 'msfc', name: 'MSFC (composite)', licensing: 'compute' },
  gad7: { key: 'gad7', name: 'GAD-7', licensing: 'compute' },
  nddie: { key: 'nddie', name: 'NDDI-E', licensing: 'compute' },
  seizure_frequency: {
    key: 'seizure_frequency',
    name: 'Seizure frequency',
    licensing: 'compute',
    licensingNote: 'Derived event count — not a licensed instrument.',
  },

  // ---- link_out (HARD RULE) ----
  mds_updrs: {
    key: 'mds_updrs',
    name: 'MDS-UPDRS',
    licensing: 'link_out',
    licensingNote:
      'May NOT be embedded/computed without Movement Disorder Society authorization. Link out only — never reproduce items.',
  },

  // ---- record_only / verify before any compute path (v2) ----
  // TODO: verify licensing before compute
  moca: { key: 'moca', name: 'MoCA', licensing: 'record_only', licensingNote: 'Verify licensing before compute.' },
  // TODO: verify licensing before compute
  ess: { key: 'ess', name: 'Epworth Sleepiness Scale', licensing: 'record_only', licensingNote: 'Verify licensing before compute.' },
  // TODO: verify licensing before compute
  qolie10: { key: 'qolie10', name: 'QOLIE-10', licensing: 'record_only', licensingNote: 'Verify licensing before compute.' },
  // TODO: verify licensing before compute
  hit6: { key: 'hit6', name: 'HIT-6', licensing: 'record_only', licensingNote: 'Verify licensing before compute.' },
  // TODO: verify licensing before compute
  midas: { key: 'midas', name: 'MIDAS', licensing: 'record_only', licensingNote: 'Verify licensing before compute.' },
}

// Defensive resolver: an unknown key defaults to record_only, never compute (§5).
export function resolveScaleDefinition(key: ScaleKey): ScaleDefinition {
  return (
    SCALE_REGISTRY[key] ?? {
      key,
      name: key,
      licensing: 'record_only',
      licensingNote: 'Unknown scale — defaulted to record_only. Verify licensing before compute.',
    }
  )
}
