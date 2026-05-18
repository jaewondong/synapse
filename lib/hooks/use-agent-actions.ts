'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export function useAgentActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: () => apiClient.getAuditLog({ limit: 100 }),
    staleTime: 30_000,
  })
}
