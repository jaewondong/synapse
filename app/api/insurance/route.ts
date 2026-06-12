import { prisma } from '@/lib/db/prisma'
import { getInsurancePageData } from '@/lib/db/insurance'

export const runtime = 'nodejs'

// GET /api/insurance?mrn= — coverage on file, documents, and on-file snapshot
// for one patient. Used by the Billing workspace, which selects patients
// client-side rather than via a patient-scoped route.
export async function GET(req: Request) {
  const mrn = new URL(req.url).searchParams.get('mrn')
  if (!mrn?.trim()) {
    return Response.json({ error: 'mrn is required' }, { status: 400 })
  }

  const patient = await prisma.patient.findUnique({ where: { mrn } })
  if (!patient) {
    return Response.json({ error: 'Patient not found' }, { status: 404 })
  }

  const data = await getInsurancePageData(mrn)
  return Response.json(data)
}
