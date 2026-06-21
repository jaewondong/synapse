// Synapse §2.9 — mock inbound adapter. Default when INBOUND_ADAPTER !== 'resend'.
// Zero external setup: accepts either a fixture key or a full InboundEmail-shaped
// object and returns the canonical InboundEmail (§4.2).
import type { IngestInboundEmail } from '../ingestInboundEmail'
import type { InboundEmail } from '../InboundEmail'
import { getInboundFixture } from '@/lib/mock/inbound-fixtures'

function coerceEmail(raw: unknown): InboundEmail {
  // Form A: { fixtureKey: string } — inject a named fixture as if it just arrived.
  if (raw && typeof raw === 'object' && 'fixtureKey' in raw) {
    const key = String((raw as { fixtureKey: unknown }).fixtureKey)
    const fixture = getInboundFixture(key)
    if (!fixture) throw new Error(`Unknown inbound fixture: "${key}"`)
    // Stamp a fresh receivedAt so it sorts to the top of the inbox on inject.
    return { ...fixture.email, receivedAt: new Date().toISOString() }
  }

  // Form B: a raw email object (already roughly InboundEmail-shaped).
  if (raw && typeof raw === 'object' && 'fromEmail' in raw && 'toAddress' in raw) {
    const e = raw as Partial<InboundEmail>
    return {
      id: e.id ?? crypto.randomUUID(),
      providerMessageId: e.providerMessageId,
      fromEmail: String(e.fromEmail),
      fromName: e.fromName,
      toAddress: String(e.toAddress),
      subject: e.subject ?? '',
      text: e.text ?? '',
      html: e.html,
      receivedAt: e.receivedAt ?? new Date().toISOString(),
      attachments: e.attachments,
      status: 'new',
    }
  }

  throw new Error('mockInboundAdapter.ingest: unrecognized payload')
}

export const mockInboundAdapter: IngestInboundEmail = {
  async ingest(raw: unknown): Promise<InboundEmail> {
    return coerceEmail(raw)
  },
}
