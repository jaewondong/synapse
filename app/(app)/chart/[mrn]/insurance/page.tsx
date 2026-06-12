import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { getInsurancePageData } from '@/lib/db/insurance'
import { InsuranceView } from '@/components/synapse/insurance/insurance-view'

// /chart/[mrn]/insurance — Insurance Document Agent (§2.6).
// Patient-scoped; entered from the demographics rail's insurance block.
export default async function InsurancePage({
  params,
}: {
  params: Promise<{ mrn: string }>
}) {
  const { mrn } = await params

  const [patient, data] = await Promise.all([
    prisma.patient.findUnique({ where: { mrn } }),
    getInsurancePageData(mrn),
  ])

  if (!patient) notFound()

  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ')

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4">
      <div className="rounded-xl bg-chart-surface p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/chart/${mrn}`}
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Chart
            </Link>
            <div className="h-4 w-px bg-black/[0.08]" />
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-[11px] text-muted-foreground">
                {[`MRN ${patient.mrn}`, patient.sex, `${patient.age}yo`].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <p className="text-[13px] font-medium">Insurance documents</p>
        </div>

        <InsuranceView
          mrn={mrn}
          coverages={data.coverages}
          documents={data.documents}
          seededOnFile={
            data.onFile
              ? {
                  payerName: data.onFile.payerName,
                  memberId: data.onFile.memberId,
                  groupNumber: data.onFile.groupNumber,
                }
              : null
          }
        />
      </div>
    </div>
  )
}
