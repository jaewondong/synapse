import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } },
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'date_from and date_to are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, starts_at, ends_at, visit_type, status, notes,
      patient:patients(id, mrn, first_name, last_name),
      provider:providers(id, first_name, last_name, specialty)
    `)
    .gte('starts_at', dateFrom)
    .lt('starts_at', dateTo)
    .neq('status', 'cancelled')
    .order('starts_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
