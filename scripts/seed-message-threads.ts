/**
 * Seeds Supabase with mock message threads and messages.
 * Run after applying 004_messaging.sql:
 *   npx tsx scripts/seed-message-threads.ts
 *
 * Idempotent: deletes existing seed threads before re-inserting.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config() // fallback: also load .env

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

// Real DB patients (MRNs from synapse.db, as of seed-message-threads v1)
const SEED_PATIENTS = [
  { mrn: '00432303', name: 'Sandra Perez',    initials: 'SP', age: 32, sex: 'M', allergies: 2 },
  { mrn: '00430522', name: 'Carol Rodriguez', initials: 'CR', age: 36, sex: 'F', allergies: 3 },
  { mrn: '00431892', name: 'Robert Hernandez',initials: 'RH', age: 59, sex: 'M', allergies: 1 },
  { mrn: '00433536', name: 'Nancy Singh',      initials: 'NS', age: 52, sex: 'F', allergies: 1 },
  { mrn: '00432988', name: 'Daniel Nguyen',   initials: 'DN', age: 31, sex: 'M', allergies: 1 },
]

const now = new Date()
function daysAgo(n: number, hours = 0): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

async function applyMigration() {
  const sql = readFileSync(resolve('supabase/migrations/004_messaging.sql'), 'utf8')
  // Split on statement boundaries; execute each non-empty statement
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' }).single()
    if (error && !error.message.includes('already exists')) {
      // Many Supabase projects don't expose exec_sql — skip and instruct manual run
      console.warn('[migration] exec_sql unavailable — run 004_messaging.sql manually in the Supabase SQL editor')
      return
    }
  }
  console.log('[migration] 004_messaging.sql applied')
}

async function clearSeedData() {
  const mrns = SEED_PATIENTS.map((p) => p.mrn)
  const { error } = await supabase
    .from('message_threads')
    .delete()
    .in('patient_mrn', mrns)
  if (error) console.warn('[seed] clear error:', error.message)
}

async function seedThreads() {
  const threads: Array<{
    patient_mrn: string; patient_name: string; patient_initials: string
    patient_age: number; patient_sex: string; patient_allergy_count: number
    channel: string; subject: string; status: string
    last_message_at: string; last_message_preview: string; last_message_direction: string
    created_at: string
  }> = [
    {
      patient_mrn: '00432303', patient_name: 'Sandra Perez', patient_initials: 'SP',
      patient_age: 32, patient_sex: 'M', patient_allergy_count: 2,
      channel: 'email', subject: 'Brivaracetam titration schedule — follow-up question',
      status: 'open', last_message_at: daysAgo(0, 6),
      last_message_preview: 'Thank you! Just to confirm — should I continue the lower dose tonight?',
      last_message_direction: 'inbound', created_at: daysAgo(2),
    },
    {
      patient_mrn: '00430522', patient_name: 'Carol Rodriguez', patient_initials: 'CR',
      patient_age: 36, patient_sex: 'F', patient_allergy_count: 3,
      channel: 'email', subject: 'Tysabri infusion — reschedule request',
      status: 'open', last_message_at: daysAgo(0, 3),
      last_message_preview: "Yes we can move your infusion to May 29th. I'll have the front desk send a confirmation.",
      last_message_direction: 'outbound', created_at: daysAgo(0, 5),
    },
    {
      patient_mrn: '00431892', patient_name: 'Robert Hernandez', patient_initials: 'RH',
      patient_age: 59, patient_sex: 'M', patient_allergy_count: 1,
      channel: 'email', subject: 'Question about rituximab — number of infusions',
      status: 'open', last_message_at: daysAgo(1),
      last_message_preview: 'I got a letter from Anthem saying only 2 infusions were approved.',
      last_message_direction: 'inbound', created_at: daysAgo(1),
    },
    {
      patient_mrn: '00433536', patient_name: 'Nancy Singh', patient_initials: 'NS',
      patient_age: 52, patient_sex: 'F', patient_allergy_count: 1,
      channel: 'email', subject: 'DBS programming reschedule — confirmation needed',
      status: 'open', last_message_at: daysAgo(0, 3),
      last_message_preview: 'Hi Dr. Chen, staff checking in about the 10:15 slot. Patient called to confirm.',
      last_message_direction: 'inbound', created_at: daysAgo(0, 3),
    },
    {
      patient_mrn: '00432988', patient_name: 'Daniel Nguyen', patient_initials: 'DN',
      patient_age: 31, patient_sex: 'M', patient_allergy_count: 1,
      channel: 'email', subject: 'Referral: movement disorder consult',
      status: 'open', last_message_at: daysAgo(3),
      last_message_preview: 'Dear Dr. Chen, I am referring my patient Daniel Nguyen for evaluation of a progressive tremor.',
      last_message_direction: 'inbound', created_at: daysAgo(3),
    },
  ]

  const { data: inserted, error } = await supabase
    .from('message_threads')
    .insert(threads)
    .select('id, patient_mrn, subject')
  if (error) { console.error('[seed] insert threads error:', error.message); return [] }
  console.log(`[seed] inserted ${inserted!.length} threads`)
  return inserted!
}

type InsertedThread = { id: string; patient_mrn: string; subject: string | null }

async function seedMessages(threads: InsertedThread[]) {
  const byMrn = Object.fromEntries(threads.map((t) => [t.patient_mrn, t.id]))

  const messages: Array<{
    thread_id: string; direction: string; channel: string
    body: string; sender_name: string | null
    delivery_status: string; modified_by_type: string
    sent_at: string; created_at: string
  }> = [
    // --- Sandra Perez thread ---
    {
      thread_id: byMrn['00432303'], direction: 'inbound', channel: 'email',
      sender_name: 'Sandra Perez',
      body: "Hi Dr. Chen, after our visit today I wanted to confirm whether the new titration schedule supersedes the one from last month. I still have a few tablets from the prior dose and wasn't sure whether to finish them first.",
      delivery_status: 'received', modified_by_type: 'human',
      sent_at: daysAgo(2), created_at: daysAgo(2),
    },
    {
      thread_id: byMrn['00432303'], direction: 'outbound', channel: 'email',
      sender_name: 'Dr. Chen',
      body: "Hi Sandra, yes the new schedule supersedes the old one. Please start 50 mg twice daily this week and increase to 100 mg next Monday. You can discard the remaining tablets from the prior dose — no need to finish them.",
      delivery_status: 'mock', modified_by_type: 'human',
      sent_at: daysAgo(1, 12), created_at: daysAgo(1, 12),
    },
    {
      thread_id: byMrn['00432303'], direction: 'inbound', channel: 'email',
      sender_name: 'Sandra Perez',
      body: 'Thank you! Just to confirm — should I continue the lower dose tonight or start the new dose immediately?',
      delivery_status: 'received', modified_by_type: 'human',
      sent_at: daysAgo(0, 6), created_at: daysAgo(0, 6),
    },
    // --- Carol Rodriguez thread ---
    {
      thread_id: byMrn['00430522'], direction: 'inbound', channel: 'email',
      sender_name: 'Carol Rodriguez',
      body: "Hello, I need to move my May 22nd Tysabri infusion. Would May 29th work? I have a family commitment that conflicts with the original slot.",
      delivery_status: 'received', modified_by_type: 'human',
      sent_at: daysAgo(0, 5), created_at: daysAgo(0, 5),
    },
    {
      thread_id: byMrn['00430522'], direction: 'outbound', channel: 'email',
      sender_name: 'Dr. Chen',
      body: "Hi Carol, yes we can move your infusion to May 29th. I'll have the front desk send a confirmation with the updated time. Let us know if you need any other changes.",
      delivery_status: 'mock', modified_by_type: 'human',
      sent_at: daysAgo(0, 3), created_at: daysAgo(0, 3),
    },
    // --- Robert Hernandez thread ---
    {
      thread_id: byMrn['00431892'], direction: 'inbound', channel: 'email',
      sender_name: 'Robert Hernandez',
      body: "I got a letter from Anthem saying only 2 rituximab infusions were approved. My prior neurologist gave me 4 each cycle. Should I be worried about this? Do I need a prior authorization?",
      delivery_status: 'received', modified_by_type: 'human',
      sent_at: daysAgo(1), created_at: daysAgo(1),
    },
    // --- Nancy Singh thread (staff message) ---
    {
      thread_id: byMrn['00433536'], direction: 'inbound', channel: 'email',
      sender_name: 'Lakeside Neurology Front Desk',
      body: "Hi Dr. Chen, staff here checking in about the 10:15 DBS programming slot for Nancy Singh. She called this morning and asked us to confirm the slot is still held. Please advise.",
      delivery_status: 'received', modified_by_type: 'human',
      sent_at: daysAgo(0, 3), created_at: daysAgo(0, 3),
    },
    // --- Daniel Nguyen thread (referral) ---
    {
      thread_id: byMrn['00432988'], direction: 'inbound', channel: 'email',
      sender_name: 'Dr. Sunita Patel, CPMC',
      body: "Dear Dr. Chen, I am referring my patient Daniel Nguyen, 31M, for evaluation of a progressive resting tremor that has been worsening over the past eight months. He has no family history of Parkinson's but does have a history of anxiety and is currently on sertraline. I have attached the most recent MRI brain (unremarkable) and the recent neurology notes. Please let me know your availability for a new consult.",
      delivery_status: 'received', modified_by_type: 'human',
      sent_at: daysAgo(3), created_at: daysAgo(3),
    },
  ]

  const { error } = await supabase.from('messages').insert(messages)
  if (error) { console.error('[seed] insert messages error:', error.message); return }
  console.log(`[seed] inserted ${messages.length} messages`)
}

async function main() {
  console.log('Synapse message seed starting…')
  await applyMigration()
  await clearSeedData()
  const threads = await seedThreads()
  if (threads.length) await seedMessages(threads as InsertedThread[])
  console.log('Done.')
}

main().catch(console.error)
