'use client'

import * as React from 'react'
import { ChevronDown, HelpCircle, Check, Pencil, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReasonCapture } from '@/components/synapse/inbox/reason-capture'
import { useDecideAction } from '@/lib/hooks/use-decide-action'
import type { AgentAction } from '@/lib/types/agent'

interface AgentCardProps {
  action: AgentAction
  focused?: boolean
  selected?: boolean
  selectable?: boolean
  /** External trigger from parent (e.g., keyboard hotkey) */
  expandedFor?: 'approve' | 'reject' | null
  onSelectChange?: (id: string, checked: boolean) => void
  /** Notification-only callback — mutation is handled internally */
  onApprove?: (id: string) => void
  /** Notification-only callback — mutation is handled internally */
  onReject?: (id: string) => void
  onEdit?: (id: string) => void
  onWhyClick?: (id: string) => void
  onSnooze?: (id: string, duration: string) => void
  /** Called when the reason form is closed (confirmed or cancelled) */
  onExpandedClose?: (id: string) => void
}

const confidenceColors: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
}

const snoozeDurations = ['1 hour', '4 hours', 'Tomorrow', 'Next week']

export function AgentCard({
  action,
  focused,
  selected,
  selectable,
  expandedFor,
  onSelectChange,
  onApprove,
  onReject,
  onEdit,
  onWhyClick,
  onSnooze,
  onExpandedClose,
}: AgentCardProps) {
  const [pendingOp, setPendingOp] = React.useState<'approve' | 'reject' | null>(null)
  const { mutate } = useDecideAction()

  // Sync external hotkey trigger
  React.useEffect(() => {
    if (expandedFor) setPendingOp(expandedFor)
  }, [expandedFor])

  const handleConfirm = async (reason: string) => {
    const op = pendingOp!
    setPendingOp(null)
    onExpandedClose?.(action.id)
    await mutate(action.id, op, reason)
    if (op === 'approve') onApprove?.(action.id)
    else if (op === 'reject') onReject?.(action.id)
  }

  const handleCancel = () => {
    setPendingOp(null)
    onExpandedClose?.(action.id)
  }

  const handleSnooze = async (duration: string) => {
    await mutate(action.id, 'snooze', `Snoozed: ${duration}`)
    onSnooze?.(action.id, duration)
  }

  return (
    <div
      className={cn(
        'rounded-lg px-3 py-3 transition-colors group',
        focused
          ? 'ring-1 ring-accent ring-inset bg-agent-tint/60'
          : 'hover:bg-agent-tint/60',
        selected && 'bg-agent-tint border-l-2 border-accent -ml-px pl-[11px]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox (Inbox only) */}
        {selectable && (
          <div className="flex items-center pt-0.5 shrink-0">
            <Checkbox
              checked={selected ?? false}
              onCheckedChange={(checked) =>
                onSelectChange?.(action.id, checked === true)
              }
              aria-label={`Select action for ${action.patientName}`}
            />
          </div>
        )}

        {/* Agent glyph + confidence dot */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
          <span className="text-accent text-base leading-none">⚡</span>
          <span
            className={cn('h-2 w-2 rounded-full', confidenceColors[action.confidence])}
            title={`${action.confidence} confidence`}
          />
        </div>

        {/* Summary + detail */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{action.agentName}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
            {action.summary}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.detail}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-2 text-muted-foreground"
            onClick={() => onWhyClick ? onWhyClick(action.id) : undefined}
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Why?
          </Button>
          <Button
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setPendingOp('approve')}
          >
            <Check className="h-3 w-3 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => onEdit?.(action.id)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => setPendingOp('reject')}
          >
            <X className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-muted-foreground">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {snoozeDurations.map((d) => (
                <DropdownMenuItem key={d} onClick={() => handleSnooze(d)}>
                  <Clock className="h-3.5 w-3.5" />
                  Snooze {d}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => console.log('delegate', action.id)}>
                Delegate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('reassign', action.id)}>
                Reassign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline reason capture */}
      {pendingOp && (
        <ReasonCapture
          operation={pendingOp}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
