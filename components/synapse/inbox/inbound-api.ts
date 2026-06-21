// Synapse §2.9 — client-side fetchers for the inbound surface. All reads/writes
// go through the API routes (the inbound_emails table is service-role fenced).
import type { InboundEmailRecord } from '@/lib/inbound/InboundEmail'
import type { ReplyDestination } from '@/lib/scheduling/sendConfirmationReply'

async function asJson<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `request failed (${res.status})`)
  return json as T
}

export async function listInboundRecords(): Promise<InboundEmailRecord[]> {
  return (await asJson<{ records: InboundEmailRecord[] }>(await fetch('/api/inbound'))).records
}

export async function injectFixture(fixtureKey: string): Promise<InboundEmailRecord> {
  const res = await fetch('/api/inbound', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fixtureKey }),
  })
  return (await asJson<{ record: InboundEmailRecord }>(res)).record
}

type ActionBody = Record<string, unknown> & { action: string }

export async function inboundAction(
  id: string,
  body: ActionBody,
): Promise<{ record: InboundEmailRecord }> {
  const res = await fetch(`/api/inbound/${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return asJson<{ record: InboundEmailRecord }>(res)
}

export async function fetchReplyDestination(id: string): Promise<ReplyDestination> {
  const res = await fetch(`/api/inbound/${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'reply-destination' }),
  })
  return (await asJson<{ destination: ReplyDestination }>(res)).destination
}
