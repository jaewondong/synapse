// Synapse §2.9 — Resend inbound adapter. Verifies the svix-signed webhook and
// normalizes a Resend `email.received` payload to the canonical InboundEmail.
// Resend signs with Svix; the signature is a plain HMAC-SHA256 over
// `${svix-id}.${svix-timestamp}.${body}`, so we verify with node:crypto and add
// no dependency. The body/subject are treated strictly as DATA, never as
// instructions (§1.G-F) — that is enforced downstream in the resolvers.
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { IngestInboundEmail } from '../ingestInboundEmail'
import type { InboundAttachment, InboundEmail } from '../InboundEmail'

export interface SvixHeaders {
  id: string | null
  timestamp: string | null
  signature: string | null
}

/** Pull the three svix headers off a Headers object. */
export function readSvixHeaders(headers: Headers): SvixHeaders {
  return {
    id: headers.get('svix-id'),
    timestamp: headers.get('svix-timestamp'),
    signature: headers.get('svix-signature'),
  }
}

/**
 * Verify a Resend/svix webhook signature against the raw request body.
 * Returns true only when a provided signature matches. Tolerates a 5-minute
 * timestamp skew to blunt replay.
 */
export function verifyResendSignature(
  rawBody: string,
  svix: SvixHeaders,
  secret: string | undefined,
): boolean {
  if (!secret || !svix.id || !svix.timestamp || !svix.signature) return false

  // Replay window: reject timestamps more than 5 minutes from now.
  const ts = Number(svix.timestamp)
  if (!Number.isFinite(ts)) return false
  const skewMs = Math.abs(Date.now() - ts * 1000)
  if (skewMs > 5 * 60 * 1000) return false

  // Secret is base64 after the `whsec_` prefix.
  const key = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  const keyBytes = Buffer.from(key, 'base64')

  const signedContent = `${svix.id}.${svix.timestamp}.${rawBody}`
  const expected = createHmac('sha256', keyBytes).update(signedContent).digest('base64')
  const expectedBuf = Buffer.from(expected)

  // Header is a space-delimited list of `v1,<sig>` pairs; match any.
  return svix.signature.split(' ').some((part) => {
    const sig = part.includes(',') ? part.split(',')[1] : part
    const sigBuf = Buffer.from(sig)
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)
  })
}

function firstAddress(value: unknown): { email: string; name?: string } {
  // Resend `from` may be a string ("Name <a@b.com>") or an object.
  if (typeof value === 'string') {
    const m = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
    if (m) return { email: m[2], name: m[1] || undefined }
    return { email: value.trim() }
  }
  if (value && typeof value === 'object') {
    const o = value as { email?: string; address?: string; name?: string }
    return { email: String(o.email ?? o.address ?? ''), name: o.name }
  }
  return { email: '' }
}

function firstTo(value: unknown): string {
  if (Array.isArray(value)) return firstAddress(value[0]).email
  return firstAddress(value).email
}

function mapAttachments(value: unknown): InboundAttachment[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((a) => {
    const o = (a ?? {}) as { filename?: string; content_type?: string; contentType?: string; size?: number }
    return {
      filename: String(o.filename ?? 'attachment'),
      contentType: String(o.content_type ?? o.contentType ?? 'application/octet-stream'),
      sizeBytes: Number(o.size ?? 0),
    }
  })
}

export const resendInboundAdapter: IngestInboundEmail = {
  async ingest(raw: unknown): Promise<InboundEmail> {
    const payload = (raw ?? {}) as { type?: string; data?: Record<string, unknown> }
    const data = payload.data ?? (raw as Record<string, unknown>)

    const from = firstAddress(data.from)
    return {
      // Idempotency key: the provider's stable email id.
      id: String(data.email_id ?? data.id ?? crypto.randomUUID()),
      providerMessageId: data.email_id ? String(data.email_id) : undefined,
      fromEmail: from.email,
      fromName: from.name,
      toAddress: firstTo(data.to),
      subject: String(data.subject ?? ''),
      text: String(data.text ?? ''),
      html: typeof data.html === 'string' ? data.html : undefined,
      receivedAt:
        typeof data.created_at === 'string' ? data.created_at : new Date().toISOString(),
      attachments: mapAttachments(data.attachments),
      status: 'new',
    }
  },
}
