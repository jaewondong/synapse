import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { persistSession: false } },
  )
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_appointments',
    description: 'List scheduled appointments within a date range, including patient and provider details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date_from: { type: 'string', description: 'ISO datetime, inclusive (e.g. 2026-05-18T00:00:00Z)' },
        date_to: { type: 'string', description: 'ISO datetime, exclusive' },
      },
      required: ['date_from', 'date_to'],
    },
  },
  {
    name: 'search_patients',
    description: 'Search patients by first name, last name, or MRN. Returns matching patient records.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Partial name or MRN to search' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_providers',
    description: 'List all active providers with their IDs, names, and specialties.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_appointment',
    description: 'Create a new appointment. Triggers an email notification to staff.',
    input_schema: {
      type: 'object' as const,
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID from search_patients' },
        provider_id: { type: 'string', description: 'Provider UUID from get_providers' },
        starts_at: { type: 'string', description: 'ISO datetime for appointment start' },
        ends_at: { type: 'string', description: 'ISO datetime for appointment end' },
        visit_type: {
          type: 'string',
          enum: ['new_patient_eval', 'follow_up', 'procedure', 'infusion', 'telehealth', 'other'],
        },
        notes: { type: 'string', description: 'Optional clinical notes' },
        agent_reasoning: { type: 'string', description: 'Reasoning for this scheduling decision (for audit)' },
        agent_confidence: { type: 'number', description: 'Confidence 0–1' },
      },
      required: ['patient_id', 'provider_id', 'starts_at', 'ends_at', 'visit_type'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Move an existing appointment to a new time. Triggers an email notification to staff.',
    input_schema: {
      type: 'object' as const,
      properties: {
        appointment_id: { type: 'string', description: 'Appointment UUID' },
        starts_at: { type: 'string', description: 'New start ISO datetime' },
        ends_at: { type: 'string', description: 'New end ISO datetime' },
        reschedule_reason: { type: 'string', description: 'Reason for rescheduling' },
      },
      required: ['appointment_id', 'starts_at', 'ends_at', 'reschedule_reason'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment. Triggers an email notification to staff.',
    input_schema: {
      type: 'object' as const,
      properties: {
        appointment_id: { type: 'string', description: 'Appointment UUID' },
        cancellation_reason: { type: 'string', description: 'Reason for cancellation' },
      },
      required: ['appointment_id', 'cancellation_reason'],
    },
  },
]

type ToolInput = Record<string, unknown>

async function executeTool(name: string, input: ToolInput): Promise<unknown> {
  const sb = getSupabase()

  switch (name) {
    case 'list_appointments': {
      const { date_from, date_to } = input as { date_from: string; date_to: string }
      const { data, error } = await sb
        .from('appointments')
        .select(`
          id, starts_at, ends_at, visit_type, status, notes,
          patient:patients(id, mrn, first_name, last_name),
          provider:providers(id, first_name, last_name, specialty)
        `)
        .gte('starts_at', date_from)
        .lt('starts_at', date_to)
        .neq('status', 'cancelled')
        .order('starts_at')
      if (error) return { error: error.message }
      return data ?? []
    }

    case 'search_patients': {
      const { query } = input as { query: string }
      const { data, error } = await sb
        .from('patients')
        .select('id, mrn, first_name, last_name, date_of_birth')
        .or(`mrn.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10)
      if (error) return { error: error.message }
      return data ?? []
    }

    case 'get_providers': {
      const { data, error } = await sb
        .from('providers')
        .select('id, first_name, last_name, specialty, email')
        .eq('active', true)
        .order('last_name')
      if (error) return { error: error.message }
      return data ?? []
    }

    case 'create_appointment': {
      const {
        patient_id, provider_id, starts_at, ends_at, visit_type,
        notes, agent_reasoning, agent_confidence,
      } = input as {
        patient_id: string; provider_id: string; starts_at: string; ends_at: string
        visit_type: string; notes?: string; agent_reasoning?: string; agent_confidence?: number
      }
      const { data, error } = await sb
        .from('appointments')
        .insert({
          patient_id, provider_id, starts_at, ends_at, visit_type,
          notes, agent_reasoning, agent_confidence,
          created_by_agent: 'scheduling_agent_v1',
          status: 'scheduled',
        })
        .select('id')
        .single()
      if (error) return { error: error.message }
      return { success: true, appointment_id: data.id }
    }

    case 'reschedule_appointment': {
      const { appointment_id, starts_at, ends_at, reschedule_reason } = input as {
        appointment_id: string; starts_at: string; ends_at: string; reschedule_reason: string
      }
      const { data, error } = await sb
        .from('appointments')
        .update({ starts_at, ends_at, reschedule_reason })
        .eq('id', appointment_id)
        .select('id')
        .single()
      if (error) return { error: error.message }
      return { success: true, appointment_id: data.id }
    }

    case 'cancel_appointment': {
      const { appointment_id, cancellation_reason } = input as {
        appointment_id: string; cancellation_reason: string
      }
      const { data, error } = await sb
        .from('appointments')
        .update({ status: 'cancelled', cancellation_reason })
        .eq('id', appointment_id)
        .select('id')
        .single()
      if (error) return { error: error.message }
      return { success: true, appointment_id: data.id }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; name: string; input: ToolInput }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'done' }
  | { type: 'error'; message: string }

const SYSTEM_PROMPT = `You are the Synapse Scheduling Agent — an AI assistant helping medical office staff manage appointments for a neurology practice.

Capabilities:
- List and search appointments
- Search patients by name or MRN
- Create new appointments (default 30 min unless specified)
- Reschedule existing appointments
- Cancel appointments

Visit types: new_patient_eval, follow_up, procedure, infusion, telehealth, other

When creating an appointment: search for the patient and provider first to get their UUIDs. Include your reasoning in agent_reasoning for the audit trail. After completing any write action, confirm what you did concisely.

Today's date: ${new Date().toISOString().split('T')[0]}.`

export type ConversationMessage = { role: 'user' | 'assistant'; content: string }

export async function runSchedulingAgent(
  messages: ConversationMessage[],
  onEvent: (event: AgentEvent) => void,
): Promise<void> {
  const client = getClient()
  const loop: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  for (let i = 0; i < 10; i++) {
    const res = (await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      thinking: { type: 'adaptive' } as { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: loop,
    } as Anthropic.MessageCreateParamsNonStreaming)) as Anthropic.Message

    for (const block of res.content) {
      if (block.type === 'text') {
        onEvent({ type: 'text', delta: block.text })
      }
    }

    if (res.stop_reason === 'end_turn') break

    if (res.stop_reason === 'tool_use') {
      loop.push({ role: 'assistant', content: res.content })

      const results: Anthropic.ToolResultBlockParam[] = []
      for (const block of res.content) {
        if (block.type === 'tool_use') {
          const input = block.input as ToolInput
          onEvent({ type: 'tool_call', name: block.name, input })
          const result = await executeTool(block.name, input)
          onEvent({ type: 'tool_result', name: block.name, result })
          results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
        }
      }

      loop.push({ role: 'user', content: results })
    } else {
      break
    }
  }

  onEvent({ type: 'done' })
}
