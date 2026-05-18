'use client'

import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/lib/types/patient'

interface ScheduleCardProps {
  appointments: Appointment[]
}

function StatusPill({ status, riskLevel }: { status: Appointment['status']; riskLevel?: string }) {
  if (status === 'checked-in') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Checked in
      </span>
    )
  }
  if (status === 'no-show-risk') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            riskLevel === 'high' ? 'bg-confidence-low' : 'bg-confidence-medium'
          )}
        />
        No-show risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border text-xs px-2 py-0.5">
      Scheduled
    </span>
  )
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-semibold">
      {initials}
    </span>
  )
}

export function ScheduleCard({ appointments }: ScheduleCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Today&apos;s schedule</h2>
          <span className="rounded-full bg-muted text-muted-foreground text-xs px-2 py-0.5 border border-border">
            {appointments.length} appointments
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {appointments.map((appt) => (
          <button
            key={appt.id}
            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-muted/50 transition-colors text-left"
            onClick={() => console.log('open chart', appt.patient.mrn)}
          >
            <span className="w-12 shrink-0 text-xs font-mono tabular-nums text-muted-foreground">
              {appt.time}
            </span>
            <AvatarCircle initials={appt.patient.initials} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">{appt.patient.name}</span>
                {appt.hasAgentPreppedChart && (
                  <Zap className="h-3 w-3 text-accent shrink-0" aria-label="Agent-prepped chart ready" />
                )}
                <span className="text-xs text-muted-foreground shrink-0">
                  MRN {appt.patient.mrn} · {appt.patient.age}{appt.patient.sex}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{appt.visitType}</p>
            </div>
            <div className="shrink-0">
              <StatusPill status={appt.status} riskLevel={appt.noShowRiskLevel} />
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-border px-5 py-3">
        <Link
          href="/schedule"
          className="flex items-center gap-1 text-sm text-accent hover:underline font-medium"
        >
          View full schedule
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
