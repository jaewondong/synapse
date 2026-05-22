---
name: synapse-data-flow
description: How data moves through Synapse — server fetch pattern, optimistic decisions, SSE agent streaming
metadata:
  type: project
---

Primary data flows:

1. **Patient Chart**: Server Component calls `getChartData(mrn)` (Prisma + Supabase parallel), passes `ChartData` object to `ChartShell`. No client-side data fetching on chart load.

2. **Agent Decisions**: Optimistic — `dismissAction(id)` in Zustand first, then `POST /api/actions/:id/decide`, rollback on failure. Invalidates `['audit']` query on success.

3. **Scheduling Agent**: Client sends history to `POST /api/scheduling-agent`, receives SSE stream of `{type: text|tool_call|tool_result|done|error}` events. Write tool results invalidate `['appointments']` React Query cache so calendar re-fetches.

4. **Emails**: Supabase Realtime webhook hits `POST /api/webhooks/appointments`. Always inserts `notification_events` row first (audit trail), then calls Resend. Returns 200 even on failure.

5. **Messages**: `MessagesTab` queries Supabase directly (browser client). Thread/message state is local useState, not React Query.

**Why:** The split between React Query (appointments, audit) and local useState (messages) reflects which data needs cross-component cache invalidation vs. which is self-contained.
