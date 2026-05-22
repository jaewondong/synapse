'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useChartStore } from '@/lib/stores/chart-store'

function formatDob(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

interface WrongPatientGuardProps {
  mrn: string
  name: string
  dob: string
}

export function WrongPatientGuard({ mrn, name, dob }: WrongPatientGuardProps) {
  const recordChartOpen = useChartStore((s) => s.recordChartOpen)
  const dismissWarning = useChartStore((s) => s.dismissWarning)

  React.useEffect(() => {
    const { showWarning } = recordChartOpen(mrn, name, dob)

    if (showWarning) {
      toast(`Did you mean ${name} (DOB ${formatDob(dob)})?`, {
        position: 'bottom-center',
        duration: 6000,
        onDismiss: dismissWarning,
        onAutoClose: dismissWarning,
      })
    }
  }, [mrn]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
