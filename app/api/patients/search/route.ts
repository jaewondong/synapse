import { NextResponse } from 'next/server'
import { searchPatients } from '@/lib/db/patients'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim() ?? ''
  const dob = searchParams.get('dob')?.trim() ?? ''
  const mrn = searchParams.get('mrn')?.trim() ?? ''

  try {
    const result = await searchPatients({ name, dob, mrn })
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
