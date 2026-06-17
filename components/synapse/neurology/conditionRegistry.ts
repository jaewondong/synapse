// Condition registry (§2.8 §2) — ConditionKey → module component.
//
// Mirrors the §2.7 Explainability Drawer's panel registry EXACTLY: a
// Record<ConditionKey, …>, an unknown key falls through to the FallbackModule —
// never a crash, never a blank region (§9). Modules are resolved from the
// patient's ACTIVE neuro problems; the spine renders regardless.

import type { ComponentType } from 'react'
import type { ConditionKey, NeuroChart, NeuroProblem } from '@/lib/neurology'
import { EpilepsyModule } from './modules/EpilepsyModule'
import { MsModule } from './modules/MsModule'
import { UndifferentiatedModule } from './modules/UndifferentiatedModule'
import { FallbackModule } from './modules/FallbackModule'

// Every module receives the full chart plus the problem that keyed it.
export interface NeuroModuleProps {
  chart: NeuroChart
  problem: NeuroProblem
}

export interface RegisteredModule {
  key: ConditionKey
  label: string
  Component: ComponentType<NeuroModuleProps>
}

export const CONDITION_REGISTRY: Record<string, RegisteredModule> = {
  ms: { key: 'ms', label: 'Multiple sclerosis', Component: MsModule },
  epilepsy: { key: 'epilepsy', label: 'Epilepsy', Component: EpilepsyModule },
  undifferentiated: { key: 'undifferentiated', label: 'Undifferentiated', Component: UndifferentiatedModule },
}

export const FALLBACK_MODULE: RegisteredModule = {
  key: 'fallback',
  label: 'Fallback',
  Component: FallbackModule,
}

export interface ResolvedModule {
  module: RegisteredModule
  problem: NeuroProblem
  // Stable key for React — module key for registry hits, problem id for fallbacks
  // (distinct unmapped problems each get their own fallback card).
  renderKey: string
}

// Resolve the active problems to a de-duplicated, ordered list of modules.
// - conditionKey in the registry → that module
// - status 'workup' with no mapped key → UndifferentiatedModule (§4.1)
// - anything else active (unmapped key) → FallbackModule (§6.4)
export function resolveModules(problems: NeuroProblem[]): ResolvedModule[] {
  const active = problems.filter((p) => p.status !== 'resolved')
  const out: ResolvedModule[] = []
  const seen = new Set<string>()

  for (const problem of active) {
    const mapped = problem.conditionKey ? CONDITION_REGISTRY[problem.conditionKey] : undefined
    let mod: RegisteredModule
    if (mapped) {
      mod = mapped
    } else if (problem.status === 'workup') {
      mod = CONDITION_REGISTRY.undifferentiated
    } else {
      mod = FALLBACK_MODULE
    }

    // Registry modules dedupe by key (multi-problem MS shows one module);
    // fallbacks are per-problem so each unmapped diagnosis is named.
    const isFallback = mod.key === 'fallback'
    const dedupeKey = isFallback ? `fallback:${problem.id}` : mod.key
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    out.push({ module: mod, problem, renderKey: isFallback ? `fallback-${problem.id}` : mod.key })
  }

  return out
}
