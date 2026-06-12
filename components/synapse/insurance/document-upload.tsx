'use client'

import * as React from 'react'
import { Upload, FileText, X, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentUploadProps {
  busy: boolean
  onSubmit: (front: File, back: File | null) => void
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (file.type === 'application/pdf') return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return (
    <div className="relative rounded-lg border border-black/[0.08] bg-white overflow-hidden">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="h-28 w-full object-contain bg-muted/30" />
      ) : (
        <div className="h-28 flex items-center justify-center bg-muted/30">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      <div className="px-2 py-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground truncate">
          {file.name} · {formatBytes(file.size)}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// Upload entry: drag-drop / file-pick, client-side preview, and front+back
// card pairing as one logical document (§2.6.3.1).
export function DocumentUpload({ busy, onSubmit }: DocumentUploadProps) {
  const [front, setFront] = React.useState<File | null>(null)
  const [back, setBack] = React.useState<File | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function accept(files: File[]) {
    for (const f of files) {
      if (!ALLOWED_MIME.has(f.type)) {
        toast.error(`"${f.name}" is not an accepted type. Use JPG, PNG, WebP, or PDF.`)
        return
      }
      if (f.size === 0) {
        toast.error(`"${f.name}" is empty.`)
        return
      }
    }
    const total = files.reduce((s, f) => s + f.size, 0) + (front?.size ?? 0) + (back?.size ?? 0)
    if (total > MAX_BYTES) {
      toast.error('Files exceed the 10 MB limit.')
      return
    }

    for (const f of files) {
      if (f.type === 'application/pdf') {
        setFront(f)
        setBack(null)
        return
      }
      if (!front) setFront(f)
      else if (!back && front.type !== 'application/pdf') setBack(f)
      else toast.error('A document is one file, or a front + back card pair.')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    accept(Array.from(e.dataTransfer.files).slice(0, 2))
  }

  const isPdf = front?.type === 'application/pdf'

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Scan a new document
      </p>

      {!front ? (
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center cursor-pointer transition-colors',
            dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground',
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag & drop or <span className="text-accent font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Insurance card photo (front + back), eligibility letter, or EOB · JPG, PNG, WebP, PDF · max 10 MB
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className={cn('grid gap-2', !isPdf && 'grid-cols-2')}>
            <div>
              {!isPdf && (
                <p className="mb-1 text-[10px] uppercase tracking-[0.5px] text-chart-subtle">Front</p>
              )}
              <FilePreview file={front} onRemove={() => { setFront(back); setBack(null) }} />
            </div>
            {!isPdf && (
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-[0.5px] text-chart-subtle">Back</p>
                {back ? (
                  <FilePreview file={back} onRemove={() => setBack(null)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="h-full min-h-28 w-full rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-muted-foreground transition-colors"
                  >
                    + Add back of card (optional)
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => onSubmit(front, back)}
            className="w-full rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ScanLine className="h-4 w-4" />
            {busy ? 'Scanning…' : 'Scan with Insurance Agent'}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          accept(Array.from(e.target.files ?? []).slice(0, 2))
          e.target.value = ''
        }}
      />
    </div>
  )
}
