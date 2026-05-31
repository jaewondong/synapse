# Key Design Patterns and Conventions

## Server/Client Component Boundary

The project follows a strict convention for where the server/client boundary sits:

- **`page.tsx` files** are Server Components. They fetch data (DB queries, search params) and pass a fully-typed data object as props to a client shell component. They never import from `lib/stores/` or use React hooks.
- **Shell components** (`*-shell.tsx` files) are always `'use client'`. They own all interactive state for their feature area. They receive data as props and never re-fetch it on initial render.
- **API routes** are pure server code. They never import client-side utilities.

This separation keeps the initial render fast (data fetched server-side, no client-side loading states for primary content) while keeping interactive behavior in client components.

## Optimistic UI Pattern

The agent decision flow uses a consistent optimistic update pattern:

1. Immediately update local state (dismiss the item from the visible list)
2. Fire the API call
3. On success: invalidate related queries
4. On failure: roll back local state + show a toast with a manual dismiss option

This is implemented manually with Zustand (not React Query's built-in optimistic updates) because the dismissed state needs to be shared across components (Today preview + Inbox list) that are not in the same query cache.

## Anti-Rubber-Stamp Velocity Detection

`useInboxStore.recordIndividualApproval()` tracks the timestamps of the last 10 individual approvals. If the median interval falls below 800ms, the next approval triggers a warning toast: "Slow down — approvals are being recorded faster than humanly readable."

This is a HIPAA-adjacent safety mechanism to prevent accidental bulk approval via rapid keyboard shortcuts.

## URL-Driven State for Deep Links

Both the Inbox and Schedule pages are designed to be fully deep-linkable. The server component page reads all relevant state from `searchParams`, so a URL like:

```
/inbox?category=messages&thread=abc123
```

...restores the exact view server-side, with no client-side loading flash.

The pattern for state changes within a feature: `router.push()` to update the URL (which re-renders the server component with new props) rather than local `setState`. This keeps the back button working correctly.

For "housekeeping" URL changes (stripping handoff params, updating selected thread without a back-button entry), `window.history.replaceState` is used directly.

## Provenance / Audit Trail for AI-Modified Data

Any data record that was created or modified by an AI agent carries provenance metadata:
- `modifiedByType: 'agent' | 'human'`
- `modifiedByAgentName: string` (the agent's name)
- `modifiedAt: string` (timestamp)

These fields are present on `Insurance`, `Problem`, `Medication`, and `AgentActionRecord` types. The `AuditStrip` component renders this as a small "Modified by [Agent Name]" badge wherever agent-modified data appears. This makes AI provenance visible inline in the chart without requiring a separate audit view.

## Zod for API Validation

All API route handlers validate request bodies and query parameters with Zod v4 (`zod/v4` import path). Schemas are centralized in `lib/api/schemas.ts`. Routes use `safeParse()` and return a 400 with the Zod error message on failure — they never throw from validation.

## React Query for Remote State

TanStack React Query is used for any data that is fetched remotely and needs to be invalidated across components:
- Appointments (calendar + agent chat share the same cache key)
- Audit log (invalidated after any decision)

Direct Supabase calls in component effects are used for message threads and messages — these are not in the React Query cache, consistent with their local-state management approach in `MessagesTab`.

## PHI Safety Gates

Three mechanisms protect PHI:

1. **PHI redact toggle**: The `TopBar` has an eye/eye-off button that sets `localStorage['synapse-phi-hidden']`. Components that display PHI can read this to blur or redact sensitive fields (implementation is partial — the toggle exists but full PHI blurring is not yet implemented across all components).

2. **`MESSAGING_REAL_DELIVERY` flag**: Outbound messages and emails default to disabled in non-production environments. The `lib/flags.ts` check gates real delivery.

3. **`STORAGE_IS_PHI_ELIGIBLE` flag**: Document storage is only considered HIPAA-eligible when this flag is explicitly set, requiring a Supabase BAA to be in place.

## Error Handling Conventions

- API route errors return `{ error: string }` with an appropriate HTTP status code
- Client-side errors surface via Sonner toasts (imported from `sonner`)
- The email webhook intentionally returns 200 on email send failure — the failure is logged to `notification_events` and Supabase will not retry the webhook
- The scheduling agent route catches errors and emits them as `{ type: 'error', message }` SSE events rather than closing the stream with a non-200 status

## Keyboard Navigation

The app has comprehensive keyboard support:
- `?` — show keyboard shortcuts sheet
- `⌘K` — open command palette
- `G T/I/S/P/G/A` — vi-style navigation to Today/Inbox/Schedule/Patients/Agents/Audit
- `⌘P` — patient lookup
- In Inbox agent review: `J/K` to navigate, `A/R` to approve/reject, `Space` to select, `Shift+A/R` for bulk, `W` for "Why?" drawer, `Escape` to cancel/clear

Navigation hotkeys are implemented at two levels:
- `HotkeysProvider` (wraps entire app): global navigation shortcuts (G-chords, ⌘P)
- `AgentReviewList`: list-specific action shortcuts (J, K, A, R, Space, etc.)

The G-chord implementation uses a `useRef` timestamp: pressing G records the time, and a subsequent `T/I/S/P` within 600ms triggers navigation.

## Soundex for Patient Name Search

`lib/db/patients.ts` includes a custom Soundex implementation for fuzzy patient name matching. The search loads all patients from SQLite (the dataset is small — ~50 patients) and filters in JavaScript using Soundex phonetic codes. This avoids a dependency on SQLite FTS or a separate search service for the demo scale.

## File and Folder Structure

```
app/                    — Next.js App Router (pages + API routes)
  (app)/               — Route group for authenticated app pages
  api/                 — API Route Handlers

components/
  synapse/             — Feature-specific components, organized by page/feature
    app-shell/         — TopBar, Sidebar, CommandPalette, HotkeysProvider
    chart/             — PatientHeader, ChartShell, DepartmentView, etc.
    inbox/             — InboxShell, AgentReviewList, BulkActionBar, WhyDrawer, etc.
    messages/          — MessagesTab, MessageReadingPane, MessageBubble, etc.
    today/             — TodayGreeting, AgentCard, ReviewQueuePreview, etc.
    schedule/          — ScheduleShell, WeekCalendar, AgentChat, etc.
    lookup/            — LookupShell
    documents/         — DocumentList, DocumentViewer, UploadDialog
    audit/             — AuditTable, AuditFilters, DecisionPill
  providers/           — React context providers (QueryProvider)
  ui/                  — Radix UI + CVA primitives (Badge, Button, etc.)

lib/
  agents/              — Anthropic agent implementation (scheduling-agent.ts)
  api/                 — Typed API client + Zod schemas
  db/                  — Prisma client + data access functions (patients.ts)
  email/               — Resend client, templates, send logic, types
  hooks/               — Custom React hooks (use-agent-actions, use-decide-action, etc.)
  mock/                — Static mock data (agent-actions, inbox, today, patient-chart)
  stores/              — Zustand stores (inbox-store, chart-store)
  supabase/            — Supabase client factories (client.ts, server.ts)
  types/               — TypeScript interfaces (agent.ts, chart.ts, patient.ts)
  flags.ts             — Feature flags
  storage.ts           — Storage bucket constants
  utils.ts             — cn() and formatRelativeTime()

prisma/
  seed.ts              — Seeds agent actions into SQLite
  (schema lives in lib/generated/prisma/)

scripts/
  seed-mock-patients.ts
  seed-message-threads.ts
```
