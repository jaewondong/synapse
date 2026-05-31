import { notFound } from 'next/navigation'
import { ChartShell } from '@/components/synapse/chart/chart-shell'
import { getChartData } from '@/lib/db/patients'
import { getLabsData } from '@/lib/db/labs'

export default async function LabsPage({
  params,
}: {
  params: Promise<{ mrn: string }>
}) {
  const { mrn } = await params

  const [chartData, labsData] = await Promise.all([
    getChartData(mrn),
    getLabsData(mrn),
  ])

  if (!chartData) notFound()

  return <ChartShell data={chartData} initialDepartment="labs" labsData={labsData} />
}
