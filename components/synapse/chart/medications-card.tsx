import * as React from 'react'
import { Pill } from 'lucide-react'
import { AuditStrip } from './audit-strip'
import type { Medication } from '@/lib/types/chart'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface MedicationsCardProps {
  medications: Medication[]
}

export function MedicationsCard({ medications }: MedicationsCardProps) {
  const active = medications.filter((m) => m.active)

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <Pill className="h-[18px] w-[18px]" aria-hidden />
        <span className="text-[15px] font-medium">Medications</span>
      </div>

      {active.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">No active medications</p>
      ) : (
        <div>
          {active.map((m, i) => (
            <div
              key={m.id}
              className={`py-2 text-[13px] ${i < active.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground text-xs">{m.dose} · {m.frequency}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Prescribed by {m.prescriber} · Started {formatDate(m.startDate)}
              </p>
              <AuditStrip
                modifiedByType={m.modifiedByType}
                modifiedByAgentName={m.modifiedByAgentName}
                modifiedAt={m.modifiedAt}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
