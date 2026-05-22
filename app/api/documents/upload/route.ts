import { createServerClient } from '@/lib/supabase/server'
import { DOCUMENTS_BUCKET } from '@/lib/storage'
import type { PatientDocument } from '@/components/synapse/documents/types'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(req: Request) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const patient_mrn = formData.get('patient_mrn') as string | null
  const patient_name = formData.get('patient_name') as string | null
  const department = formData.get('department') as string | null
  const idempotency_key = formData.get('idempotency_key') as string | null

  if (!file || !patient_mrn?.trim() || !patient_name?.trim() || !department?.trim()) {
    return Response.json(
      { error: 'file, patient_mrn, patient_name, and department are required' },
      { status: 400 },
    )
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { error: `File type "${file.type}" is not permitted. Allowed: PDF, images, plain text, Word documents.` },
      { status: 422 },
    )
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'File exceeds the 20 MB limit.' }, { status: 422 })
  }

  if (file.size === 0) {
    return Response.json({ error: 'File is empty.' }, { status: 422 })
  }

  const supabase = createServerClient()

  // Idempotency: if this key was already processed, return the existing record.
  if (idempotency_key) {
    const { data: existing } = await supabase
      .from('patient_documents')
      .select('*')
      .eq('idempotency_key', idempotency_key)
      .single()
    if (existing) {
      return Response.json({ document: existing as PatientDocument }, { status: 200 })
    }
  }

  // Derive a stable, non-guessable storage path.
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const storagePath = `${patient_mrn}/${department}/${slug}.${ext}`

  // Upload bytes to Storage.
  const buffer = await file.arrayBuffer()
  const { error: storageErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (storageErr) {
    return Response.json({ error: storageErr.message }, { status: 500 })
  }

  // Insert metadata row. On failure, clean up the orphaned storage object.
  const { data: doc, error: dbErr } = await supabase
    .from('patient_documents')
    .insert({
      idempotency_key: idempotency_key ?? null,
      patient_mrn,
      patient_name,
      department,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      bucket: DOCUMENTS_BUCKET,
      uploaded_by: 'demo-user',
    })
    .select()
    .single()

  if (dbErr) {
    // Orphan cleanup — best-effort; log but don't mask the original error.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    return Response.json({ error: dbErr.message }, { status: 500 })
  }

  return Response.json({ document: doc as PatientDocument }, { status: 201 })
}
