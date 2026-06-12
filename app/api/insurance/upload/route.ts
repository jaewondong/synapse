import { createServerClient } from '@/lib/supabase/server'
import { DOCUMENTS_BUCKET } from '@/lib/storage'
import { prisma } from '@/lib/db/prisma'
import { mapDocument } from '@/lib/db/insurance'
import { fixtureFromFileName } from '@/lib/insurance/fixtures'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// POST /api/insurance/upload
// multipart: mrn, front (File), back (File, optional — front/back card pair).
// Storage paths are random slugs — no PHI in filenames (§2.6.1).
export async function POST(req: Request) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const mrn = formData.get('mrn') as string | null
  const front = formData.get('front') as File | null
  const back = formData.get('back') as File | null

  if (!mrn?.trim() || !front) {
    return Response.json({ error: 'mrn and front file are required' }, { status: 400 })
  }

  for (const file of [front, back].filter(Boolean) as File[]) {
    if (!ALLOWED_MIME.has(file.type)) {
      return Response.json(
        { error: `File type "${file.type}" is not permitted. Allowed: JPG, PNG, WebP, PDF.` },
        { status: 422 },
      )
    }
    if (file.size === 0) {
      return Response.json({ error: 'File is empty.' }, { status: 422 })
    }
  }

  if (front.size + (back?.size ?? 0) > MAX_BYTES) {
    return Response.json({ error: 'Files exceed the 10 MB limit.' }, { status: 422 })
  }

  if (back && front.type === 'application/pdf') {
    return Response.json({ error: 'Front/back pairing applies to card images, not PDFs.' }, { status: 422 })
  }

  const patient = await prisma.patient.findUnique({ where: { mrn } })
  if (!patient) {
    return Response.json({ error: 'Patient not found' }, { status: 404 })
  }

  const supabase = createServerClient()
  const extOf = (f: File) => f.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const frontPath = `${mrn}/insurance/${slug}-front.${extOf(front)}`
  const backPath = back ? `${mrn}/insurance/${slug}-back.${extOf(back)}` : null

  const uploads: string[] = []
  for (const [file, path] of [[front, frontPath], [back, backPath]] as Array<[File | null, string | null]>) {
    if (!file || !path) continue
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })
    if (error) {
      // Clean up anything already uploaded before failing.
      if (uploads.length > 0) await supabase.storage.from(DOCUMENTS_BUCKET).remove(uploads)
      return Response.json({ error: error.message }, { status: 500 })
    }
    uploads.push(path)
  }

  const doc = await prisma.insuranceDocument.create({
    data: {
      patientMrn: mrn,
      bucket: DOCUMENTS_BUCKET,
      frontStoragePath: frontPath,
      frontMimeType: front.type,
      backStoragePath: backPath,
      backMimeType: back?.type ?? null,
      pages: back ? 2 : 1,
      fileSize: front.size + (back?.size ?? 0),
      uploadedBy: 'demo-user',
    },
  })

  // mock-* filename convention selects a fixture extraction (§2.6.6).
  const fixture = fixtureFromFileName(front.name)

  return Response.json({ document: mapDocument(doc), fixture }, { status: 201 })
}
