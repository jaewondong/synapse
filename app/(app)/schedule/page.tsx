import { ScheduleShell } from '@/components/synapse/schedule/schedule-shell'
import { getChartData } from '@/lib/db/patients'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const mrn = typeof params.patient_mrn === 'string' ? params.patient_mrn : undefined
  const intent = typeof params.intent === 'string' ? params.intent : 'book'
  const returnTo = typeof params.return_to === 'string' ? params.return_to : undefined

  if (!mrn) {
    return <ScheduleShell intent={intent} returnTo={returnTo} />
  }

  const data = await getChartData(mrn)

  if (!data) {
    return <ScheduleShell notFoundMrn={mrn} intent={intent} returnTo={returnTo} />
  }

  const { patient } = data

  return (
    <ScheduleShell
      patient={{
        mrn: patient.mrn,
        name: patient.name,
        initials: patient.initials,
        sex: patient.sex,
        age: patient.age,
        allergyCount: patient.allergyCount,
        isDeceased: patient.status === 'Deceased',
      }}
      intent={intent}
      returnTo={returnTo ?? `/chart/${patient.mrn}`}
    />
  )
}
