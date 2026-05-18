'use client'

import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StubRow {
  id: string
  primary: string
  secondary: string
  timestamp: string
  unread: boolean
  tag?: string
}

interface CategoryStubListProps {
  categoryLabel: string
  rows: StubRow[]
  totalCount: number
}

export function CategoryStubList({ categoryLabel, rows, totalCount }: CategoryStubListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
        <span className="text-sm font-medium text-muted-foreground">{totalCount} items</span>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Mark all as read
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {rows.map((row) => (
          <button
            key={row.id}
            className="w-full flex items-start gap-3 px-6 py-4 hover:bg-muted/40 transition-colors text-left"
            onClick={() => console.log('open', row.id)}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full mt-1.5 shrink-0',
                row.unread ? 'bg-accent' : 'bg-transparent'
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className={cn('text-sm truncate', row.unread ? 'font-semibold' : 'font-medium')}>
                  {row.primary}
                </p>
                {row.tag && (
                  <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                    {row.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.secondary}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(row.timestamp)}
            </span>
          </button>
        ))}
      </div>

      {/* Coming soon notice */}
      <div className="mx-6 my-4 rounded-xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          Full <span className="font-medium">{categoryLabel}</span> functionality lands in a later
          session. Items here are read-only previews.
        </p>
      </div>
    </div>
  )
}

// Converters for each category's mock shape → StubRow
export function messagesToRows(
  items: Array<{ id: string; sender: string; subject: string; timestamp: string; unread: boolean; type: string }>
): StubRow[] {
  return items.map((m) => ({
    id: m.id,
    primary: m.sender,
    secondary: m.subject,
    timestamp: m.timestamp,
    unread: m.unread,
    tag: m.type === 'referral' ? 'Referral' : m.type === 'staff' ? 'Staff' : undefined,
  }))
}

export function resultsToRows(
  items: Array<{ id: string; testName: string; patientName: string; patientMrn: string; timestamp: string; unread: boolean; urgency: string }>
): StubRow[] {
  return items.map((r) => ({
    id: r.id,
    primary: r.testName,
    secondary: `${r.patientName} · MRN ${r.patientMrn}`,
    timestamp: r.timestamp,
    unread: r.unread,
    tag: r.urgency === 'urgent' ? 'Urgent' : undefined,
  }))
}

export function tasksToRows(
  items: Array<{ id: string; title: string; assignedBy: string; patientName?: string; timestamp: string; unread: boolean; dueDate?: string }>
): StubRow[] {
  return items.map((t) => ({
    id: t.id,
    primary: t.title,
    secondary: `Assigned by ${t.assignedBy}${t.dueDate ? ` · due ${t.dueDate}` : ''}`,
    timestamp: t.timestamp,
    unread: t.unread,
  }))
}

export function signaturesToRows(
  items: Array<{ id: string; documentType: string; patientName: string; patientMrn: string; timestamp: string; unread: boolean }>
): StubRow[] {
  return items.map((s) => ({
    id: s.id,
    primary: s.documentType,
    secondary: `${s.patientName} · MRN ${s.patientMrn}`,
    timestamp: s.timestamp,
    unread: s.unread,
  }))
}
