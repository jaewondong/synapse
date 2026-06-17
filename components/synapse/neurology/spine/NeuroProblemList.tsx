import { formatDateOnly } from '@/lib/utils'
import type { NeuroProblem } from '@/lib/neurology'

interface NeuroProblemListProps {
  problems: NeuroProblem[]
}

// active → workup → resolved (§4.1). The active conditionKeys drive the modules.
const STATUS_ORDER: Record<NeuroProblem['status'], number> = { active: 0, workup: 1, resolved: 2 }

const STATUS_STYLES: Record<NeuroProblem['status'], string> = {
  active: 'text-chart-danger-text bg-chart-danger-bg',
  workup: 'text-chart-neutral-text bg-chart-neutral-bg',
  resolved: 'text-muted-foreground bg-muted',
}

const STATUS_LABEL: Record<NeuroProblem['status'], string> = {
  active: 'Active',
  workup: 'Workup',
  resolved: 'Resolved',
}

export function NeuroProblemList({ problems }: NeuroProblemListProps) {
  // B6: render ONLY neuro-tagged problems — no cross-specialty leakage.
  const neuro = problems
    .filter((p) => p.department === 'Neurology')
    .slice()
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Neurology problems
      </p>

      {neuro.length === 0 ? (
        <p className="py-2 text-[13px] text-muted-foreground">No neurology problems on file.</p>
      ) : (
        <div>
          {neuro.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-start justify-between gap-3 py-2 text-[13px] ${i < neuro.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="min-w-0">
                <p className="font-medium leading-snug break-words">{p.label}</p>
                <p className="mt-0.5 text-[11px] text-chart-subtle">
                  <span className="font-mono">{p.icd10}</span>
                  {p.onsetDate && <span> · Onset {formatDateOnly(p.onsetDate)}</span>}
                </p>
              </div>
              <span
                className={`shrink-0 self-start rounded-lg px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[p.status]}`}
              >
                {STATUS_LABEL[p.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
