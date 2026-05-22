'use client'

import { useQuery } from '@tanstack/react-query'

export type AppointmentFromApi = {
  id: string
  starts_at: string
  ends_at: string
  visit_type: string
  status: string
  notes: string | null
  patient: { id: string; mrn: string; first_name: string; last_name: string } | null
  provider: { id: string; first_name: string; last_name: string; specialty: string | null } | null
}

async function fetchAppointments(dateFrom: Date, dateTo: Date): Promise<AppointmentFromApi[]> {
  const params = new URLSearchParams({
    date_from: dateFrom.toISOString(),
    date_to: dateTo.toISOString(),
  })
  const res = await fetch(`/api/appointments?${params}`)
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  return res.json()
}

export function useAppointments(dateFrom: Date, dateTo: Date) {
  return useQuery({
    queryKey: ['appointments', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: () => fetchAppointments(dateFrom, dateTo),
    staleTime: 30_000,
  })
}
