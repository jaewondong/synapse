'use client'

import { useState, useEffect } from 'react'
import { FileText, Download } from 'lucide-react'
import type { PatientDocument } from './types'

interface DocumentViewerProps {
  doc: PatientDocument
  onClose: () => void
}

export function DocumentViewer({ doc, onClose }: DocumentViewerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUrl(null)
    setError(null)
    fetch(`/api/documents/${doc.id}/signed-url`)
      .then((r) => r.json())
      .then((j: { url?: string; error?: string }) => {
        if (j.url) setUrl(j.url)
        else setError(j.error ?? 'Could not load document')
      })
      .catch(() => setError('Network error — could not fetch document'))
  }, [doc.id])

  async function refreshUrl() {
    setUrl(null)
    setError(null)
    try {
      const r = await fetch(`/api/documents/${doc.id}/signed-url`)
      const j = await r.json() as { url?: string; error?: string }
      if (j.url) setUrl(j.url)
      else setError(j.error ?? 'Refresh failed')
    } catch {
      setError('Network error')
    }
  }

  const isPdf = doc.mime_type === 'application/pdf'
  const isImage = doc.mime_type.startsWith('image/')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '80vw', maxWidth: 960, height: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-medium truncate mr-4">{doc.file_name}</p>
          <div className="flex items-center gap-3 shrink-0">
            {url && (
              <a
                href={url}
                download={doc.file_name}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Close ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {!url && !error && (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <p>{error}</p>
              <button
                onClick={refreshUrl}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {url && isPdf && (
            // onError is not available on iframe; if the PDF is corrupt the viewer
            // simply shows a blank frame — the download link above is the fallback.
            <iframe src={url} className="w-full h-full border-0" title={doc.file_name} />
          )}

          {url && isImage && (
            <div className="h-full flex items-center justify-center p-4 bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={doc.file_name}
                className="max-w-full max-h-full object-contain rounded"
                onError={() => setError('Could not render image — use the download link above.')}
              />
            </div>
          )}

          {url && !isPdf && !isImage && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p>Preview not available for this file type.</p>
              <a
                href={url}
                download={doc.file_name}
                className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors font-medium"
              >
                <Download className="h-4 w-4" />
                Download {doc.file_name}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
