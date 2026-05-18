import { z } from 'zod/v4'

export const DecideSchema = z.object({
  operation: z.enum(['approve', 'reject', 'snooze']),
  reason: z.string().optional(),
})

export const BulkDecideSchema = z.object({
  ids: z.array(z.string()).min(1),
  operation: z.enum(['approve', 'reject', 'snooze']),
  reason: z.string().optional(),
})

export const AuditQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  operation: z.enum(['approve', 'reject', 'snooze', 'all']).default('all'),
  search: z.string().optional(),
  actionId: z.string().optional(),
})

export type DecideInput = z.infer<typeof DecideSchema>
export type BulkDecideInput = z.infer<typeof BulkDecideSchema>
export type AuditQuery = z.infer<typeof AuditQuerySchema>
