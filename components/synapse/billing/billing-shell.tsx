'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, X, FileText, ScanLine } from 'lucide-react'
import { safeFormatDate } from '@/lib/utils'
import { InsuranceView } from '@/components/synapse/insurance/insurance-view'
import type { PendingInsuranceDocument } from '@/lib/db/insurance'
import type {
  InsuranceCoverageDto,
  InsuranceDocumentDto,
  OnFileCoverage,
} from '@/lib/types/insurance'
import type { LookupPatient } from '@/lib/types/chart'

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance_card: 'Insurance card',
  eligibility_letter: 'Eligibility letter',
  eob: 'EOB',
  unknown: 'Document',
}

interface InsuranceData {
  coverages: InsuranceCoverageDto[]
  documents: InsuranceDocumentDto[]
  onFile: OnFileCoverage | null
}

interface BillingShellProps {
  pendingDocuments: PendingInsuranceDocument[]
}

export function BillingShell({ pendingDocuments }: BillingShellProps) {
  const router = useRouter()
  const [patient, setPatient] = React.useState<LookupPatient | null>(null)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<LookupPatient[]>([])
  const [searching, setSearching] = React.useState(false)
  const [data, setData] = React.useState<InsuranceData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced patient search (same contract as the documents upload dialog).
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/patients/search?name=${encodeURIComponent(query)}`)
        const json = (await res.json()) as { patients?: LookupPatient[] }
        setResults((json.patients ?? []).slice(0, 6))
      } catch {
        // ignore search errors
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const loadInsurance = React.useCallback(async (mrn: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/insurance?mrn=${encodeURIComponent(mrn)}`)
      if (res.ok) setData((await res.json()) as InsuranceData)
    } finally {
      setLoading(false)
    }
  }, [])

  function selectPatient(p: LookupPatient) {
    setPatient(p)
    setQuery('')
    setResults([])
    setData(null)
    loadInsurance(p.mrn)
  }

  function selectFromQueue(item: PendingInsuranceDocument) {
    selectPatient({
      id: '',
      mrn: item.document.patientMrn,
      name: item.patientName,
      initials: item.patientName
        .split(' ')
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      dob: '',
      age: 0,
      sex: 'F',
      primaryDepartment: '',
      lastSeen: '',
    })
  }

  function handleRefresh() {
    if (patient) loadInsurance(patient.mrn)
    router.refresh() // re-pulls the pending queue from the server
  }

  return (
    <div className="space-y-3">
      {/* Pending review queue — exception-based attention across all patients */}
      {pendingDocuments.length > 0 && (
        <div className="rounded-xl border border-chart-warning-text/30 bg-chart-warning-bg/40 px-3.5 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-warning-text">
            Awaiting verification ({pendingDocuments.length})
          </p>
          <div className="space-y-1.5">
            {pendingDocuments.map(({ document: doc, patientName }) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.05] bg-white px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">
                      <span className="font-medium">{patientName}</span>
                      {' — '}
                      {DOC_TYPE_LABELS[doc.documentType]}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[`MRN ${doc.patientMrn}`, safeFormatDate(doc.uploadedAt)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectFromQueue({ document: doc, patientName })}
                  className="shrink-0 rounded-md border border-border bg-white px-2.5 py-1 text-[12px] font-medium hover:bg-chart-surface/60 transition-colors"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient picker */}
      <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          Patient
        </p>
        {patient ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-info-bg text-[11px] font-medium text-chart-info-text">
              {patient.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{patient.name}</p>
              <p className="text-xs text-muted-foreground">MRN {patient.mrn}</p>
            </div>
            <Link
              href={`/chart/${patient.mrn}/insurance`}
              className="shrink-0 text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Open in chart
            </Link>
            <button
              type="button"
              onClick={() => {
                setPatient(null)
                setData(null)
              }}
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
              <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or MRN to scan an insurance document…"
                className="flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              {searching && (
                <Loader2 className="mr-3 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>
            {results.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-lg">
                {results.map((p) => (
                  <button
                    key={p.id || p.mrn}
                    type="button"
                    onClick={() => selectPatient(p)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-info-bg text-[11px] font-medium text-chart-info-text">
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.sex, p.age ? `${p.age}yo` : '', `MRN ${p.mrn}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insurance workspace for the selected patient */}
      {patient && loading && (
        <div className="rounded-xl border border-black/[0.08] bg-white p-4">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      )}
      {patient && !loading && data && (
        <InsuranceView
          key={patient.mrn}
          mrn={patient.mrn}
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
          onRefresh={handleRefresh}
        />
      )}

      {!patient && pendingDocuments.length === 0 && (
        <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-10 text-center">
          <ScanLine className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Select a patient to scan an insurance card, eligibility letter, or EOB.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            The Insurance Agent pre-fills the coverage form; you verify before anything saves.
          </p>
        </div>
      )}
    </div>
  )
}
