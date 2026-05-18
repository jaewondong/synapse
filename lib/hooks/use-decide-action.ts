'use client'

import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useInboxStore } from '@/lib/stores/inbox-store'
import { apiClient } from '@/lib/api/client'

type Operation = 'approve' | 'reject' | 'snooze'

export function useDecideAction() {
  const queryClient = useQueryClient()
  const { dismissAction, restoreAction, recordIndividualApproval } = useInboxStore()

  const mutate = async (id: string, operation: Operation, reason?: string) => {
    dismissAction(id)

    if (operation === 'approve') {
      const tooFast = recordIndividualApproval()
      if (tooFast) {
        toast.warning(
          'Slow down — approvals are being recorded faster than humanly readable. Take a breath.',
          { duration: 6000 }
        )
      }
    }

    try {
      await apiClient.decideAction(id, { operation, reason })
      queryClient.invalidateQueries({ queryKey: ['audit'] })
    } catch {
      restoreAction(id)
      toast.error('Action failed — item restored to queue.', {
        action: { label: 'Dismiss', onClick: () => dismissAction(id) },
        duration: 8000,
      })
    }
  }

  return { mutate }
}
