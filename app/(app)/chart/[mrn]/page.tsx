import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import type { Department } from '@/lib/types/chart'

const DEPARTMENT_ORDER: Exclude<Department, 'timeline'>[] = [
  'neurology',
  'cardiology',
  'imaging',
  'labs',
  'medications',
  'immunizations',
  'primary-care',
  'documents',
]

// Maps the stored primaryDepartment string (e.g. "Neurology", "Primary Care") to a valid
// URL segment. Falls back to 'neurology' if unrecognized.
function toDepartmentSlug(raw: string): Exclude<Department, 'timeline'> {
  const normalized = raw.toLowerCase().replace(/\s+/g, '-')
  return (DEPARTMENT_ORDER.find((d) => d === normalized) ?? 'neurology')
}

export default async function ChartDefaultPage({
  params,
  searchParams,
}: {
  params: Promise<{ mrn: string }>
  searchParams: Promise<{ source?: string }>
}) {
  const [{ mrn }, { source }] = await Promise.all([params, searchParams])

  const patient = await prisma.patient.findUnique({
    where: { mrn },
    select: { primaryDepartment: true },
  })

  if (!patient) notFound()

  const dept = toDepartmentSlug(patient.primaryDepartment)
  const qs = source ? `?source=${encodeURIComponent(source)}` : ''

  redirect(`/chart/${mrn}/${dept}${qs}`)
}
