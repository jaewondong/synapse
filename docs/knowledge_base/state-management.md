# State Management

Synapse uses three distinct layers of state, each with a clear scope.

---

## 1. Zustand Stores (Cross-Component Global State)

Two Zustand v5 stores handle state that needs to be shared across components that are not in a direct parent-child relationship.

### `useInboxStore` (`lib/stores/inbox-store.ts`)

Scope: Inbox page + Today review queue preview (dismissed items sync between both)

| Field | Type | Purpose |
|---|---|---|
| `dismissedIds` | `Set<string>` | IDs of agent actions hidden from the visible list after a decision. Shared between the Inbox list and Today's queue preview so they stay in sync. |
| `selectedIds` | `Set<string>` | Currently checked cards for bulk operations |
| `focusedId` | `string \| null` | Which card has keyboard focus |
| `recentApprovalTimestamps` | `number[]` | Last 10 individual approval timestamps for rubber-stamp detection |

Key behavior: `recordIndividualApproval()` returns `true` (and triggers a warning toast) if the median interval between the last several approvals falls below 800ms. This is an anti-rubber-stamp safety mechanism.

The store is the source of truth for which items are visible. The pattern is:
1. User approves/rejects → `dismissAction(id)` immediately (optimistic)
2. API call fires
3. On API error → `restoreAction(id)` (rollback)

### `useChartStore` (`lib/stores/chart-store.ts`)

Scope: Patient chart navigation safety

| Field | Type | Purpose |
|---|---|---|
| `recentCharts` | `ChartHistoryEntry[]` | Last 3 charts opened (mrn, name, dob, timestamp) |
| `wrongPatientWarning` | `{ name, dob } \| null` | Populated when A→B→A pattern is detected |

`recordChartOpen(mrn, name, dob)` is called by `WrongPatientGuard` on every chart open. The store detects the pattern where a user opens chart A, then chart B, then chart A again within 10 seconds and returns `{ showWarning: true }`. The guard then fires a toast. This catches the common clinical error of ordering for the wrong patient after briefly switching charts.

---

## 2. TanStack React Query (Server State Cache)

`QueryProvider` (root layout) provides a singleton `QueryClient`. Default config: `staleTime: 30_000`, `retry: 1`.

Active queries:

| Query Key | Source | Invalidated By |
|---|---|---|
| `['appointments', dateFrom, dateTo]` | `GET /api/appointments` | Scheduling agent write tools (`create_appointment`, `reschedule_appointment`, `cancel_appointment`) |
| `['audit']` | `GET /api/audit` | Any `useDecideAction` or `useBulkDecide` success |
| `['actions']` | `GET /api/audit?limit=100` | Not currently invalidated (uses staleTime) |

React Query is **not** used for messages or document lists — those use local `useState` with direct Supabase calls.

---

## 3. Local Component State (useState)

Most interactive state lives directly in the "shell" client components:

### `AgentReviewList`
- `activeFilter` — current category chip filter
- `focusedId` — keyboard-focused card ID
- `expandedCard` — `{ id, op }` when a reason form is open via hotkey

### `MessagesTab`
- `threads` — full thread list (fetched from Supabase on mount)
- `threadMessages` — messages for the selected thread
- `loadingThreads` / `loadingMessages` — loading states
- `composePatient` — patient context when composing a new thread
- `activeDraft` — current reply text (synced to module-level `draftStore` Map)

### `ScheduleShell`
- `patient` — current patient context (name, mrn, etc.)
- `weekStart` — current calendar week
- `proposedSlot` / `bookedSlot` — agent-proposed and confirmed appointment slots

### `LookupShell`
- `name`, `dob`, `mrn` — search field values
- `results` — search results array
- `focusedIndex` — keyboard navigation index

---

## 4. URL as State

The Inbox and Schedule pages use URL search parameters as state, which makes the current view bookmarkable and supports back/forward navigation.

**Inbox URL params:**
- `category` — active inbox category (`agent-review` | `messages` | `results` | `tasks` | `signatures`)
- `thread` — selected message thread ID
- `patient_mrn` — handoff param to open messages for a specific patient (stripped after processing)
- `compose` — `'new'` to force new-compose mode
- `return_to` — URL to navigate back to after sending a message

**Schedule URL params:**
- `patient_mrn` — patient context to load
- `intent` — booking intent
- `return_to` — URL for "Back to chart" action

URL params are read by the Server Component page (`await searchParams`) and passed as props to the client shell. The shell never reads `useSearchParams` for initial render — it receives them as props. Navigation within the feature (e.g., selecting a thread) uses `router.push()` to update the URL.

---

## 5. Module-Level State (Non-React)

Two instances of state intentionally live outside React:

### `draftStore` (in `MessagesTab.tsx`)
```typescript
const draftStore = new Map<string, string>()
```
A module-level Map that persists reply drafts across thread switches within a browser session. Survives component remounts but is cleared on page reload. Avoids losing an in-progress reply when the user clicks another thread.

### `openedThreads` (in `MessagesTab.tsx`)
```typescript
const openedThreads = new Set<string>()
```
Tracks which thread IDs have been opened in the current session for client-side unread dot logic. A thread with `last_message_direction === 'inbound'` that is not in this Set renders a blue unread dot.
