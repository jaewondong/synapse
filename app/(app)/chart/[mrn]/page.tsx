import { notFound } from 'next/navigation'
import { ChartShell } from '@/components/synapse/chart/chart-shell'
import { getChartData } from '@/lib/db/patients'

export default async function ChartPage({
  params,
}: {
  params: Promise<{ mrn: string }>
}) {
  const { mrn } = await params
  const data = await getChartData(mrn)

  if (!data) notFound()

  return <ChartShell data={data} initialDepartment={null} />
}
