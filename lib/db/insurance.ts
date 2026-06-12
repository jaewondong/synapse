import { prisma } from '@/lib/db/prisma'
import type {
  Copays,
  InsuranceCoverageDto,
  InsuranceDocumentDto,
  InsuranceDocumentStatus,
  InsuranceDocumentType,
  InsuranceExtraction,
  OnFileCoverage,
  StoredExtraction,
} from '@/lib/types/insurance'
import type { InsuranceCoverage, InsuranceDocument, InsuranceExtraction as InsuranceExtractionRow } from '@/lib/generated/prisma/client'

// Copays is JSON when agent-extracted but may be free text after a human edit.
function safeParseCopays(raw: string | null): Copays | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Copays) : null
  } catch {
    return null
  }
}

export function mapCoverage(c: InsuranceCoverage): InsuranceCoverageDto {
  return {
    id: c.id,
    patientMrn: c.patientMrn,
    priority: (c.priority as 'primary' | 'secondary') ?? 'primary',
    payerName: c.payerName,
    planName: c.planName,
    planType: c.planType,
    memberId: c.memberId,
    groupNumber: c.groupNumber,
    subscriberName: c.subscriberName,
    subscriberDob: c.subscriberDob,
    relationshipToSubscriber: c.relationshipToSubscriber,
    effectiveDate: c.effectiveDate,
    rxBin: c.rxBin,
    rxPcn: c.rxPcn,
    rxGroup: c.rxGroup,
    copays: safeParseCopays(c.copays),
    payerPhone: c.payerPhone,
    claimsAddress: c.claimsAddress,
    verifiedAt: c.verifiedAt,
    sourceDocumentId: c.sourceDocumentId,
    version: c.version,
    supersededById: c.supersededById,
    modifiedByType: (c.modifiedByType as 'agent' | 'human') ?? 'agent',
    modifiedByAgentName: c.modifiedByAgentName,
    createdAt: c.createdAt.toISOString(),
  }
}

export function mapExtraction(e: InsuranceExtractionRow): StoredExtraction {
  return {
    id: e.id,
    documentId: e.documentId,
    payload: JSON.parse(e.payload) as InsuranceExtraction,
    agentName: e.agentName,
    modelVersion: e.modelVersion,
    extractedAt: e.extractedAt.toISOString(),
  }
}

export function mapDocument(
  d: InsuranceDocument & { extractions?: InsuranceExtractionRow[] },
): InsuranceDocumentDto {
  const latest = d.extractions?.[0] ?? null
  return {
    id: d.id,
    patientMrn: d.patientMrn,
    documentType: d.documentType as InsuranceDocumentType,
    status: d.status as InsuranceDocumentStatus,
    rejectReason: d.rejectReason,
    pages: d.pages,
    hasBack: d.backStoragePath !== null,
    isPdf: d.frontMimeType === 'application/pdf',
    fileSize: d.fileSize,
    uploadedBy: d.uploadedBy,
    uploadedAt: d.uploadedAt.toISOString(),
    extraction: latest ? mapExtraction(latest) : null,
  }
}

// What's currently on file for conflict detection: the latest committed
// coverage version, falling back to the seeded PatientInsurance record.
export async function getOnFileCoverage(mrn: string): Promise<OnFileCoverage | null> {
  const latest = await prisma.insuranceCoverage.findFirst({
    where: { patientMrn: mrn, supersededById: null, priority: 'primary' },
    orderBy: { version: 'desc' },
  })
  if (latest) {
    return {
      payerName: latest.payerName,
      planName: latest.planName,
      memberId: latest.memberId,
      groupNumber: latest.groupNumber,
      effectiveDate: latest.effectiveDate,
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { mrn },
    include: { insurances: true },
  })
  const seeded = patient?.insurances.find((i) => i.slot === 'primary') ?? patient?.insurances[0]
  if (!seeded) return null
  return {
    payerName: seeded.payerName,
    planName: null,
    memberId: seeded.memberId,
    groupNumber: seeded.groupNumber,
    effectiveDate: seeded.effectiveStart,
  }
}

// Cross-patient work queue for the Billing workspace: every insurance
// document still awaiting human review, newest first.
export interface PendingInsuranceDocument {
  document: InsuranceDocumentDto
  patientName: string
}

export async function getPendingInsuranceDocuments(): Promise<PendingInsuranceDocument[]> {
  const docs = await prisma.insuranceDocument.findMany({
    where: { status: 'pending_review' },
    orderBy: { uploadedAt: 'desc' },
    include: { extractions: { orderBy: { extractedAt: 'desc' } } },
    take: 25,
  })
  if (docs.length === 0) return []

  const patients = await prisma.patient.findMany({
    where: { mrn: { in: [...new Set(docs.map((d) => d.patientMrn))] } },
    select: { mrn: true, firstName: true, lastName: true },
  })
  const nameByMrn = new Map(
    patients.map((p) => [p.mrn, [p.firstName, p.lastName].filter(Boolean).join(' ')]),
  )

  return docs.map((d) => ({
    document: mapDocument(d),
    patientName: nameByMrn.get(d.patientMrn) ?? d.patientMrn,
  }))
}

export async function getInsurancePageData(mrn: string): Promise<{
  coverages: InsuranceCoverageDto[]
  documents: InsuranceDocumentDto[]
  onFile: OnFileCoverage | null
}> {
  const [coverages, documents, onFile] = await Promise.all([
    prisma.insuranceCoverage.findMany({
      where: { patientMrn: mrn },
      orderBy: { version: 'desc' },
    }),
    prisma.insuranceDocument.findMany({
      where: { patientMrn: mrn },
      orderBy: { uploadedAt: 'desc' },
      include: { extractions: { orderBy: { extractedAt: 'desc' } } },
    }),
    getOnFileCoverage(mrn),
  ])

  return {
    coverages: coverages.map(mapCoverage),
    documents: documents.map(mapDocument),
    onFile,
  }
}
