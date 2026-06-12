import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

// GET /api/insurance/documents/[id]/signed-url?side=front|back
// Documents are PHI — files are served via short-lived signed URLs only (§2.6.1).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const side = new URL(req.url).searchParams.get('side') === 'back' ? 'back' : 'front'

  const doc = await prisma.insuranceDocument.findUnique({ where: { id } })
  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  const path = side === 'back' ? doc.backStoragePath : doc.frontStoragePath
  if (!path) {
    return Response.json({ error: `Document has no ${side} side` }, { status: 404 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.storage.from(doc.bucket).createSignedUrl(path, 300)

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? 'Failed to generate signed URL' },
      { status: 500 },
    )
  }

  return Response.json({ url: data.signedUrl, expires_in: 300 })
}
