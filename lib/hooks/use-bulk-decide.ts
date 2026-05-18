'use client'

import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useInboxStore } from '@/lib/stores/inbox-store'
import { apiClient } from '@/lib/api/client'

type Operation = 'approve' | 'reject' | 'snooze'

export function useBulkDecide() {
  const queryClient = useQueryClient()
  const { dismissAction, restoreAction } = useInboxStore()

  const mutate = async (ids: string[], operation: Operation, reason?: string) => {
    ids.forEach((id) => dismissAction(id))

    try {
      await apiClient.bulkDecide({ ids, operation, reason })
      queryClient.invalidateQueries({ queryKey: ['audit'] })
    } catch {
      ids.forEach((id) => restoreAction(id))
      toast.error(`Bulk ${operation} failed — items restored.`, { duration: 8000 })
    }
  }

  return { mutate }
}
