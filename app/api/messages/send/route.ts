import { createHash } from 'crypto'
import { flags } from '@/lib/flags'
import { createServerClient } from '@/lib/supabase/server'
import type { Message } from '@/components/synapse/messages/types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { thread_id, channel, body, patient_mrn } = await req.json() as {
    thread_id: string
    channel: string
    body: string
    patient_mrn: string
  }

  if (!thread_id || !body?.trim() || !patient_mrn) {
    return Response.json({ error: 'thread_id, body, and patient_mrn are required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const hash = createHash('sha256').update(body).digest('hex')
  const now = new Date().toISOString()

  if (!flags.messaging.real_delivery) {
    // MOCK MODE: persist + audit, no external send.
    const { data: msg, error: msgErr } = await supabase
      .from('messages')
      .insert({
        thread_id,
        channel,
        body,
        direction: 'outbound',
        sender_name: 'Dr. Chen',
        delivery_status: 'mock',
        modified_by_type: 'human',
        sent_at: now,
      })
      .select()
      .single()

    if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 })

    // Update thread last_message_at and preview
    await supabase
      .from('message_threads')
      .update({
        last_message_at: now,
        last_message_preview: body.slice(0, 120),
        last_message_direction: 'outbound',
      })
      .eq('id', thread_id)

    // Audit log
    await supabase.from('message_audit').insert({
      message_id: (msg as Message).id,
      action: 'mock_send',
      patient_mrn,
      message_hash: hash,
    })

    return Response.json({ message: msg, delivery_status: 'mock' })
  }

  // ===== Step 5 FENCE — real delivery. DO NOT IMPLEMENT THIS PASS. =====
  return Response.json(
    { error: 'real_delivery enabled but not implemented — see Step 5' },
    { status: 501 },
  )
}
