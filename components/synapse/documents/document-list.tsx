'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatRelativeTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { DocumentViewer } from './document-viewer'
import { DEPARTMENT_LABELS } from './types'
import type { PatientDocument } from './types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mimeLabel(mime: string): string {
  if (mime === 'application/pdf') return 'PDF'
  if (mime.startsWith('image/')) return 'Image'
  if (mime === 'text/plain') return 'Text'
  if (mime.includes('word')) return 'Word'
  return 'File'
}

interface DocumentRowProps {
  doc: PatientDocument
  onOpen: (doc: PatientDocument) => void
  onDelete: (doc: PatientDocument) => void
}

function DocumentRow({ doc, onOpen, onDelete }: DocumentRowProps) {
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return
    onDelete(doc)
  }

  return (
    <button
      onClick={() => onOpen(doc)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b border-border/60 last:border-0 group"
    >
      <div className="shrink-0 h-9 w-9 rounded-lg bg-chart-info-bg flex items-center justify-center">
        <FileText className="h-4 w-4 text-chart-info-text" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.file_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {mimeLabel(doc.mime_type)} · {formatBytes(doc.file_size)} ·{' '}
          {DEPARTMENT_LABELS[doc.department] ?? doc.department} ·{' '}
          {doc.patient_name}
        </p>
      </div>

      <span className="text-xs text-muted-foreground shrink-0 mr-2">
        {formatRelativeTime(doc.created_at)}
      </span>

      <button
        onClick={handleDelete}
        title="Delete document"
        aria-label="Delete document"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </button>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0">
      <div className="h-9 w-9 rounded-lg bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-muted rounded animate-pulse w-48" />
        <div className="h-3 bg-muted rounded animate-pulse w-32" />
      </div>
    </div>
  )
}

interface DocumentListProps {
  /** When provided, filters to this patient's documents. */
  patientMrn?: string
  /** When provided, filters to this department. */
  department?: string
  /** Called when the user clicks "Upload" so the parent can open the dialog. */
  onUploadClick?: () => void
  /** Incremented externally to trigger a refresh (e.g. after a successful upload). */
  refreshTrigger?: number
}

export function DocumentList({
  patientMrn,
  department,
  onUploadClick,
  refreshTrigger = 0,
}: DocumentListProps) {
  const [docs, setDocs] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>(department ?? 'all')
  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('patient_documents')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (patientMrn) query = query.eq('patient_mrn', patientMrn)

    const { data, error } = await query
    if (!error && data) setDocs(data as PatientDocument[])
    setLoading(false)
  }, [patientMrn])

  useEffect(() => { fetchDocs() }, [fetchDocs, refreshTrigger])

  async function handleDelete(doc: PatientDocument) {
    const snapshot = docs
    // Optimistic: drop the row immediately, restore + toast on failure.
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Document deleted')
    } else {
      setDocs(snapshot)
      let message = 'Delete failed'
      try { message = (await res.json()).error ?? message } catch {}
      toast.error(message)
    }
  }

  const deptSet = Array.from(new Set(docs.map((d) => d.department))).sort()
  const filtered =
    activeFilter === 'all' ? docs : docs.filter((d) => d.department === activeFilter)

  if (loading) {
    return (
      <div className="divide-y divide-border/60">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Filter chips + upload button */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-wrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'text-xs px-2.5 py-1 rounded-full border transition-colors',
            activeFilter === 'all'
              ? 'bg-accent text-white border-accent'
              : 'border-border text-muted-foreground hover:border-muted-foreground',
          )}
        >
          All
        </button>
        {deptSet.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveFilter(dept)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border transition-colors',
              activeFilter === dept
                ? 'bg-accent text-white border-accent'
                : 'border-border text-muted-foreground hover:border-muted-foreground',
            )}
          >
            {DEPARTMENT_LABELS[dept] ?? dept}
          </button>
        ))}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        )}
      </div>

      {/* Document rows */}
      {filtered.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          {onUploadClick ? (
            <button onClick={onUploadClick} className="hover:text-foreground transition-colors">
              No documents yet — click to upload one
            </button>
          ) : (
            'No documents'
          )}
        </div>
      ) : (
        <div>
          {filtered.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onOpen={setViewingDoc}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {viewingDoc && (
        <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  )
}
