'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AgentCard } from './agent-card'
import { useInboxStore } from '@/lib/stores/inbox-store'
import type { AgentAction, AgentActionCategory } from '@/lib/types/agent'

interface ReviewQueuePreviewProps {
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

export function ReviewQueuePreview({ actions, totalCount }: ReviewQueuePreviewProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterChip>('all')
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)

  const { dismissedIds } = useInboxStore()

  const visible = actions
    .filter((a) => !dismissedIds.has(a.id))
    .filter((a) => activeFilter === 'all' || a.category === activeFilter)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'j') {
        setFocusedIndex((i) => Math.min((i ?? -1) + 1, visible.length - 1))
      } else if (e.key === 'k') {
        setFocusedIndex((i) => Math.max((i ?? visible.length) - 1, 0))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Needs your review</h2>
          <Badge variant="filled" className="text-xs">
            {totalCount} pending
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-5 pb-3 flex-wrap">
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

      <div className="px-2 pb-2 space-y-0.5">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            All caught up in this category.
          </p>
        ) : (
          visible.slice(0, 5).map((action, i) => (
            <AgentCard
              key={action.id}
              action={action}
              focused={focusedIndex === i}
              onEdit={(id) => console.log('edit', id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        <Link
          href="/inbox?category=agent-review"
          className="flex items-center gap-1 text-sm text-accent hover:underline font-medium"
        >
          View all in Inbox
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
