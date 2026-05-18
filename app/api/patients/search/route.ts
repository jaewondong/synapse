import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  // Stub — returns empty results until patient database is wired
  return NextResponse.json({ patients: [], query: q })
}
