import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { getOnFileCoverage, mapDocument, mapExtraction } from '@/lib/db/insurance'
import { extractInsuranceDocument } from '@/lib/insurance/extractor'
import { applyConflicts } from '@/lib/insurance/validators'
import type { InsuranceExtraction } from '@/lib/types/insurance'
import type { FixtureKey } from '@/lib/insurance/fixtures'

export const runtime = 'nodejs'
export const maxDuration = 120 // real vision extraction can take a while

// POST /api/insurance/extract  { documentId, fixture? }
// Runs the Insurance Agent pipeline: classification -> field extraction ->
// validation -> conflict detection vs. coverage on file. The stored
// extraction row is immutable once created (frozen-rationale rule).
export async function POST(req: Request) {
  let body: { documentId?: string; fixture?: FixtureKey | null }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.documentId) {
    return Response.json({ error: 'documentId is required' }, { status: 400 })
  }

  const doc = await prisma.insuranceDocument.findUnique({ where: { id: body.documentId } })
  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  await prisma.insuranceDocument.update({
    where: { id: doc.id },
    data: { status: 'scanning' },
  })

  try {
    // Pull file bytes from storage (skipped when a fixture drives the run).
    const pages: Array<{ data: string; mediaType: string }> = []
    if (!body.fixture && process.env.ANTHROPIC_API_KEY) {
      const supabase = createServerClient()
      const sides = [
        { path: doc.frontStoragePath, mime: doc.frontMimeType },
        ...(doc.backStoragePath ? [{ path: doc.backStoragePath, mime: doc.backMimeType! }] : []),
      ]
      for (const side of sides) {
        const { data, error } = await supabase.storage.from(doc.bucket).download(side.path)
        if (error || !data) {
          throw new Error(`Failed to read stored document: ${error?.message ?? 'unknown error'}`)
        }
        pages.push({
          data: Buffer.from(await data.arrayBuffer()).toString('base64'),
          mediaType: side.mime,
        })
      }
    }

    const { extraction, modelVersion } = await extractInsuranceDocument({
      pages,
      fixture: body.fixture ?? null,
    })

    const payload: InsuranceExtraction = { ...extraction, documentId: doc.id }
    applyConflicts(payload, await getOnFileCoverage(doc.patientMrn))

    const [row, updatedDoc] = await prisma.$transaction([
      prisma.insuranceExtraction.create({
        data: {
          documentId: doc.id,
          payload: JSON.stringify(payload),
          agentName: 'Insurance Agent',
          modelVersion,
        },
      }),
      prisma.insuranceDocument.update({
        where: { id: doc.id },
        data: { status: 'pending_review', documentType: payload.documentType },
      }),
    ])

    return Response.json({
      extraction: mapExtraction(row),
      document: mapDocument(updatedDoc),
    })
  } catch (err) {
    await prisma.insuranceDocument.update({
      where: { id: doc.id },
      data: { status: 'uploaded' }, // back out of "scanning" so a retry is possible
    })
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
