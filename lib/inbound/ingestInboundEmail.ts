// Synapse §2.9 — inbound ingest is provider-agnostic behind this interface.
// INBOUND_ADAPTER=mock|resend selects the adapter; the rest of the app only
// ever sees the canonical InboundEmail. Build/test the full loop against mock;
// flip to resend when the webhook is live.
import type { InboundEmail } from './InboundEmail'

export interface IngestInboundEmail {
  /** Normalize a raw provider payload into a canonical InboundEmail. */
  ingest(raw: unknown): Promise<InboundEmail>
}

export type InboundAdapterName = 'mock' | 'resend'

export function inboundAdapterName(): InboundAdapterName {
  return process.env.INBOUND_ADAPTER === 'resend' ? 'resend' : 'mock'
}

/** Lazily load the configured adapter (keeps node-crypto / resend off the client). */
export async function getInboundAdapter(): Promise<IngestInboundEmail> {
  if (inboundAdapterName() === 'resend') {
    const { resendInboundAdapter } = await import('./adapters/resendInboundAdapter')
    return resendInboundAdapter
  }
  const { mockInboundAdapter } = await import('./adapters/mockInboundAdapter')
  return mockInboundAdapter
}
