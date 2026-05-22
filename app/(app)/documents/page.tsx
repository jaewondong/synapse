'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { DocumentList } from '@/components/synapse/documents/document-list'
import { UploadDialog } from '@/components/synapse/documents/upload-dialog'
import type { PatientDocument } from '@/components/synapse/documents/types'

export default function DocumentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  function handleUploaded(_doc: PatientDocument) {
    setDialogOpen(false)
    setRefreshTrigger((n) => n + 1)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Patient documents across all departments</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <DocumentList
          onUploadClick={() => setDialogOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      </div>

      <UploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
