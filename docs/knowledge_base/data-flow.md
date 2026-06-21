# Data Flow

## Overview

Data in Synapse flows along three distinct paths depending on the feature:

1. **Server-side fetch → Server Component → Client Shell** (patient chart, patient search)
2. **Client Component → API Route → Database** (agent decisions, document upload, messaging)
3. **SSE stream → Client hook → React state** (scheduling agent chat)

---

## 1. Patient Chart Data Flow

```
URL: /chart/:mrn/:department

ChartDepartmentPage (Server Component)
  ↓ params.mrn (from URL)
  ↓ calls getChartData(mrn)  [lib/db/patients.ts]
      ↓ prisma.patient.findUnique({ include: all relations }) → SQLite
      ↓ supabase.from('patient_documents').select(count) → Supabase (parallel)
      ↓ maps raw DB rows to typed ChartData interface
      ↓ returns ChartData | null  (notFound() if null)
  ↓ passes ChartData as prop to <ChartShell>

ChartShell (Client Component)
  ↓ receives ChartData — no further API calls needed for initial render
  ↓ activeDept: useState (initialized from initialDepartment prop)
  ↓ filters problems/encounters by activeDept locally
  ↓ renders: PatientHeader, DepartmentRail, DepartmentView, MedicationsCard,
             ImagingCard, DemographicsRail, ReconciliationBanner, WrongPatientGuard
```

`getChartData` is a pure server function. It uses a single Prisma query with `include` to fetch all related records in one round trip, then maps them into the `ChartData` shape. The document count is fetched in parallel via `Promise.all`.

### Wrong Patient Guard
`WrongPatientGuard` is a client component that uses `useChartStore` (Zustand) to track the last 3 charts opened. If the user navigates A→B→A within 10 seconds, a toast warning fires. This is pure client-side logic with no API calls.

---

## 2. Patient Search Data Flow

```
URL: /lookup

LookupShell (Client Component)
  ↓ user fills name / DOB / MRN fields
  ↓ fetch('/api/patients/search?name=...&dob=...&mrn=...')
      ↓ API Route: app/api/patients/search/route.ts
          ↓ MRN direct → prisma.patient.findUnique → returns { directLoad: mrn }
          ↓ Name/DOB → prisma.patient.findMany + in-memory Soundex name matching
          ↓ returns { patients: LookupPatient[] }
  ↓ if directLoad: router.push('/chart/:mrn')
  ↓ else: renders ResultRow list
  ↓ onClick: router.push('/chart/:mrn')
```

Name matching uses a built-in Soundex implementation in `lib/db/patients.ts` — the search runs in Node, not the DB.

---

## 3. Inbox / Agent Review Data Flow

The agent review list currently uses **static mock data** from `lib/mock/agent-actions.ts`. The mock actions are seeded into the SQLite DB via `prisma/seed.ts`. The inbox shell imports the mock array directly rather than fetching from the API.

Decision operations (approve / reject / snooze) hit the real API and persist to SQLite:

```
AgentCard (Client Component)
  ↓ user clicks Approve / Reject
  ↓ opens ReasonCapture inline form
  ↓ on confirm: useDecideAction().mutate(id, operation, reason)
      ↓ optimistic update: dismissAction(id) via useInboxStore (Zustand)
      ↓ velocity check: recordIndividualApproval() → toast warning if median < 800ms
      ↓ apiClient.decideAction(id, { operation, reason })
          ↓ POST /api/actions/:id/decide
              ↓ Zod validation (DecideSchema)
              ↓ prisma.$transaction([
                  decision.create(...),
                  agentActionRecord.update({ status })
                ]) → SQLite
              ↓ returns Decision record
      ↓ queryClient.invalidateQueries(['audit'])
      ↓ on error: restoreAction(id) + toast with undo action
```

### Bulk Decide Flow

```
BulkActionBar
  ↓ useBulkDecide().mutate(ids, operation, reason)
      ↓ ids.forEach: dismissAction(id)  [optimistic]
      ↓ apiClient.bulkDecide({ ids, operation, reason })
          ↓ POST /api/actions/bulk-decide
              ↓ prisma.$transaction([...flatMap of create/update pairs])
      ↓ queryClient.invalidateQueries(['audit'])
      ↓ on error: ids.forEach: restoreAction(id)
```

---

## 4. Scheduling Agent Data Flow

```
ScheduleShell (Client Component)
  ↓ useSchedulingAgent() hook manages message list + streaming state
  ↓ useAppointments(weekStart, weekEnd) fetches calendar via React Query
       ↓ GET /api/appointments?date_from=...&date_to=...
           ↓ Supabase: appointments + patients + providers join

AgentChat (Client Component)
  ↓ user types message → sendMessage(content)
      ↓ builds Anthropic-format history from display messages
      ↓ POST /api/scheduling-agent  { messages: [...] }
          ↓ Route Handler: streams SSE (text/event-stream)
              ↓ runSchedulingAgent(messages, onEvent)
                  ↓ Anthropic claude-opus-4-7 with tool_use + adaptive thinking
                  ↓ agent loop (max 10 iterations):
                      tools: list_appointments, search_patients, get_providers,
                             create_appointment, reschedule_appointment, cancel_appointment
                      each tool → Supabase query
                  ↓ streams events: { type: 'text'|'tool_call'|'tool_result'|'done'|'error' }
      ↓ SSE reader in hook updates message list in real time
      ↓ on write tool result: queryClient.invalidateQueries(['appointments'])
         → calendar re-fetches automatically
```

The scheduling agent is the only place that writes to Supabase's `appointments` table from the frontend path.

---

## 5. Email Notification Data Flow

```
Supabase Realtime Webhook
  ↓ POST /api/webhooks/appointments  (x-webhook-secret header required)
      ↓ Zod validates payload schema
      ↓ classifyUpdate(old_record, new_record) → NotificationKind | null
          INSERT → 'appointment_created'
          UPDATE (status=cancelled) → 'appointment_cancelled'
          UPDATE (time changed) → 'appointment_rescheduled'
      ↓ parallel: supabase.from('patients').select + supabase.from('providers').select
      ↓ resolveRecipients(kind, provider, scheduledMaId)
      ↓ sendNotification(ctx)
          ↓ renderForKind(ctx)  → react-email → HTML + plaintext
          ↓ supabase.from('notification_events').insert({ status: 'queued' })  [audit row first]
          ↓ resend.emails.send({ from, to, subject, html, text })
          ↓ supabase.from('notification_events').update({ status: 'sent'|'failed' })
          ↓ returns { ok, messageId }
      ↓ returns 200 even on send failure (prevents Supabase retry loops)
         failure is recorded in notification_events for follow-up
```

---

## 6. Document Upload Data Flow

```
UploadDialog (Client Component)
  ↓ user selects file
  ↓ POST /api/documents/upload (multipart/form-data)
      ↓ validates: ALLOWED_MIME set, MAX_BYTES (20MB), non-empty
      ↓ idempotency_key check → returns existing record if already uploaded
      ↓ derives storage path: {patient_mrn}/{department}/{timestamp}-{random}.{ext}
      ↓ supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buffer)
      ↓ supabase.from('patient_documents').insert(metadata row)
      ↓ on DB error: cleanup orphaned storage object
      ↓ returns { document: PatientDocument }
```

---

## 7. Messaging Data Flow

Messages and threads live entirely in Supabase. `MessagesTab` queries Supabase directly from the client using the browser-safe anon key client.

```
MessagesTab (Client Component)
  ↓ on mount: supabase.from('message_threads').select('*')
  ↓ on thread select: supabase.from('messages').select('*').eq('thread_id', id)
  ↓ on reply send: POST /api/messages/send → inserts message row
  ↓ on new thread: POST /api/messages/threads → creates thread row
  ↓ URL state: /inbox?category=messages&thread={id}
       thread switching uses router.push() to keep URL in sync
       clean-up params (patient_mrn handoff) use window.history.replaceState
```

Draft messages are stored in a module-level `Map<threadId, string>` (`draftStore`) inside the component file. This survives component remounts within a session but is cleared on page reload.

---

## React Query Configuration

`QueryProvider` (root layout) configures a singleton `QueryClient` with:
- `staleTime: 30_000` (30 seconds)
- `retry: 1`

Active query keys in use:
- `['appointments', dateFrom, dateTo]` — schedule calendar
- `['audit']` — audit log (invalidated after any decision)
- `['audit']` is the canonical decided-records key; pending agent actions are fetched server-side via `/api/actions` (no client hook)
