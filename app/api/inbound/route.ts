// Synapse §2.9 — inbound receiver.
//   GET  → list inbound emails for the Inbox (service-role read; RLS-fenced table).
//   POST → ingest. In `resend` mode this is the live webhook (svix-verified). In
//          `mock` mode it is the dev-only injection trigger (fixture key or raw
//          email). Triage MAY pre-draft; scheduling waits for operator invocation.
import { NextResponse, type NextRequest } from 'next/server'
import { getInboundAdapter, inboundAdapterName } from '@/lib/inbound/ingestInboundEmail'
import { readSvixHeaders, verifyResendSignature } from '@/lib/inbound/adapters/resendInboundAdapter'
import { listInbound, persistInbound, updateInbound } from '@/lib/inbound/store'
import { triageEmail } from '@/lib/inbound/triageEmail'
import type { InboundEmail } from '@/lib/inbound/InboundEmail'

export async function GET() {
  try {
    const records = await listInbound()
    return NextResponse.json({ records })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'list failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Live mode: verify the svix signature before trusting anything (§4.1).
  if (inboundAdapterName() === 'resend') {
    const svix = readSvixHeaders(request.headers)
    const ok = verifyResendSignature(rawBody, svix, process.env.RESEND_WEBHOOK_SECRET)
    if (!ok) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }
  }

  let parsed: unknown
  try {
    parsed = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  // Resend sends an event envelope; only act on inbound receipt.
  if (inboundAdapterName() === 'resend') {
    const type = (parsed as { type?: string }).type
    if (type && type !== 'email.received') {
      return NextResponse.json({ ok: true, ignored: type })
    }
  }

  try {
    const adapter = await getInboundAdapter()
    const email: InboundEmail = await adapter.ingest(parsed)

    // persistInbound is idempotent on providerMessageId (duplicate deliveries).
    const record = await persistInbound(email)

    // Pre-draft triage so the operator sees an assessment on open — but do NOT
    // run the scheduling agent automatically (that waits for invocation, §4.1).
    if (!record.triage) {
      const triage = await triageEmail(email)
      const updated = await updateInbound(record.id, { triage })
      return NextResponse.json({ record: updated }, { status: 201 })
    }

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ingest failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
