import type { DecideInput, BulkDecideInput } from './schemas'

export type DecisionResult = {
  id: string
  actionId: string
  operation: string
  reason: string | null
  decidedBy: string
  decidedAt: string
}

export type AuditEntry = {
  id: string
  actionId: string
  operation: string
  reason: string | null
  decidedBy: string
  decidedAt: string
  action: {
    id: string
    agentName: string
    confidence: string
    summary: string
    detail: string
    patientName: string
    patientMrn: string
    category: string
    actionTimestamp: string
  }
}

export type AuditPage = {
  items: AuditEntry[]
  total: number
  page: number
  limit: number
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json() as Promise<T>
}

export const apiClient = {
  decideAction: (id: string, body: DecideInput) =>
    fetchJson<DecisionResult>(`/api/actions/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  bulkDecide: (body: BulkDecideInput) =>
    fetchJson<DecisionResult[]>('/api/actions/bulk-decide', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAuditLog: (params: {
    page?: number
    limit?: number
    operation?: string
    search?: string
  }) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.operation && params.operation !== 'all') qs.set('operation', params.operation)
    if (params.search) qs.set('search', params.search)
    return fetchJson<AuditPage>(`/api/audit?${qs.toString()}`)
  },

  getActionDecisions: (actionId: string) =>
    fetchJson<DecisionResult[]>(`/api/audit/${actionId}`),
}
