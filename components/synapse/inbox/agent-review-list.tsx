'use client'

import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { cn } from '@/lib/utils'
import { AgentCard } from '@/components/synapse/today/agent-card'
import { BulkActionBar } from './bulk-action-bar'
import { WhyDrawer } from './why-drawer'
import { useInboxStore } from '@/lib/stores/inbox-store'
import { useBulkDecide } from '@/lib/hooks/use-bulk-decide'
import type { AgentAction, AgentActionCategory } from '@/lib/types/agent'

interface AgentReviewListProps {
  actions: AgentAction[]
  totalCount: number
}

type FilterChip = 'all' | AgentActionCategory

const chips: { label: string; value: FilterChip }[] = [
  { label: 'All', value: 'all' },
  { label: 'Eligibility', value: 'eligibility' },
  { label: 'Messages', value: 'messages' },
  { label: 'Documents', value: 'documents' },
  { label: 'Tasks', value: 'tasks' },
]

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 px-3 py-3 animate-pulse">
      <div className="flex flex-col gap-2 pt-1">
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-2 w-2 rounded-full bg-muted" />
      </div>
      <div className="flex flex-col gap-2 pt-0.5 shrink-0">
        <div className="h-3 w-3 rounded-full bg-muted" />
        <div className="h-2 w-2 rounded-full bg-muted" />
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
      </div>
    </div>
  )
}

export function AgentReviewList({ actions, totalCount }: AgentReviewListProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterChip>('all')
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const [expandedCard, setExpandedCard] = React.useState<{ id: string; op: 'approve' | 'reject' } | null>(null)
  const [whyActionId, setWhyActionId] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const { dismissedIds, selectedIds, toggleSelect, clearSelection } = useInboxStore()
  const { mutate: bulkMutate } = useBulkDecide()

  const visible = actions
    .filter((a) => !dismissedIds.has(a.id))
    .filter((a) => activeFilter === 'all' || a.category === activeFilter)

  const focusedIndex = focusedId ? visible.findIndex((a) => a.id === focusedId) : -1
  const whyAction = whyActionId ? actions.find((a) => a.id === whyActionId) ?? null : null

  React.useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return
    const card = listRef.current.children[focusedIndex] as HTMLElement | undefined
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedIndex])

  const moveFocus = (delta: 1 | -1) => {
    if (visible.length === 0) return
    const next = Math.max(0, Math.min(visible.length - 1, focusedIndex + delta))
    setFocusedId(visible[next]?.id ?? null)
  }

  const opts = { preventDefault: true, enableOnFormTags: false }

  useHotkeys('j', () => moveFocus(1), opts, [visible, focusedIndex])
  useHotkeys('k', () => moveFocus(-1), opts, [visible, focusedIndex])
  useHotkeys('space', () => {
    if (focusedId) toggleSelect(focusedId)
  }, { ...opts, preventDefault: true }, [focusedId])
  useHotkeys('a', () => {
    if (focusedId && !expandedCard) setExpandedCard({ id: focusedId, op: 'approve' })
  }, opts, [focusedId, expandedCard])
  useHotkeys('r', () => {
    if (focusedId && !expandedCard) setExpandedCard({ id: focusedId, op: 'reject' })
  }, opts, [focusedId, expandedCard])
  useHotkeys('e', () => {
    if (focusedId) console.log('edit', focusedId)
  }, opts, [focusedId])
  useHotkeys('w', () => {
    if (focusedId) setWhyActionId(focusedId)
  }, opts, [focusedId])
  useHotkeys('s', () => {
    if (focusedId) console.log('snooze', focusedId)
  }, opts, [focusedId])
  useHotkeys('escape', () => {
    if (expandedCard) {
      setExpandedCard(null)
    } else {
      clearSelection()
      setFocusedId(null)
    }
  }, opts, [expandedCard])
  useHotkeys('shift+a', () => {
    if (selectedIds.size > 0) {
      bulkMutate(Array.from(selectedIds), 'approve')
      clearSelection()
    }
  }, opts, [selectedIds])
  useHotkeys('shift+r', () => {
    if (selectedIds.size > 0) {
      bulkMutate(Array.from(selectedIds), 'reject')
      clearSelection()
    }
  }, opts, [selectedIds])

  const handleBulkApprove = (ids: string[], reason: string) => {
    bulkMutate(ids, 'approve', reason)
    clearSelection()
  }
  const handleBulkReject = (ids: string[], reason: string) => {
    bulkMutate(ids, 'reject', reason)
    clearSelection()
  }
  const handleBulkSnooze = (ids: string[], reason: string) => {
    bulkMutate(ids, 'snooze', reason)
    clearSelection()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {visible.length} item{visible.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' && (
              <span className="ml-1 text-muted-foreground/60">(filtered)</span>
            )}
          </span>
        </div>

        {selectedIds.size > 0 && (
          <BulkActionBar
            selectedIds={selectedIds}
            actions={visible}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            onBulkSnooze={handleBulkSnooze}
            onClearSelection={clearSelection}
          />
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
                activeFilter === chip.value
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-muted text-muted-foreground border-transparent hover:border-border'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-24 text-center px-6">
            <p className="text-base font-medium">Inbox zero in this category. ✓</p>
            <p className="text-sm text-muted-foreground mt-1">
              Auto-completed actions move to Today&apos;s recent activity.
            </p>
          </div>
        ) : (
          <div className="py-2 px-2 space-y-0.5">
            {visible.map((action) => (
              <AgentCard
                key={action.id}
                action={action}
                selectable
                selected={selectedIds.has(action.id)}
                focused={focusedId === action.id}
                expandedFor={
                  expandedCard?.id === action.id ? expandedCard.op : null
                }
                onSelectChange={(id, checked) => {
                  toggleSelect(id)
                  if (checked) setFocusedId(id)
                }}
                onApprove={(id) => setFocusedId(id)}
                onReject={(id) => setFocusedId(id)}
                onEdit={(id) => console.log('edit', id)}
                onWhyClick={(id) => setWhyActionId(id)}
                onExpandedClose={() => setExpandedCard(null)}
              />
            ))}
          </div>
        )}
      </div>

      <WhyDrawer
        action={whyAction}
        open={whyActionId !== null}
        onClose={() => setWhyActionId(null)}
      />
    </div>
  )
}

export function AgentReviewListSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-3 space-y-2">
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        <div className="flex gap-1.5">
          {[80, 72, 68, 72, 56].map((w, i) => (
            <div key={i} className={`h-5 rounded-full bg-muted animate-pulse`} style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="py-2 px-2 space-y-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
