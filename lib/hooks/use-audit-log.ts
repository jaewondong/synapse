'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

interface UseAuditLogParams {
  page?: number
  limit?: number
  operation?: string
  search?: string
}

export function useAuditLog(params: UseAuditLogParams = {}) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => apiClient.getAuditLog(params),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}
