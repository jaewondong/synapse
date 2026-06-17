'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { ExamDomain, ExamFinding } from '@/lib/neurology'
import { NeuroExamDomain, type FindingAction } from './NeuroExamDomain'

interface NeuroExamProps {
  exam: ExamDomain[]
  patientName: string
  mrn: string
}

// Accept/Edit flip provenance agent → human and drop the confidence dot (it's
// now human-owned). Reject marks the proposal rejected. Nothing auto-commits (§3).
function applyAction(finding: ExamFinding, action: FindingAction): ExamFinding {
  if (action === 'reject') {
    return { ...finding, reviewState: 'rejected', confidence: undefined }
  }
  return {
    ...finding,
    provenance: 'human',
    reviewState: action === 'accept' ? 'accepted' : 'edited',
    confidence: undefined,
  }
}

const ACTION_VERB: Record<FindingAction, string> = {
  accept: 'accepted',
  edit: 'marked edited',
  reject: 'rejected',
}

export function NeuroExam({ exam, patientName, mrn }: NeuroExamProps) {
  const [domains, setDomains] = React.useState<ExamDomain[]>(exam)
  // Mirror of state so the optimistic snapshot is read outside the setState
  // updater — keeping the updater pure (no side effects under StrictMode).
  const domainsRef = React.useRef(domains)
  React.useEffect(() => {
    domainsRef.current = domains
  }, [domains])

  // Optimistic update with a rollback toast (§1.7). We snapshot the prior state
  // and offer Undo; the mutation is applied immediately.
  const act = React.useCallback(
    (domainKey: ExamDomain['key'], findingId: string, action: FindingAction) => {
      const snapshot = domainsRef.current
      let label = ''
      const next = snapshot.map((d) =>
        d.key !== domainKey
          ? d
          : {
              ...d,
              findings: d.findings.map((f) => {
                if (f.id !== findingId) return f
                label = f.text
                return applyAction(f, action)
              }),
            },
      )
      setDomains(next)
      toast.success(`Finding ${ACTION_VERB[action]}`, {
        description: label.length > 64 ? `${label.slice(0, 64)}…` : label,
        action: { label: 'Undo', onClick: () => setDomains(snapshot) },
      })
    },
    [],
  )

  const toggleWnl = React.useCallback((domainKey: ExamDomain['key']) => {
    setDomains((prev) => prev.map((d) => (d.key === domainKey ? { ...d, normal: !d.normal } : d)))
  }, [])

  const pendingTotal = domains.reduce(
    (n, d) => n + d.findings.filter((f) => f.reviewState === 'pending').length,
    0,
  )

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          Structured neuro exam
        </p>
        {pendingTotal > 0 ? (
          <span className="text-[11px] text-accent">{pendingTotal} agent finding{pendingTotal === 1 ? '' : 's'} to review</span>
        ) : (
          <span className="text-[11px] text-chart-subtle">All findings reviewed</span>
        )}
      </div>

      <div className="space-y-2">
        {domains.map((d) => (
          <NeuroExamDomain
            key={d.key}
            domain={d}
            patientName={patientName}
            mrn={mrn}
            onAct={(findingId, action) => act(d.key, findingId, action)}
            onToggleWnl={() => toggleWnl(d.key)}
          />
        ))}
      </div>
    </div>
  )
}
