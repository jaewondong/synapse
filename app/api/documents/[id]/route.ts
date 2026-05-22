import { createServerClient } from '@/lib/supabase/server'
import type { PatientDocument } from '@/components/synapse/documents/types'

export const runtime = 'nodejs'

// PATCH /api/documents/[id]
// Re-files a document to a different department.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json() as { department?: string }

  if (!body.department?.trim()) {
    return Response.json({ error: 'department is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('patient_documents')
    .update({
      department: body.department,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found or already deleted' }, { status: 404 })

  return Response.json({ document: data as PatientDocument })
}

// DELETE /api/documents/[id]
// Soft-deletes a document (sets deleted_at; file remains in storage).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('patient_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found or already deleted' }, { status: 404 })

  return Response.json({ ok: true })
}
