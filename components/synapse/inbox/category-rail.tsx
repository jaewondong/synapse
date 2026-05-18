'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, MessageSquare, FlaskConical, CheckSquare, PenLine, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useState } from 'react'

export type InboxCategory = 'agent-review' | 'messages' | 'results' | 'tasks' | 'signatures'

interface CategoryItem {
  id: InboxCategory
  label: string
  icon: React.ElementType
  count: number
}

interface CategoryRailProps {
  active: InboxCategory
  counts: Record<InboxCategory, number>
}

const categoryItems: Omit<CategoryItem, 'count'>[] = [
  { id: 'agent-review', label: 'Agent review', icon: Sparkles },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'results', label: 'Results', icon: FlaskConical },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'signatures', label: 'Signatures', icon: PenLine },
]

const confidenceOptions = ['All', 'High only', 'Medium+', 'Low only']
const dateOptions = ['Today', 'This week', 'All']

export function CategoryRail({ active, counts }: CategoryRailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [confidenceFilter, setConfidenceFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('Today')

  const navigate = (id: InboxCategory) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', id)
    router.push(`/inbox?${params.toString()}`)
  }

  const isAgentReview = active === 'agent-review'

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        {/* Category list */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {categoryItems.map(({ id, label, icon: Icon }) => {
            const count = counts[id] ?? 0
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-agent-tint text-accent font-medium border-l-2 border-accent -ml-px pl-[9px]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-xs font-medium tabular-nums',
                      isActive ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Filters section */}
        <div className="border-t border-border">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Filters
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', filtersOpen && 'rotate-180')}
            />
          </button>

          {filtersOpen && (
            <div
              className={cn(
                'px-3 pb-3 space-y-4',
                !isAgentReview && 'opacity-50 pointer-events-none'
              )}
            >
              {!isAgentReview && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground">
                      Filters apply to Agent review only.
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Filters are per-category, coming to {active} soon
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Confidence filter */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Confidence</p>
                <div className="space-y-1">
                  {confidenceOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="confidence"
                        value={opt}
                        checked={confidenceFilter === opt}
                        onChange={() => setConfidenceFilter(opt)}
                        className="accent-accent"
                      />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date range filter */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Date range</p>
                <div className="space-y-1">
                  {dateOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="date"
                        value={opt}
                        checked={dateFilter === opt}
                        onChange={() => setDateFilter(opt)}
                        className="accent-accent"
                      />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
