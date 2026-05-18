'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAuditLog } from '@/lib/hooks/use-audit-log'
import { AuditFilters } from './audit-filters'
import { AuditRowExpanded } from './audit-row-expanded'
import { DecisionPill } from './decision-pill'
import type { AuditEntry } from '@/lib/api/client'

const PAGE_SIZE = 50

function formatRelative(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString()
}

export function AuditTable() {
  const [page, setPage] = React.useState(1)
  const [operation, setOperation] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  const parentRef = React.useRef<HTMLDivElement>(null)

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  React.useEffect(() => { setPage(1) }, [operation, debouncedSearch])

  const { data, isLoading, isPlaceholderData } = useAuditLog({
    page,
    limit: PAGE_SIZE,
    operation,
    search: debouncedSearch || undefined,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Virtualizer over "rows" — each entry can have an expanded detail row
  const flatRows: Array<{ type: 'row'; entry: AuditEntry } | { type: 'expanded'; entry: AuditEntry }> =
    React.useMemo(() => {
      const result: typeof flatRows = []
      for (const entry of items) {
        result.push({ type: 'row', entry })
        if (expandedIds.has(entry.id)) {
          result.push({ type: 'expanded', entry })
        }
      }
      return result
    }, [items, expandedIds])

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (flatRows[i].type === 'expanded' ? 180 : 48),
    overscan: 8,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="border-b border-border px-6 py-3">
        <AuditFilters
          operation={operation}
          search={search}
          onOperationChange={setOperation}
          onSearchChange={setSearch}
        />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1.5rem_1fr_1fr_7rem_8rem_7rem] gap-3 px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        <div />
        <div>Patient / Action</div>
        <div>Agent</div>
        <div>Category</div>
        <div>Decision</div>
        <div>When</div>
      </div>

      {/* Virtual scroll body */}
      <div className="flex-1 overflow-auto" ref={parentRef}>
        {isLoading && items.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            No decisions recorded yet.
          </div>
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = flatRows[vRow.index]
              if (!row) return null

              if (row.type === 'expanded') {
                return (
                  <div
                    key={`exp-${row.entry.id}`}
                    style={{
                      position: 'absolute',
                      top: vRow.start,
                      left: 0,
                      right: 0,
                      height: vRow.size,
                    }}
                  >
                    <AuditRowExpanded entry={row.entry} />
                  </div>
                )
              }

              const entry = row.entry
              const isExpanded = expandedIds.has(entry.id)

              return (
                <div
                  key={entry.id}
                  style={{
                    position: 'absolute',
                    top: vRow.start,
                    left: 0,
                    right: 0,
                    height: vRow.size,
                  }}
                  className={`grid grid-cols-[1.5rem_1fr_1fr_7rem_8rem_7rem] gap-3 items-center px-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/40 text-sm ${isExpanded ? 'bg-muted/20' : ''}`}
                  onClick={() => toggleExpanded(entry.id)}
                >
                  <div className="text-muted-foreground/60">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{entry.action.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.action.summary}</p>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{entry.action.agentName}</div>
                  <div className="text-xs text-muted-foreground capitalize">{entry.action.category}</div>
                  <div>
                    <DecisionPill operation={entry.operation} />
                  </div>
                  <div className="text-xs text-muted-foreground">{formatRelative(entry.decidedAt)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} decisions</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || isPlaceholderData}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
