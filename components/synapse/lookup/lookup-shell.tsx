'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Info, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { LookupPatient } from '@/lib/types/chart'

function formatDob(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year}`
}

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-chart-info-bg text-chart-info-text font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size === 36 ? 13 : 15 }}
    >
      {initials}
    </div>
  )
}

function PediatricPill() {
  return (
    <span className="inline-block rounded-lg bg-chart-warning-bg text-chart-warning-text px-1.5 py-px text-[10px] font-medium leading-none">
      Pediatric
    </span>
  )
}

function ResultRow({
  patient,
  focused,
  onClick,
}: {
  patient: LookupPatient
  focused: boolean
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'w-full text-left grid items-center gap-3 rounded-lg border border-black/[0.08] bg-white p-3 cursor-pointer transition-colors',
        'hover:bg-chart-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
        focused && 'bg-chart-surface ring-2 ring-accent/30'
      )}
      style={{ gridTemplateColumns: '36px 1fr auto' }}
      onClick={onClick}
      tabIndex={-1}
    >
      <Avatar initials={patient.initials} />

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{patient.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {patient.sex} · {patient.age}
          </span>
          {patient.age < 18 && <PediatricPill />}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          DOB {formatDob(patient.dob)} · MRN {patient.mrn} · {patient.primaryDepartment} · Last seen{' '}
          {formatDob(patient.lastSeen)}
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  )
}

function HelpHint() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-black/[0.08] bg-white px-3 py-2.5">
      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        Multiple matches: add DOB or MRN to narrow. Selecting the wrong patient triggers an audit event.
      </p>
    </div>
  )
}

export function LookupShell() {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [dob, setDob] = React.useState('')
  const [mrn, setMrn] = React.useState('')
  const [results, setResults] = React.useState<LookupPatient[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [dobError, setDobError] = React.useState('')
  const [focusedIndex, setFocusedIndex] = React.useState(-1)

  const nameRef = React.useRef<HTMLInputElement>(null)
  const dobRef = React.useRef<HTMLInputElement>(null)

  // Cmd-P focus: if already on this page, focus the name field
  React.useEffect(() => {
    nameRef.current?.focus()
  }, [])

  async function handleSearch() {
    setDobError('')
    if (!name.trim() && !dob.trim() && !mrn.trim()) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (name) params.set('name', name)
      if (dob) params.set('dob', dob)
      if (mrn) params.set('mrn', mrn)

      const res = await fetch(`/api/patients/search?${params}`)
      if (!res.ok) {
        toast.error('Search failed. Please try again.')
        setLoading(false)
        return
      }
      const data = await res.json()

      if (data.dobError) {
        setDobError(data.dobError)
        setResults([])
        setLoading(false)
        return
      }

      if (data.directLoad) {
        toast.info('Loaded directly')
        router.push(`/chart/${data.directLoad}`)
        return
      }

      setResults(data.patients)
      setFocusedIndex(-1)
    } finally {
      setLoading(false)
    }
  }

  function openPatient(mrn: string) {
    router.push(`/chart/${mrn}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault()
      openPatient(results[focusedIndex].mrn)
    } else if (e.key === 'Escape') {
      setFocusedIndex(-1)
      nameRef.current?.focus()
    }
  }

  const queryLabel = [name, dob, mrn].filter(Boolean).join(', ')

  return (
    <div
      className="mx-auto w-full max-w-[720px] py-10 px-4"
      onKeyDown={handleKeyDown}
    >
      {/* Lookup card */}
      <div className="rounded-xl border border-black/[0.08] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
            <span className="text-[15px] font-medium">Patient lookup</span>
          </div>
          <span className="text-xs text-chart-subtle font-mono">Cmd-P</span>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
          <input
            ref={nameRef}
            name="fullName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Full name"
            className="h-9 rounded-lg border border-black/[0.08] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
          />
          <div className="relative">
            <input
              ref={dobRef}
              name="dob"
              value={dob}
              onChange={(e) => { setDob(e.target.value); setDobError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="DOB (MM/DD/YYYY)"
              className={cn(
                'h-9 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-surface',
                dobError ? 'border-signal-low' : 'border-border-hairline'
              )}
            />
            {dobError && (
              <p className="absolute top-full mt-1 text-[11px] text-signal-low">{dobError}</p>
            )}
          </div>
          <input
            name="mrn"
            value={mrn}
            onChange={(e) => setMrn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="MRN"
            className="h-9 rounded-lg border border-black/[0.08] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-chart-subtle">
            Any field works. Provide more than one to narrow.
          </span>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
            {!loading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Results region */}
      {results !== null && (
        <div className="mt-4">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-muted-foreground">
                  {results.length} {results.length === 1 ? 'match' : 'matches'} for &ldquo;{queryLabel}&rdquo;
                </span>
                <span className="text-xs text-chart-subtle">
                  Use ↑↓ to navigate · Enter to open
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {results.map((p, i) => (
                  <ResultRow
                    key={p.id}
                    patient={p}
                    focused={i === focusedIndex}
                    onClick={() => openPatient(p.mrn)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-black/[0.08] bg-white p-8 text-center">
              <p className="text-sm font-medium text-foreground">No patients match your search</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Searched for: {queryLabel}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => { setResults(null); nameRef.current?.focus() }}
                  className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs hover:bg-chart-surface transition-colors"
                >
                  Refine search
                </button>
                {/* TODO: check canRegisterPatient from auth context */}
                <button className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs hover:bg-chart-surface transition-colors opacity-50 cursor-not-allowed" disabled>
                  Register new patient
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <HelpHint />
    </div>
  )
}
