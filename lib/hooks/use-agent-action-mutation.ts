'use client'

import { toast } from 'sonner'
import { useInboxStore } from '@/lib/stores/inbox-store'

type AgentOperation = 'approve' | 'reject' | 'snooze' | 'edit'

interface MutationOptions {
  onSuccess?: (id: string) => void
  onError?: (id: string) => void
}

function simulateLatency() {
  return new Promise<void>((resolve) =>
    setTimeout(resolve, 150 + Math.random() * 250)
  )
}

function simulateFailure() {
  return Math.random() < 0.05
}

export function useAgentActionMutation(opts?: MutationOptions) {
  const { dismissAction, restoreAction, recordIndividualApproval } = useInboxStore()

  const mutate = async (id: string, operation: AgentOperation) => {
    // Optimistic: remove from queue immediately
    if (operation === 'approve' || operation === 'reject' || operation === 'snooze') {
      dismissAction(id)
    }

    // Velocity check for individual approvals
    if (operation === 'approve') {
      const tooFast = recordIndividualApproval()
      if (tooFast) {
        toast.warning(
          'Slow down — approvals are being recorded faster than humanly readable. Take a breath.',
          { duration: 6000 }
        )
      }
    }

    await simulateLatency()

    if (simulateFailure()) {
      // Roll back optimistic update
      if (operation === 'approve' || operation === 'reject' || operation === 'snooze') {
        restoreAction(id)
      }
      opts?.onError?.(id)
      toast.error('Action failed — item restored to queue.', {
        action: {
          label: 'Dismiss',
          onClick: () => dismissAction(id),
        },
        duration: 8000,
      })
      return
    }

    opts?.onSuccess?.(id)
  }

  const mutateMany = async (
    ids: string[],
    operation: AgentOperation,
    onRollback?: () => void
  ) => {
    ids.forEach((id) => {
      if (operation === 'approve' || operation === 'reject' || operation === 'snooze') {
        dismissAction(id)
      }
    })

    await simulateLatency()

    const failed = ids.filter(() => simulateFailure())
    if (failed.length > 0) {
      failed.forEach((id) => restoreAction(id))
      onRollback?.()
      toast.error(`${failed.length} action${failed.length > 1 ? 's' : ''} failed — items restored.`, {
        duration: 8000,
      })
    }
  }

  return { mutate, mutateMany }
}
