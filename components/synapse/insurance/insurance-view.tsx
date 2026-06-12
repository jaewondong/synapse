'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDateOnly, safeFormatDate } from '@/lib/utils'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import type { ExtractionAuditPayload } from '@/lib/explainability'
import type {
  InsuranceCoverageDto,
  InsuranceDocumentDto,
  InsuranceDocumentStatus,
  StoredExtraction,
} from '@/lib/types/insurance'
import type { FixtureKey } from '@/lib/insurance/fixtures'
import { DocumentUpload } from './document-upload'
import { ExtractionReview } from './extraction-review'

const STATUS_STYLES: Record<InsuranceDocumentStatus, string> = {
  uploaded: 'text-chart-neutral-text bg-chart-neutral-bg',
  scanning: 'text-chart-info-text bg-chart-info-bg',
  pending_review: 'text-chart-warning-text bg-chart-warning-bg',
  approved: 'text-chart-success-text bg-chart-success-bg',
  rejected: 'text-chart-danger-text bg-chart-danger-bg',
}

const STATUS_LABELS: Record<InsuranceDocumentStatus, string> = {
  uploaded: 'Uploaded',
  scanning: 'Scanning',
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance_card: 'Insurance card',
  eligibility_letter: 'Eligibility letter',
  eob: 'EOB',
  unknown: 'Document',
}

// Skeletons, not spinners (§1.8) — mirrors the two-pane review layout.
function ScanSkeleton() {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4">
      <div className="mb-3 h-4 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,5fr) minmax(0,4fr)' }}>
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Insurance Agent is scanning the document…
      </p>
    </div>
  )
}

// Committed-version provenance for the Explainability Drawer (§2.7.6.3).
// Values were human-verified at commit, hence per-field high confidence.
function coverageExplainability(coverage: InsuranceCoverageDto): ExtractionAuditPayload {
  const fieldDefs: Array<[string, string | null]> = [
    ['Payer', coverage.payerName],
    ['Plan name', coverage.planName],
    ['Plan type', coverage.planType],
    ['Member ID', coverage.memberId],
    ['Group #', coverage.groupNumber],
    ['Effective date', coverage.effectiveDate],
    ['Payer phone', coverage.payerPhone],
  ]
  return {
    kind: 'extraction',
    title: `Insurance Extraction — Commit v${coverage.version}`,
    agentName: coverage.modifiedByAgentName ?? 'Insurance Agent',
    modifiedByType: 'agent',
    timestamp: coverage.verifiedAt ?? coverage.createdAt,
    patientMrn: coverage.patientMrn,
    documentLabel: coverage.sourceDocumentId
      ? 'Scanned insurance document'
      : 'Coverage record',
    commitVersion: coverage.version,
    committedBy: 'codyypham@berkeley.edu',
    fields: fieldDefs
      .filter(([, value]) => !!value)
      .map(([field, value]) => ({ field, committedValue: value!, confidence: 'high' as const })),
  }
}

function CoverageCard({ coverage, isCurrent }: { coverage: InsuranceCoverageDto; isCurrent: boolean }) {
  // B2: filter empties before joining with ·
  const subLine = [
    coverage.memberId ? `Mem ${coverage.memberId}` : '',
    coverage.groupNumber ? `Group ${coverage.groupNumber}` : '',
    coverage.planType ?? '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        isCurrent ? 'border-black/[0.08] bg-white' : 'border-black/[0.05] bg-muted/30 opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-medium">{coverage.payerName}</p>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.5px] text-chart-subtle">
          v{coverage.version}
          {!isCurrent && ' · superseded'}
        </span>
      </div>
      {subLine && <p className="truncate text-[11px] text-muted-foreground">{subLine}</p>}
      {coverage.effectiveDate && (
        <p className="text-[11px] text-muted-foreground">
          Effective {formatDateOnly(coverage.effectiveDate)}
        </p>
      )}
      {isCurrent && coverage.modifiedByType === 'agent' && (
        <AuditStrip
          modifiedByType="agent"
          modifiedByAgentName={coverage.modifiedByAgentName ?? 'Insurance Agent'}
          modifiedAt={coverage.verifiedAt ?? coverage.createdAt}
          explainability={coverageExplainability(coverage)}
        />
      )}
    </div>
  )
}

interface InsuranceViewProps {
  mrn: string
  coverages: InsuranceCoverageDto[]
  documents: InsuranceDocumentDto[]
  seededOnFile: { payerName: string | null; memberId: string | null; groupNumber: string | null } | null
  // When embedded with client-fetched data (Billing workspace), the host
  // refetches instead of relying on a server-component refresh.
  onRefresh?: () => void
}

export function InsuranceView({ mrn, coverages, documents: initialDocuments, seededOnFile, onRefresh }: InsuranceViewProps) {
  const router = useRouter()
  const [documents, setDocuments] = React.useState(initialDocuments)
  const [scanning, setScanning] = React.useState(false)
  const [activeReview, setActiveReview] = React.useState<{
    document: InsuranceDocumentDto
    extraction: StoredExtraction
  } | null>(null)

  // Resync after router.refresh() delivers fresh server props.
  React.useEffect(() => setDocuments(initialDocuments), [initialDocuments])

  async function handleSubmit(front: File, back: File | null) {
    setScanning(true)
    setActiveReview(null)
    try {
      const fd = new FormData()
      fd.append('mrn', mrn)
      fd.append('front', front)
      if (back) fd.append('back', back)

      const uploadRes = await fetch('/api/insurance/upload', { method: 'POST', body: fd })
      const uploadJson = (await uploadRes.json()) as {
        document?: InsuranceDocumentDto
        fixture?: FixtureKey | null
        error?: string
      }
      if (!uploadRes.ok || !uploadJson.document) {
        toast.error(uploadJson.error ?? 'Upload failed')
        return
      }
      setDocuments((docs) => [uploadJson.document!, ...docs])

      const extractRes = await fetch('/api/insurance/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: uploadJson.document.id, fixture: uploadJson.fixture ?? null }),
      })
      const extractJson = (await extractRes.json()) as {
        extraction?: StoredExtraction
        document?: InsuranceDocumentDto
        error?: string
      }
      if (!extractRes.ok || !extractJson.extraction || !extractJson.document) {
        toast.error(extractJson.error ?? 'Extraction failed')
        return
      }

      setDocuments((docs) =>
        docs.map((d) => (d.id === extractJson.document!.id ? extractJson.document! : d)),
      )
      setActiveReview({ document: extractJson.document, extraction: extractJson.extraction })
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setScanning(false)
    }
  }

  function handleDecided(updated: InsuranceDocumentDto) {
    setActiveReview(null)
    setDocuments((docs) => docs.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)))
    if (onRefresh) onRefresh()
    else router.refresh()
  }

  const currentCoverage = coverages.find((c) => c.supersededById === null) ?? null
  const history = coverages.filter((c) => c.supersededById !== null)

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px', alignItems: 'start' }}>
      {/* Main column */}
      <div className="min-w-0 space-y-3">
        <DocumentUpload busy={scanning} onSubmit={handleSubmit} />

        {scanning && <ScanSkeleton />}

        {!scanning && activeReview && (
          <ExtractionReview
            document={activeReview.document}
            extraction={activeReview.extraction}
            onDecided={handleDecided}
          />
        )}

        {/* Document history */}
        <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
            Document history
          </p>
          {documents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No insurance documents uploaded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.05] px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px]">
                        {DOC_TYPE_LABELS[doc.documentType]}
                        {doc.hasBack ? ' (front + back)' : ''}
                      </p>
                      {/* B2: filter empties before · join; B1: safeFormatDate */}
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[safeFormatDate(doc.uploadedAt), doc.uploadedBy, doc.rejectReason ? `Reason: ${doc.rejectReason}` : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        'rounded-lg px-2 py-0.5 text-[11px] font-medium',
                        STATUS_STYLES[doc.status],
                      )}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                    {doc.status === 'pending_review' && doc.extraction && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReview({ document: doc, extraction: doc.extraction! })
                        }
                        className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium hover:bg-chart-surface/60 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right rail: coverage on file */}
      <div className="sticky top-4 space-y-3">
        <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
            Coverage on file
          </p>
          {currentCoverage ? (
            <CoverageCard coverage={currentCoverage} isCurrent />
          ) : seededOnFile?.payerName ? (
            <div className="rounded-lg border border-black/[0.08] bg-white px-3 py-2.5">
              <p className="text-[13px] font-medium">{seededOnFile.payerName}</p>
              {/* B2: filter empties before · join */}
              <p className="text-[11px] text-muted-foreground">
                {[
                  seededOnFile.memberId ? `Mem ${seededOnFile.memberId}` : '',
                  seededOnFile.groupNumber ? `Group ${seededOnFile.groupNumber}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="mt-1 text-[11px] text-chart-subtle">From registration record</p>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">No coverage on file.</p>
          )}
        </div>

        {history.length > 0 && (
          <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
              Version history
            </p>
            <div className="space-y-1.5">
              {history.map((c) => (
                <CoverageCard key={c.id} coverage={c} isCurrent={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
