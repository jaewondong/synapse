'use client'

import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type PatientRowLinkSource = 'today_schedule' | 'today_recent_charts'

interface PatientRowLinkProps {
  mrn: string
  patientName: string
  source: PatientRowLinkSource
  disabled?: boolean
  disabledReason?: string
  children: ReactNode
  className?: string
}

export function PatientRowLink({
  mrn,
  patientName,
  source,
  disabled = false,
  disabledReason,
  children,
  className,
}: PatientRowLinkProps) {
  const base = cn(
    'flex items-center gap-3 rounded-md transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
    className,
  )

  if (disabled) {
    const row = (
      <div
        className={cn(base, 'cursor-not-allowed opacity-60')}
        aria-disabled="true"
        aria-label={`${patientName} — chart unavailable`}
      >
        {children}
      </div>
    )

    if (!disabledReason) return row

    return (
      <Tooltip>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={`/chart/${mrn}?source=${source}`}
      className={cn(base, 'hover:bg-muted/50')}
      aria-label={`Open chart for ${patientName}`}
    >
      {children}
    </Link>
  )
}