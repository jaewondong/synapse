// Insurance Document Agent — extraction pipeline (§2.6.6).
//
// `extractInsuranceDocument` is the interface the rest of the app depends on.
// Two implementations sit behind it:
//   1. Real pipeline: a vision-capable Claude call (claude-opus-4-8) with the
//      InsuranceExtraction contract enforced as a structured output, followed by
//      deterministic validators (lib/insurance/validators.ts) that can demote
//      per-field confidence and attach failure reasons.
//   2. Mock fixtures (lib/insurance/fixtures.ts), used when ANTHROPIC_API_KEY is
//      absent or the uploaded file follows the `mock-*` filename convention,
//      with simulated 2–4s latency for the skeleton state.

import Anthropic from '@anthropic-ai/sdk'
import type {
  Copays,
  InsuranceExtraction,
  PlanType,
  SubscriberRelationship,
} from '@/lib/types/insurance'
import { EXTRACTION_FIELD_KEYS } from '@/lib/types/insurance'
import { runValidators } from './validators'
import { FIXTURES, type FixtureKey } from './fixtures'
import { KNOWN_PAYERS } from './payers'

const MODEL = 'claude-opus-4-8'

export interface ExtractorInput {
  // Base64-encoded file content. Images: one entry per side (front, back).
  // PDFs: a single entry with media type application/pdf.
  pages: Array<{ data: string; mediaType: string }>
  // Force a mock fixture (mock-* filename convention) — bypasses the API.
  fixture?: FixtureKey | null
}

export interface ExtractorResult {
  extraction: Omit<InsuranceExtraction, 'documentId'>
  modelVersion: string
}

// ---- Structured-output schema (mirrors lib/types/insurance.ts) ----

const REGION_SCHEMA = {
  type: 'object',
  description:
    'Bounding box of the region the value was read from, normalized 0-1 relative to the page. page is 0-indexed (page 1 = back of a card pair or second PDF page).',
  properties: {
    page: { type: 'integer' },
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
  },
  required: ['page', 'x', 'y', 'w', 'h'],
  additionalProperties: false,
} as const

function fieldSchema(valueSchema: object, description: string) {
  return {
    type: 'object',
    description,
    properties: {
      value: { anyOf: [valueSchema, { type: 'null' }] },
      confidence: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description:
          'high = clearly legible and unambiguous; medium = legible but partially uncertain (blur, ambiguous formatting); low = guessed, partially illegible, or inferred rather than read.',
      },
      sourceRegion: { anyOf: [REGION_SCHEMA, { type: 'null' }] },
    },
    required: ['value', 'confidence', 'sourceRegion'],
    additionalProperties: false,
  }
}

const str = { type: 'string' } as const

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    documentType: {
      type: 'string',
      enum: ['insurance_card', 'eligibility_letter', 'eob', 'unknown'],
    },
    payerName: fieldSchema(str, 'Insurance payer/carrier name as printed.'),
    planName: fieldSchema(str, 'Plan or product name.'),
    planType: fieldSchema(
      { type: 'string', enum: ['PPO', 'HMO', 'EPO', 'POS', 'Medicare', 'Medicaid', 'Other'] },
      'Plan type.',
    ),
    memberId: fieldSchema(str, 'Member/subscriber ID exactly as printed.'),
    groupNumber: fieldSchema(str, 'Group number.'),
    subscriberName: fieldSchema(str, 'Subscriber name as printed.'),
    subscriberDob: fieldSchema(str, 'Subscriber date of birth as ISO date (YYYY-MM-DD).'),
    relationshipToSubscriber: fieldSchema(
      { type: 'string', enum: ['self', 'spouse', 'child', 'other'] },
      'Patient relationship to the subscriber. Use self when the card is in the patient name and nothing indicates otherwise.',
    ),
    effectiveDate: fieldSchema(str, 'Coverage effective date as ISO date (YYYY-MM-DD).'),
    rxBin: fieldSchema(str, 'Pharmacy RxBIN.'),
    rxPcn: fieldSchema(str, 'Pharmacy RxPCN.'),
    rxGroup: fieldSchema(str, 'Pharmacy RxGroup / RxGrp.'),
    copays: fieldSchema(
      {
        type: 'object',
        properties: {
          pcp: { anyOf: [str, { type: 'null' }] },
          specialist: { anyOf: [str, { type: 'null' }] },
          er: { anyOf: [str, { type: 'null' }] },
          rx: { anyOf: [str, { type: 'null' }] },
        },
        required: ['pcp', 'specialist', 'er', 'rx'],
        additionalProperties: false,
      },
      'Copay amounts as printed (e.g. "$25" or "20%").',
    ),
    payerPhone: fieldSchema(str, 'Member services / payer phone number.'),
    claimsAddress: fieldSchema(str, 'Claims mailing address.'),
    overallConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: [
    'documentType',
    ...EXTRACTION_FIELD_KEYS,
    'overallConfidence',
  ],
  additionalProperties: false,
} as const

const SYSTEM_PROMPT = `You are the Insurance Document Agent inside Synapse, an EMR used by clinic front-desk and billing staff.

You are given an insurance document: a photo of an insurance card (possibly front and back as two images), a scanned eligibility/coverage letter, or an EOB (explanation of benefits). Classify the document type and extract structured coverage fields.

Rules:
- Extract values exactly as printed; normalize dates to ISO YYYY-MM-DD only when the printed date is unambiguous.
- Never guess. If a field is not present or not legible, set value to null. A null value with low confidence is always better than a fabricated one.
- For every non-null value, report the sourceRegion: the bounding box you read it from, normalized 0-1 against that page (x,y = top-left corner; w,h = size). page is 0-indexed; if two images are provided, the first is page 0 (front) and the second page 1 (back).
- Confidence is per-field: high only when the text is clearly legible and unambiguous; medium when legible but uncertain (blur, glare, ambiguous separators); low when partially illegible or inferred.
- Known US payers include: ${KNOWN_PAYERS.join(', ')}. Matching one of these is a hint, not a requirement — extract what is printed.
- For an EOB, fill the coverage fields that are present (payer, member ID) and classify documentType as "eob".
- If the document is not an insurance document at all, classify it as "unknown" and set all fields to null with low confidence.`

// ---- Public interface ----

export async function extractInsuranceDocument(input: ExtractorInput): Promise<ExtractorResult> {
  if (input.fixture || !process.env.ANTHROPIC_API_KEY) {
    return extractFromFixture(input.fixture ?? 'clean')
  }
  return extractWithClaude(input)
}

// ---- Mock implementation ----

async function extractFromFixture(key: FixtureKey): Promise<ExtractorResult> {
  // Simulated scan latency so the UI's skeleton state is exercised.
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000))
  // Deep-clone: fixtures are shared module state, validators mutate.
  const extraction = JSON.parse(JSON.stringify(FIXTURES[key])) as Omit<
    InsuranceExtraction,
    'documentId'
  >
  runValidators(extraction as InsuranceExtraction)
  return { extraction, modelVersion: `fixture:${key}` }
}

// ---- Real implementation ----

type RawExtraction = Omit<InsuranceExtraction, 'documentId'> & {
  planType: InsuranceExtraction['planType'] & { value: PlanType | null }
  relationshipToSubscriber: InsuranceExtraction['relationshipToSubscriber'] & {
    value: SubscriberRelationship | null
  }
  copays: InsuranceExtraction['copays'] & { value: Copays | null }
}

async function extractWithClaude(input: ExtractorInput): Promise<ExtractorResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const mediaBlocks: Anthropic.ContentBlockParam[] = input.pages.map((page) =>
    page.mediaType === 'application/pdf'
      ? {
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: page.data },
        }
      : {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: page.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: page.data,
          },
        },
  )

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    output_config: {
      format: {
        type: 'json_schema',
        schema: EXTRACTION_SCHEMA as unknown as Record<string, unknown>,
      },
    },
    messages: [
      {
        role: 'user',
        content: [
          ...mediaBlocks,
          {
            type: 'text',
            text: 'Scan this insurance document and extract the coverage fields per the schema.',
          },
        ],
      },
    ],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('The extraction model declined to process this document.')
  }

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Extraction returned no structured output.')
  }

  const raw = JSON.parse(textBlock.text) as RawExtraction

  // Strip null sub-fields from copays and drop null sourceRegions so the
  // stored payload matches the ExtractedField contract (optional, not null).
  for (const key of EXTRACTION_FIELD_KEYS) {
    const field = raw[key] as { sourceRegion?: unknown }
    if (field.sourceRegion === null) delete field.sourceRegion
  }
  if (raw.copays.value) {
    const copays: Copays = {}
    for (const k of ['pcp', 'specialist', 'er', 'rx'] as const) {
      const v = (raw.copays.value as Record<string, string | null>)[k]
      if (v) copays[k] = v
    }
    raw.copays.value = Object.keys(copays).length > 0 ? copays : null
  }

  const extraction = runValidators(raw as InsuranceExtraction) as Omit<
    InsuranceExtraction,
    'documentId'
  >

  return { extraction, modelVersion: response.model }
}
