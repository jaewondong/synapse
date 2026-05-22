import { createServerClient } from '@/lib/supabase/server'
import type { MessageThread } from '@/components/synapse/messages/types'

export const runtime = 'nodejs'

// GET /api/messages/threads?patient_mrn=xxx
// Returns open threads for a patient, most recent first.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const patient_mrn = searchParams.get('patient_mrn')
  if (!patient_mrn) {
    return Response.json({ error: 'patient_mrn is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('message_threads')
    .select('*')
    .eq('patient_mrn', patient_mrn)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ threads: data as MessageThread[] })
}

// POST /api/messages/threads
// Creates a new message thread for a patient.
export async function POST(req: Request) {
  const body = await req.json() as {
    patient_mrn: string
    patient_name: string
    patient_initials: string
    patient_age: number | null
    patient_sex: string | null
    patient_allergy_count: number
    channel: 'email' | 'sms'
    subject?: string
  }

  const { patient_mrn, patient_name, patient_initials, channel } = body
  if (!patient_mrn || !patient_name || !patient_initials || !channel) {
    return Response.json(
      { error: 'patient_mrn, patient_name, patient_initials, and channel are required' },
      { status: 400 },
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('message_threads')
    .insert({
      patient_mrn,
      patient_name,
      patient_initials,
      patient_age: body.patient_age ?? null,
      patient_sex: body.patient_sex ?? null,
      patient_allergy_count: body.patient_allergy_count ?? 0,
      channel,
      subject: body.subject ?? null,
      status: 'open',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ thread: data as MessageThread }, { status: 201 })
}
