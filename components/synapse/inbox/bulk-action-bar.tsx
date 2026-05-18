'use client'

import * as React from 'react'
import { Check, X, Clock, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/dialog'
import { ReasonCapture } from './reason-capture'
import type { AgentAction } from '@/lib/types/agent'

interface BulkActionBarProps {
  selectedIds: Set<string>
  actions: AgentAction[]
  onBulkApprove: (ids: string[], reason: string) => void
  onBulkReject: (ids: string[], reason: string) => void
  onBulkSnooze: (ids: string[], reason: string) => void
  onClearSelection: () => void
}

type PendingBulk = { op: 'approve' | 'reject' | 'snooze'; ids: string[] }

export function BulkActionBar({
  selectedIds,
  actions,
  onBulkApprove,
  onBulkReject,
  onBulkSnooze,
  onClearSelection,
}: BulkActionBarProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingBulk, setPendingBulk] = React.useState<PendingBulk | null>(null)
  const count = selectedIds.size

  if (count === 0) return null

  const selectedActions = actions.filter((a) => selectedIds.has(a.id))
  const nonHighCount = selectedActions.filter((a) => a.confidence !== 'high').length

  const handleApproveClick = () => {
    const allHighAndSmall = nonHighCount === 0 && count <= 10
    if (!allHighAndSmall) {
      setConfirmOpen(true)
    } else {
      setPendingBulk({ op: 'approve', ids: Array.from(selectedIds) })
    }
  }

  const handleConfirmApproveAll = () => {
    setConfirmOpen(false)
    setPendingBulk({ op: 'approve', ids: Array.from(selectedIds) })
  }

  const handleReasonConfirm = (reason: string) => {
    if (!pendingBulk) return
    const { op, ids } = pendingBulk
    setPendingBulk(null)
    if (op === 'approve') onBulkApprove(ids, reason)
    else if (op === 'reject') onBulkReject(ids, reason)
    else onBulkSnooze(ids, reason)
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-agent-tint px-3 py-2">
          <span className="text-xs font-medium text-accent mr-1">
            {count} selected
          </span>
          <Button size="sm" className="h-7 px-2.5 text-xs" onClick={handleApproveClick}>
            <Check className="h-3 w-3 mr-1" />
            Approve ({count})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setPendingBulk({ op: 'reject', ids: Array.from(selectedIds) })}
          >
            <X className="h-3 w-3 mr-1" />
            Reject ({count})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs"
            onClick={() => setPendingBulk({ op: 'snooze', ids: Array.from(selectedIds) })}
          >
            <Clock className="h-3 w-3 mr-1" />
            Snooze ({count})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground ml-auto"
            onClick={onClearSelection}
          >
            <Square className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>

        {pendingBulk && (
          <ReasonCapture
            operation={pendingBulk.op}
            onConfirm={handleReasonConfirm}
            onCancel={() => setPendingBulk(null)}
          />
        )}
      </div>

      {/* Anti-rubber-stamp confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review before bulk approve</AlertDialogTitle>
            <AlertDialogDescription>
              {nonHighCount} of the {count} selected item{count !== 1 ? 's' : ''}{' '}
              {nonHighCount !== 1 ? 'have' : 'has'} medium or low confidence. Approving in bulk
              will skip per-item review. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Review individually
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmApproveAll}>
              Approve all anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
