import { Suspense } from 'react'
import { AuditTable } from '@/components/synapse/audit/audit-table'

export default function AuditPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every agent-action decision — who decided, when, and why.
        </p>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading audit log…
            </div>
          }
        >
          <AuditTable />
        </Suspense>
      </div>
    </div>
  )
}
