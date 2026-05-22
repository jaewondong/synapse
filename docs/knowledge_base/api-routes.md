# API Routes and External Services

## API Route Inventory

All routes live under `app/api/`. All use the Next.js App Router Route Handler convention (`GET`, `POST` named exports).

### Agent Actions

| Route | Method | Purpose | DB |
|---|---|---|---|
| `GET /api/actions` | GET | List pending `AgentActionRecord` rows, ordered by timestamp | SQLite (Prisma) |
| `POST /api/actions/:id/decide` | POST | Create a `Decision` record + update `AgentActionRecord.status` atomically | SQLite (Prisma, `$transaction`) |
| `POST /api/actions/bulk-decide` | POST | Same as above for multiple IDs in one transaction | SQLite (Prisma, `$transaction`) |

Both decide routes use `DECIDED_BY = 'codyypham@berkeley.edu'` as a hardcoded physician identifier (placeholder).

Request body schemas are validated with Zod (`lib/api/schemas.ts`):
- `DecideSchema`: `{ operation: 'approve'|'reject'|'snooze', reason?: string }`
- `BulkDecideSchema`: `{ ids: string[], operation: '...', reason?: string }`

Status mapping: `approve → 'approved'`, `reject → 'rejected'`, `snooze → 'deferred'`

### Audit Log

| Route | Method | Purpose | DB |
|---|---|---|---|
| `GET /api/audit` | GET | Paginated `Decision` records with joined `AgentActionRecord`. Filterable by operation and search term. | SQLite (Prisma) |
| `GET /api/audit/:actionId` | GET | All decisions for a specific action ID | SQLite (Prisma) |

Query params validated with `AuditQuerySchema`: `page`, `limit` (max 100), `operation`, `search`.

### Patients

| Route | Method | Purpose | DB |
|---|---|---|---|
| `GET /api/patients/search` | GET | Search by `name`, `dob`, or `mrn`. Returns `LookupPatient[]`. MRN exact match returns `{ directLoad: mrn }`. Name matching uses in-process Soundex. | SQLite (Prisma) |

### Appointments

| Route | Method | Purpose | DB |
|---|---|---|---|
| `GET /api/appointments` | GET | Appointments in a date range with joined patient + provider. Excludes cancelled. | Supabase |

### Scheduling Agent

| Route | Method | Purpose |
|---|---|---|
| `POST /api/scheduling-agent` | POST | Runs the Anthropic agentic loop and streams Server-Sent Events back to the client |

Response is `text/event-stream`. Each line is `data: {JSON}\n\n`.
Event types: `text`, `tool_call`, `tool_result`, `done`, `error`.
Requires `export const runtime = 'nodejs'`.

### Messages

| Route | Method | Purpose | DB |
|---|---|---|---|
| `GET /api/messages/threads` | GET | Open threads for `?patient_mrn=...`, ordered by `last_message_at` desc | Supabase |
| `POST /api/messages/threads` | POST | Create a new message thread | Supabase |
| `POST /api/messages/send` | POST | Send a message within a thread | Supabase |

### Documents

| Route | Method | Purpose | DB |
|---|---|---|---|
| `POST /api/documents/upload` | POST | Multipart upload: validates MIME + size, writes to Supabase Storage, inserts metadata row | Supabase Storage + Supabase DB |
| `GET /api/documents/:id` | GET | Fetch document metadata by ID | Supabase |
| `GET /api/documents/:id/signed-url` | GET | Generate a time-limited signed URL for file download | Supabase Storage |

Upload constraints:
- Allowed MIME types: PDF, JPEG, PNG, WEBP, GIF, plain text, Word (.doc/.docx)
- Max size: 20 MB
- Storage path pattern: `{patient_mrn}/{department}/{timestamp}-{random}.{ext}`
- Idempotency: if `idempotency_key` is provided and already exists, returns the existing record without re-uploading

### Webhooks

| Route | Method | Purpose |
|---|---|---|
| `POST /api/webhooks/appointments` | POST | Supabase Realtime webhook for appointment changes. Sends email notifications via Resend. |

Authenticated via `x-webhook-secret` header (must match `process.env.SUPABASE_WEBHOOK_SECRET`).
Returns HTTP 200 even on email send failure (prevents Supabase from retrying indefinitely). Failures are logged to `notification_events` table for manual follow-up.

---

## External Service Integrations

### Anthropic Claude (`lib/agents/scheduling-agent.ts`)

Model: `claude-opus-4-7` with `thinking: { type: 'adaptive' }` and `max_tokens: 4096`.

The scheduling agent is a simple agentic loop (max 10 iterations) with 6 tools:

| Tool | Action |
|---|---|
| `list_appointments` | Supabase SELECT on appointments table with date range |
| `search_patients` | Supabase SELECT with ILIKE on mrn/first_name/last_name |
| `get_providers` | Supabase SELECT active providers |
| `create_appointment` | Supabase INSERT — sets `created_by_agent: 'scheduling_agent_v1'` |
| `reschedule_appointment` | Supabase UPDATE starts_at/ends_at |
| `cancel_appointment` | Supabase UPDATE status = 'cancelled' |

The agent includes `agent_reasoning` and `agent_confidence` fields on write operations for audit trail purposes.

### Resend (`lib/email/`)

Used for appointment notification emails. Three template types, each implemented as a React Email component:
- `AppointmentCreated` (`lib/email/templates/AppointmentCreated.tsx`)
- `AppointmentRescheduled`
- `AppointmentCancelled`

Templates are rendered to HTML and plaintext with `@react-email/render`. Custom headers added to each email: `X-Synapse-Agent`, `X-Synapse-Template`, `X-Synapse-Appointment-Id`.

`FROM_ADDRESS` defaults to `"Synapse Scheduling <scheduling@synapse.health>"` (overridable via `EMAIL_FROM_ADDRESS` env var).

Every send attempt first inserts a `notification_events` row with `status: 'queued'`. The row is updated to `sent` or `failed` after the Resend API call. This ensures an audit trail exists even if the send fails.

### Supabase (`lib/supabase/`)

Two client instances:
- **Browser client** (`lib/supabase/client.ts`): uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Safe to import in client components.
- **Server client** (`lib/supabase/server.ts`): uses `SUPABASE_SERVICE_ROLE_KEY` with `persistSession: false`. Must only be imported in Server Components and Route Handlers.

Supabase tables in use:
- `appointments` — schedule data (written by agent, read by calendar)
- `patients` / `providers` — looked up by webhook + scheduling agent
- `message_threads` / `messages` — inbox messaging
- `patient_documents` — document metadata
- `notification_events` — email send audit log

Object Storage bucket: `patient-documents` (configurable via `SUPABASE_DOCUMENTS_BUCKET` env var). PHI eligibility flag: `STORAGE_IS_PHI_ELIGIBLE` env var (defaults false; must be set only after Supabase BAA is in place).

---

## Environment Variables

| Variable | Required | Used For |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server Supabase client |
| `SUPABASE_WEBHOOK_SECRET` | Yes | Webhook authentication |
| `SUPABASE_DOCUMENTS_BUCKET` | No | Storage bucket name (default: `patient-documents`) |
| `STORAGE_IS_PHI_ELIGIBLE` | No | PHI storage gate (default: `false`) |
| `ANTHROPIC_API_KEY` | Yes | Scheduling agent |
| `RESEND_API_KEY` | Yes | Email delivery |
| `EMAIL_FROM_ADDRESS` | No | Sender address (default: `scheduling@synapse.health`) |
| `MESSAGING_REAL_DELIVERY` | No | Feature flag to enable outbound PHI delivery (default: `false`) |
