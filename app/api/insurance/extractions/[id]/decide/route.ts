import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { mapCoverage, mapDocument } from '@/lib/db/insurance'
import {
  EXTRACTION_FIELD_KEYS,
  type DecideRequest,
  type ExtractedField,
  type ExtractionFieldKey,
  type InsuranceExtraction,
  type InsuranceUpdatedEvent,
} from '@/lib/types/insurance'

export const runtime = 'nodejs'

const DECIDED_BY = 'codyypham@berkeley.edu'

// POST /api/insurance/extractions/[id]/decide
// Approve commits a new coverage version (old row preserved and linked) and
// updates the demographics-rail insurance record; reject requires a reason.
// Both paths log to the audit tables. Nothing writes to coverage without
// explicit approval (§2.6.3.4).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: DecideRequest
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const row = await prisma.insuranceExtraction.findUnique({
    where: { id },
    include: { document: true },
  })
  if (!row) {
    return Response.json({ error: 'Extraction not found' }, { status: 404 })
  }
  const doc = row.document
  if (doc.status !== 'pending_review') {
    return Response.json({ error: `Document is ${doc.status}, not pending review.` }, { status: 409 })
  }

  const patient = await prisma.patient.findUnique({
    where: { mrn: doc.patientMrn },
    include: { insurances: true },
  })
  if (!patient) {
    return Response.json({ error: 'Patient not found' }, { status: 404 })
  }
  const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ')
  const extraction = JSON.parse(row.payload) as InsuranceExtraction
  const now = new Date().toISOString()

  // ---- Reject ----
  if (body.operation === 'reject') {
    if (!body.reason?.trim()) {
      return Response.json({ error: 'A reject reason is required.' }, { status: 400 })
    }

    const actionId = `ins-${randomUUID()}`
    const [updatedDoc] = await prisma.$transaction([
      prisma.insuranceDocument.update({
        where: { id: doc.id },
        data: { status: 'rejected', rejectReason: body.reason.trim() },
      }),
      prisma.agentActionRecord.create({
        data: {
          id: actionId,
          agentName: 'Insurance Agent',
          confidence: extraction.overallConfidence,
          summary: `Insurance document extraction rejected for ${patientName}`,
          detail: `Extracted ${extraction.documentType.replace(/_/g, ' ')} was rejected during human review.`,
          reasoningSummary: body.reason.trim(),
          sources: JSON.stringify([
            { label: 'Insurance document', reference: `insurance_documents/${doc.id}` },
            { label: 'Extraction', reference: `insurance_extractions/${row.id}` },
          ]),
          patientName,
          patientMrn: doc.patientMrn,
          actionTimestamp: new Date(),
          category: 'insurance',
          status: 'rejected',
        },
      }),
      prisma.decision.create({
        data: {
          actionId,
          operation: 'reject',
          reason: body.reason.trim(),
          decidedBy: DECIDED_BY,
        },
      }),
    ])

    return Response.json({ document: mapDocument(updatedDoc) })
  }

  // ---- Approve ----
  if (body.operation !== 'approve') {
    return Response.json({ error: 'operation must be "approve" or "reject"' }, { status: 400 })
  }

  // Every conflicting field needs an explicit keep/replace choice.
  const unresolved = EXTRACTION_FIELD_KEYS.filter((key) => {
    const field = extraction[key] as ExtractedField<unknown>
    return field.conflictsWithOnFile && !body.conflictResolutions?.[key]
  })
  if (unresolved.length > 0) {
    return Response.json(
      { error: `Unresolved conflicts: ${unresolved.join(', ')}. Choose keep or replace for each.` },
      { status: 400 },
    )
  }

  // Final value per field: human edit > keep-on-file resolution > extracted value.
  const finalValue = (key: ExtractionFieldKey): string | null => {
    if (body.edits && key in body.edits) {
      return body.edits[key]?.trim() || null
    }
    const field = extraction[key] as ExtractedField<unknown>
    if (field.conflictsWithOnFile && body.conflictResolutions?.[key] === 'keep') {
      return field.onFileValue ?? null
    }
    if (field.value === null || field.value === undefined) return null
    return typeof field.value === 'string' ? field.value : JSON.stringify(field.value)
  }

  const payerName = finalValue('payerName')
  if (!payerName) {
    return Response.json({ error: 'Cannot commit coverage without a payer name.' }, { status: 400 })
  }

  const copaysValue = finalValue('copays')
  const editedKeys = body.editedKeys ?? []

  const previous = await prisma.insuranceCoverage.findFirst({
    where: { patientMrn: doc.patientMrn, priority: 'primary', supersededById: null },
    orderBy: { version: 'desc' },
  })

  const coverage = await prisma.insuranceCoverage.create({
    data: {
      patientMrn: doc.patientMrn,
      priority: 'primary',
      payerName,
      planName: finalValue('planName'),
      planType: finalValue('planType'),
      memberId: finalValue('memberId'),
      groupNumber: finalValue('groupNumber'),
      subscriberName: finalValue('subscriberName'),
      subscriberDob: finalValue('subscriberDob'),
      relationshipToSubscriber: finalValue('relationshipToSubscriber'),
      effectiveDate: finalValue('effectiveDate'),
      rxBin: finalValue('rxBin'),
      rxPcn: finalValue('rxPcn'),
      rxGroup: finalValue('rxGroup'),
      copays: copaysValue,
      payerPhone: finalValue('payerPhone'),
      claimsAddress: finalValue('claimsAddress'),
      verifiedAt: now,
      sourceDocumentId: doc.id,
      version: (previous?.version ?? 0) + 1,
      modifiedByType: 'agent',
      modifiedByAgentName: 'Insurance Agent',
    },
  })

  const actionId = `ins-${randomUUID()}`
  const seededPrimary =
    patient.insurances.find((i) => i.slot === 'primary') ?? patient.insurances[0]

  const editedNote =
    editedKeys.length > 0 ? ` ${editedKeys.length} field(s) corrected by reviewer.` : ''

  await prisma.$transaction([
    // Version linking: old row preserved, pointed at its replacement.
    ...(previous
      ? [
          prisma.insuranceCoverage.update({
            where: { id: previous.id },
            data: { supersededById: coverage.id },
          }),
        ]
      : []),
    // Keep the demographics-rail record (PatientInsurance) in sync.
    seededPrimary
      ? prisma.patientInsurance.update({
          where: { id: seededPrimary.id },
          data: {
            payerName,
            memberId: finalValue('memberId'),
            groupNumber: finalValue('groupNumber'),
            eligibilityStatus: 'Active',
            lastVerifiedAt: now,
            verifiedByType: 'agent',
            verifiedByAgentName: 'Insurance Agent',
            effectiveStart: finalValue('effectiveDate'),
          },
        })
      : prisma.patientInsurance.create({
          data: {
            patientId: patient.id,
            slot: 'primary',
            payerName,
            memberId: finalValue('memberId'),
            groupNumber: finalValue('groupNumber'),
            eligibilityStatus: 'Active',
            lastVerifiedAt: now,
            verifiedByType: 'agent',
            verifiedByAgentName: 'Insurance Agent',
            effectiveStart: finalValue('effectiveDate'),
          },
        }),
    prisma.insuranceDocument.update({
      where: { id: doc.id },
      data: { status: 'approved' },
    }),
    prisma.agentActionRecord.create({
      data: {
        id: actionId,
        agentName: 'Insurance Agent',
        confidence: extraction.overallConfidence,
        summary: `Insurance coverage updated for ${patientName} from scanned ${extraction.documentType.replace(/_/g, ' ')}`,
        detail: `Committed coverage v${coverage.version}: ${payerName}${finalValue('memberId') ? ` · Member ${finalValue('memberId')}` : ''}${finalValue('groupNumber') ? ` · Group ${finalValue('groupNumber')}` : ''}.${editedNote}`,
        reasoningSummary: `Extraction approved by reviewer.${editedNote} Previous coverage version ${previous ? `v${previous.version} preserved and linked` : 'did not exist'}.`,
        sources: JSON.stringify([
          { label: 'Insurance document', reference: `insurance_documents/${doc.id}` },
          { label: 'Extraction', reference: `insurance_extractions/${row.id}` },
        ]),
        patientName,
        patientMrn: doc.patientMrn,
        actionTimestamp: new Date(),
        category: 'insurance',
        status: 'approved',
      },
    }),
    prisma.decision.create({
      data: {
        actionId,
        operation: 'approve',
        reason: body.reason?.trim() || null,
        decidedBy: DECIDED_BY,
      },
    }),
  ])
  const updatedDoc = await prisma.insuranceDocument.findUnique({ where: { id: doc.id } })

  // Downstream hook (§2.6.3.5): emit insurance.updated. Future consumers —
  // Eligibility Agent re-verification (270/271), billing. No consumers yet.
  const event: InsuranceUpdatedEvent = {
    type: 'insurance.updated',
    patientMrn: doc.patientMrn,
    coverageId: coverage.id,
    sourceDocumentId: doc.id,
    version: coverage.version,
    occurredAt: now,
  }
  console.log('[event]', JSON.stringify(event))

  return Response.json({
    coverage: mapCoverage(coverage),
    document: updatedDoc ? mapDocument(updatedDoc) : null,
    event,
  })
}
