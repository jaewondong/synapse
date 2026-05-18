'use client'

import { formatRelativeTime } from '@/lib/utils'
import type { RecentPatient } from '@/lib/types/patient'

function PatientRow({ patient }: { patient: RecentPatient }) {
  return (
    <button
      className="w-full flex items-center gap-3 py-2.5 hover:bg-muted/50 rounded-lg px-2 transition-colors text-left -mx-2"
      onClick={() => console.log('open chart', patient.mrn)}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-semibold">
        {patient.initials}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{patient.name}</p>
        <p className="text-xs text-muted-foreground">MRN {patient.mrn}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatRelativeTime(patient.lastOpened)}
      </span>
    </button>
  )
}

interface RecentPatientsProps {
  patients: RecentPatient[]
}

export function RecentPatients({ patients }: RecentPatientsProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 pt-5 pb-4">
      <h2 className="text-sm font-semibold mb-3">Recent charts</h2>
      <div className="space-y-0">
        {patients.map((p) => (
          <PatientRow key={p.id} patient={p} />
        ))}
      </div>
    </div>
  )
}
