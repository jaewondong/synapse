import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/documents/[id]/signed-url
// Returns a short-lived signed URL (5 min) for a non-deleted document.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: doc, error: docErr } = await supabase
    .from('patient_documents')
    .select('storage_path, bucket, deleted_at')
    .eq('id', id)
    .single()

  if (docErr || !doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  if (doc.deleted_at) {
    return Response.json({ error: 'Document has been deleted' }, { status: 410 })
  }

  const { data, error: signErr } = await supabase.storage
    .from(doc.bucket as string)
    .createSignedUrl(doc.storage_path as string, 300) // 5 minutes

  if (signErr || !data) {
    return Response.json(
      { error: signErr?.message ?? 'Failed to generate signed URL' },
      { status: 500 },
    )
  }

  return Response.json({ url: data.signedUrl, expires_in: 300 })
}
