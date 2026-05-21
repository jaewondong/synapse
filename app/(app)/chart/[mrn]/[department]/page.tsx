import { notFound } from 'next/navigation'
import { ChartShell } from '@/components/synapse/chart/chart-shell'
import { getChartData } from '@/lib/db/patients'
import type { Department } from '@/lib/types/chart'

const VALID_DEPARTMENTS: Department[] = [
  'neurology',
  'cardiology',
  'imaging',
  'labs',
  'medications',
  'immunizations',
  'primary-care',
  'documents',
  'timeline',
]

export default async function ChartDepartmentPage({
  params,
}: {
  params: Promise<{ mrn: string; department: string }>
}) {
  const { mrn, department } = await params
  const data = await getChartData(mrn)

  if (!data) notFound()

  const dept = VALID_DEPARTMENTS.includes(department as Department)
    ? (department as Department)
    : null

  if (!dept) notFound()

  return <ChartShell data={data} initialDepartment={dept} />
}
