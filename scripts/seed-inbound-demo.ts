/**
 * Seeds Supabase with the demo patients/providers/appointments the §2.9 inbound
 * scheduling loop needs so commit + reply work end-to-end.
 *
 * Run AFTER applying supabase/migrations/006_inbound_scheduling.sql:
 *   npx tsx scripts/seed-inbound-demo.ts
 *
 * Idempotent: upserts patients by MRN, providers by name, and replaces each
 * demo patient's upcoming appointment.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config() // fallback: also load .env

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

// Must align with DEMO_DIRECTORY + the fixtures' to-addresses (drhernandez@,
// drlopez@ → provider last names "Hernandez" / "Lopez").
const PROVIDERS = [
  { first_name: 'Ana', last_name: 'Hernandez', specialty: 'Cardiology', email: 'dr.hernandez@synapse.health' },
  { first_name: 'Luis', last_name: 'Lopez', specialty: 'Neurology', email: 'dr.lopez@synapse.health' },
]

const PATIENTS = [
  {
    mrn: '00428467',
    first_name: 'Robert',
    last_name: 'Hernandez',
    date_of_birth: '1958-03-14',
    preferred_email: 'robert.hernandez@gmail.com',
    providerLast: 'Hernandez',
  },
  {
    mrn: '00428193',
    first_name: 'Maria',
    last_name: 'Lopez',
    date_of_birth: '1979-07-22',
    preferred_email: 'maria.lopez@gmail.com',
    providerLast: 'Lopez',
  },
]

function nextWeekday(baseDaysOut: number, hour: number): { start: string; end: string } {
  const d = new Date()
  d.setDate(d.getDate() + baseDaysOut)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  d.setHours(hour, 0, 0, 0)
  const end = new Date(d)
  end.setMinutes(30)
  return { start: d.toISOString(), end: end.toISOString() }
}

async function main() {
  // Providers — query by name, insert if missing.
  const providerIdByLast = new Map<string, string>()
  for (const p of PROVIDERS) {
    const { data: existing } = await supabase
      .from('providers')
      .select('id')
      .eq('first_name', p.first_name)
      .eq('last_name', p.last_name)
      .maybeSingle()
    if (existing) {
      providerIdByLast.set(p.last_name, existing.id)
      continue
    }
    const { data, error } = await supabase.from('providers').insert(p).select('id').single()
    if (error) throw new Error(`provider ${p.last_name}: ${error.message}`)
    providerIdByLast.set(p.last_name, data.id)
    console.log(`+ provider Dr. ${p.last_name}`)
  }

  // Patients — upsert by MRN.
  const patientIdByMrn = new Map<string, string>()
  for (const p of PATIENTS) {
    const { data, error } = await supabase
      .from('patients')
      .upsert(
        {
          mrn: p.mrn,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth,
          preferred_email: p.preferred_email,
        },
        { onConflict: 'mrn' },
      )
      .select('id')
      .single()
    if (error) throw new Error(`patient ${p.mrn}: ${error.message}`)
    patientIdByMrn.set(p.mrn, data.id)
    console.log(`✓ patient ${p.first_name} ${p.last_name} (${p.mrn})`)
  }

  // One upcoming appointment per demo patient so reschedule/cancel can pin a
  // target (§1.G-E). Replace any existing future non-cancelled appt first.
  for (const p of PATIENTS) {
    const patientId = patientIdByMrn.get(p.mrn)!
    const providerId = providerIdByLast.get(p.providerLast)!
    await supabase
      .from('appointments')
      .delete()
      .eq('patient_id', patientId)
      .gte('starts_at', new Date().toISOString())
      .neq('status', 'cancelled')
    const { start, end } = nextWeekday(7, 14) // ~next week, 2pm
    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      provider_id: providerId,
      starts_at: start,
      ends_at: end,
      visit_type: 'follow_up',
      status: 'scheduled',
    })
    if (error) throw new Error(`appointment ${p.mrn}: ${error.message}`)
    console.log(`+ upcoming appt for ${p.last_name}`)
  }

  console.log('\nDone. Inbound scheduling demo data seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
