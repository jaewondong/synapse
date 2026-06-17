import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Brain } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { joinDot } from '@/lib/utils'
import { NeurologyView } from '@/components/synapse/neurology/NeurologyView'

// /chart/[mrn]/neurology — Neurology Specialty View (§2.8).
// A dedicated specialty surface (spine + condition-module registry) that
// supersedes the generic neurology department tab for this route. Neuro data is
// resolved client-side by the view (mock resolver, §3) so skeletons render;
// the patient record is fetched here for the header and a 404 guard.
export default async function NeurologyPage({
  params,
}: {
  params: Promise<{ mrn: string }>
}) {
  const { mrn } = await params
  const patient = await prisma.patient.findUnique({ where: { mrn } })
  if (!patient) notFound()

  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ')

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-4">
      <div className="rounded-xl bg-chart-surface p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/chart/${mrn}`}
              className="flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Chart
            </Link>
            <div className="h-4 w-px bg-black/[0.08]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {joinDot([`MRN ${patient.mrn}`, patient.sex, patient.age != null ? `${patient.age}yo` : ''])}
              </p>
            </div>
          </div>
          <p className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium">
            <Brain className="h-4 w-4" aria-hidden />
            Neurology
          </p>
        </div>

        <NeurologyView mrn={mrn} patientName={name} />
      </div>
    </div>
  )
}
