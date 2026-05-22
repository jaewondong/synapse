'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileText, X, Search, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DEPARTMENT_OPTIONS, DEPARTMENT_LABELS } from './types'
import type { PatientDocument } from './types'
import type { LookupPatient } from '@/lib/types/chart'

type Step = 'select' | 'confirm' | 'uploading' | 'done'

interface PrefillPatient {
  mrn: string
  name: string
  dob: string
  age: number
  sex: string
}

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  prefillPatient?: PrefillPatient
  onUploaded?: (doc: PatientDocument) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDob(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

// Lightweight patient search row
function PatientRow({
  patient,
  onSelect,
}: {
  patient: LookupPatient
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-lg"
    >
      <div
        className="h-8 w-8 rounded-full bg-chart-info-bg text-chart-info-text text-[11px] font-medium flex items-center justify-center shrink-0"
      >
        {patient.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{patient.name}</p>
        <p className="text-xs text-muted-foreground">
          {patient.sex} · {patient.age}yo · DOB {formatDob(patient.dob)} · MRN {patient.mrn}
        </p>
      </div>
    </button>
  )
}

export function UploadDialog({
  open,
  onClose,
  prefillPatient,
  onUploaded,
}: UploadDialogProps) {
  const [step, setStep] = useState<Step>('select')
  const [file, setFile] = useState<File | null>(null)
  const [department, setDepartment] = useState('')
  const [patient, setPatient] = useState<LookupPatient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LookupPatient[]>([])
  const [searching, setSearching] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset all state when dialog opens or closes
  useEffect(() => {
    if (!open) return
    setStep('select')
    setFile(null)
    setDepartment('')
    setConfirmed(false)
    setUploadError(null)
    setSearchQuery('')
    setSearchResults([])

    if (prefillPatient) {
      setPatient({
        id: '',
        mrn: prefillPatient.mrn,
        name: prefillPatient.name,
        initials: prefillPatient.name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase(),
        dob: prefillPatient.dob,
        age: prefillPatient.age,
        sex: prefillPatient.sex as 'M' | 'F',
        primaryDepartment: '',
        lastSeen: '',
      })
    } else {
      setPatient(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Debounced patient search
  useEffect(() => {
    if (prefillPatient) return
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/patients/search?name=${encodeURIComponent(searchQuery)}`)
        const json = await res.json() as { patients?: LookupPatient[] }
        setSearchResults((json.patients ?? []).slice(0, 6))
      } catch {
        // silently ignore search errors
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery, prefillPatient])

  function handleFileAccepted(f: File) {
    const ALLOWED_MIME = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])
    if (!ALLOWED_MIME.has(f.type)) {
      toast.error(`"${f.name}" is not an accepted file type.`)
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('File exceeds the 20 MB limit.')
      return
    }
    if (f.size === 0) {
      toast.error('File is empty.')
      return
    }
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileAccepted(f)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFileAccepted(f)
    e.target.value = ''
  }

  function canProceedToConfirm(): boolean {
    return !!file && !!patient && !!department
  }

  const handleUpload = useCallback(async () => {
    if (!file || !patient || !department) return
    if (!confirmed) {
      setUploadError('Please check the confirmation box above before uploading.')
      return
    }
    setStep('uploading')
    setUploadError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('patient_mrn', patient.mrn)
    fd.append('patient_name', patient.name)
    fd.append('department', department)
    fd.append('idempotency_key', `${patient.mrn}-${file.name}-${file.size}-${file.lastModified}`)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      const json = await res.json() as { document?: PatientDocument; error?: string }

      if (!res.ok) {
        setUploadError(json.error ?? 'Upload failed')
        setStep('confirm')
        return
      }

      setStep('done')
      onUploaded?.(json.document!)
      toast.success(`"${file.name}" uploaded successfully`)
    } catch {
      setUploadError('Network error — please try again.')
      setStep('confirm')
    }
  }, [file, patient, department, confirmed, onUploaded])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Upload Document</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step: select */}
        {(step === 'select' || step === 'confirm') && (
          <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Demo banner */}
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-1.5">
              <span className="font-medium">Demo mode</span>
              <span className="text-amber-600">— do not upload real patient data until a BAA is in place.</span>
            </div>

            {/* File drop zone */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">File</p>
              <div
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 transition-colors text-center cursor-pointer',
                  dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground',
                  file && 'cursor-default',
                )}
              >
                {file ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-9 w-9 rounded-lg bg-chart-info-bg flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-chart-info-text" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or <span className="text-accent font-medium">click to browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      PDF, images, Word, plain text · max 20 MB
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.doc,.docx"
                  onChange={handleFileInput}
                />
              </div>
            </div>

            {/* Patient search */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Patient</p>
              {patient ? (
                <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 bg-muted/30">
                  <div className="h-8 w-8 rounded-full bg-chart-info-bg text-chart-info-text text-[11px] font-medium flex items-center justify-center shrink-0">
                    {patient.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {patient.sex} · {patient.age}yo · DOB {formatDob(patient.dob)} · MRN {patient.mrn}
                    </p>
                  </div>
                  {!prefillPatient && (
                    <button
                      type="button"
                      onClick={() => { setPatient(null); setSearchQuery('') }}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                    <Search className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or MRN…"
                      className="flex-1 px-2 py-2 text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none"
                    />
                    {searching && <Loader2 className="h-3.5 w-3.5 text-muted-foreground mr-3 animate-spin shrink-0" />}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-xl shadow-lg p-1 max-h-48 overflow-y-auto">
                      {searchResults.map((p) => (
                        <PatientRow
                          key={p.id || p.mrn}
                          patient={p}
                          onSelect={() => {
                            setPatient(p)
                            setSearchQuery('')
                            setSearchResults([])
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Department</p>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
              >
                <option value="">Select department…</option>
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Patient confirmation step */}
            {step === 'confirm' && patient && (
              <div className="rounded-xl border border-chart-warning-text/30 bg-chart-warning-bg px-4 py-3 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-chart-warning-text mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-chart-warning-text">Confirm patient identity before uploading</p>
                    <p className="text-chart-warning-text/80 mt-0.5 text-xs">
                      You are filing this document under:
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-chart-warning-text/90">
                      <li><span className="font-medium">Name:</span> {patient.name}</li>
                      <li><span className="font-medium">DOB:</span> {formatDob(patient.dob)}</li>
                      <li><span className="font-medium">MRN:</span> {patient.mrn}</li>
                      <li><span className="font-medium">Department:</span> {DEPARTMENT_LABELS[department] ?? department}</li>
                    </ul>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-chart-warning-text">
                    I confirm this is the correct patient and department.
                  </span>
                </label>
                {uploadError && (
                  <p className="text-xs text-destructive">{uploadError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: uploading */}
        {step === 'uploading' && (
          <div className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading {file?.name}…</p>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="p-8 flex flex-col items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium">Upload complete</p>
            <p className="text-xs text-muted-foreground">{file?.name} filed under {patient?.name}</p>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          {step === 'done' ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-accent text-white px-4 py-1.5 text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Done
            </button>
          ) : step === 'select' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <div className="flex flex-col items-end gap-1">
                {!canProceedToConfirm() && (file || patient || department) && (
                  <p className="text-xs text-muted-foreground">
                    {!file ? 'Select a file' : !patient ? 'Select a patient' : 'Select a department'}
                  </p>
                )}
                <button
                  type="button"
                  disabled={!canProceedToConfirm()}
                  onClick={() => setStep('confirm')}
                  className="rounded-md bg-accent text-white px-4 py-1.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review & Upload
                </button>
              </div>
            </>
          ) : step === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="rounded-md bg-accent text-white px-4 py-1.5 text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Upload
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
