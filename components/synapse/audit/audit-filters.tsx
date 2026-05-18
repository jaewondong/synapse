'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditFiltersProps {
  operation: string
  search: string
  onOperationChange: (op: string) => void
  onSearchChange: (s: string) => void
}

const ops = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approve' },
  { label: 'Rejected', value: 'reject' },
  { label: 'Snoozed', value: 'snooze' },
]

export function AuditFilters({
  operation,
  search,
  onOperationChange,
  onSearchChange,
}: AuditFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Operation filter chips */}
      <div className="flex items-center gap-1.5">
        {ops.map((op) => (
          <button
            key={op.value}
            onClick={() => onOperationChange(op.value)}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
              operation === op.value
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-muted text-muted-foreground border-transparent hover:border-border'
            )}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex items-center ml-auto">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patient, agent, summary…"
          className="h-7 w-56 rounded-md border border-border bg-transparent pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
  )
}
