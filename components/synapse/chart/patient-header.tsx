'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'
import { AlertTriangle, MessageSquare, CalendarPlus, NotebookPen } from 'lucide-react'
import type { ChartPatient } from '@/lib/types/chart'

function formatDob(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function formatLastSeen(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

interface PatientHeaderProps {
  patient: ChartPatient
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const router = useRouter()
  const isDeceased = patient.status === 'Deceased'

  const handleSchedule = React.useCallback(() => {
    if (isDeceased) return
    const returnTo = encodeURIComponent(`/chart/${patient.mrn}`)
    router.push(`/schedule?patient_mrn=${patient.mrn}&intent=book&return_to=${returnTo}`)
  }, [isDeceased, patient.mrn, router])

  useHotkeys('s', handleSchedule, { enableOnFormTags: false, enabled: !isDeceased }, [handleSchedule])

  const statusColors = isDeceased
    ? 'bg-chart-danger-bg text-chart-danger-text'
    : 'bg-chart-success-bg text-chart-success-text'

  return (
    <div
      className="rounded-xl border border-black/[0.08] bg-white px-[18px] py-3.5"
      style={{ gridTemplateColumns: '48px 1fr auto', display: 'grid', gap: 14, alignItems: 'center' }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full bg-chart-info-bg text-chart-info-text font-medium shrink-0 text-[15px]"
        style={{ width: 48, height: 48 }}
      >
        {patient.initials}
      </div>

      {/* Identity */}
      <div>
        {/* Name row */}
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="text-[17px] font-medium">{patient.name}</span>
          <span className="text-xs text-muted-foreground">
            {patient.sex} · {patient.age} · DOB {formatDob(patient.dob)}
          </span>
          <span className="text-xs text-muted-foreground">MRN {patient.mrn}</span>
          <span className={`pill inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors}`}>
            {patient.status}
          </span>
          {patient.allergyCount > 0 && (
            <span className="pill inline-flex items-center gap-1 rounded-lg bg-chart-warning-bg text-chart-warning-text px-2 py-0.5 text-[11px] font-medium">
              <AlertTriangle className="h-[11px] w-[11px]" />
              {patient.allergyCount} {patient.allergyCount === 1 ? 'allergy' : 'allergies'}
            </span>
          )}
        </div>

        {/* Context line */}
        <p className="mt-0.5 text-xs text-chart-subtle">
          PCP: {patient.pcp} · Pref. language: {patient.preferredLanguage} · Pronouns:{' '}
          {patient.pronouns} · Last seen {formatLastSeen(patient.lastSeen)}
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 shrink-0">
        <QuickAction
          icon={<MessageSquare className="h-[13px] w-[13px]" />}
          label="Message"
          disabled={isDeceased}
          disabledReason="Action disabled for deceased patient"
        />
        <QuickAction
          icon={<CalendarPlus className="h-[13px] w-[13px]" />}
          label="Schedule"
          disabled={isDeceased}
          disabledReason="Action disabled for deceased patient"
          onClick={handleSchedule}
        />
        <QuickAction
          icon={<NotebookPen className="h-[13px] w-[13px]" />}
          label="New note"
          disabled={false}
        />
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  disabled,
  disabledReason,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  disabled: boolean
  disabledReason?: string
  onClick?: () => void
}) {
  return (
    <button
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-chart-surface disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
      {label}
    </button>
  )
}
