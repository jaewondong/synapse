# Architecture Overview

## Framework and Runtime

- **Next.js 16.2.6** with the App Router (file-system based routing under `app/`)
- **React 19.2.4** with Server Components as the default rendering mode
- **TypeScript 5** throughout
- Runtime: Node.js (default); some API routes explicitly declare `export const runtime = 'nodejs'` when they require Node APIs (e.g. React Email's render, file uploads)

## Route Groups and Layouts

```
app/
  layout.tsx                   — Root layout: fonts, QueryProvider, Sonner Toaster
  (app)/                       — Route group: all authenticated app pages
    layout.tsx                 — Wraps children in <AppShellClient>
    page.tsx                   — /  (Today dashboard)
    inbox/page.tsx             — /inbox
    chart/[mrn]/page.tsx       — /chart/:mrn  (redirects to dept sub-page)
    chart/[mrn]/[department]/page.tsx  — /chart/:mrn/:department
    lookup/page.tsx            — /lookup  (patient search)
    schedule/page.tsx          — /schedule
    documents/page.tsx         — /documents
    audit/page.tsx             — /audit
    agents/page.tsx, billing/page.tsx, reports/page.tsx, admin/page.tsx, settings/page.tsx, help/page.tsx
  api/                         — API Route Handlers (server-only)
```

The `(app)` route group inserts `AppShellClient` (sidebar + topbar) around every page without affecting the URL.

## Rendering Strategy

Pages follow the App Router convention:

| Boundary | Strategy |
|---|---|
| Page components (`page.tsx`) | **Server Components** — fetch data, pass as props |
| Shell/interactive components | **Client Components** (`'use client'`) |
| API routes (`app/api/**`) | **Route Handlers** (server-only, no React) |

The pattern is: a Server Component page fetches data or reads search params, then passes a fully hydrated data object down to a client-side "shell" component (e.g. `ChartShell`, `InboxShell`, `ScheduleShell`). The shell owns all local UI state.

Example — Patient Chart:
```
ChartDepartmentPage (Server Component)
  → calls getChartData(mrn) (DB query, server-only)
  → renders <ChartShell data={data} initialDepartment={dept} />

ChartShell (Client Component, 'use client')
  → owns activeDept state
  → renders DepartmentRail, DepartmentView, DemographicsRail, etc.
```

## App Shell

`AppShellClient` (`components/synapse/app-shell/`) is a client component that composes:
- `TopBar` — app name, ⌘K command palette, PHI redact toggle, notification bell, user dropdown
- `Sidebar` — collapsible nav with three groups: Main, Agents & Insights, Admin (bottom-pinned)
- `HotkeysProvider` — registers global keyboard shortcuts (`react-hotkeys-hook`)

Sidebar state (collapsed/expanded) lives as `useState` inside `AppShellClient` and is passed down as a prop — no global store involved.

PHI visibility preference is persisted to `localStorage` under the key `synapse-phi-hidden`. It is read on mount and stored on toggle; no server state is involved.

## Database Layer (Two Databases)

Synapse uses two separate databases for different data categories:

### SQLite via Prisma (structured clinical data)
- File: `synapse.db` at project root
- Adapter: `@prisma/adapter-better-sqlite3`
- Client: lazy-initialized singleton proxy in `lib/db/prisma.ts` (defers construction to avoid a Turbopack startup issue)
- Schema: `lib/generated/prisma/client` (generated from the Prisma schema)
- Used for: patients, encounters, problems, medications, imaging studies, agent action records, decisions, audit log

### Supabase (PostgreSQL for cloud data + object storage)
- Two clients: `lib/supabase/client.ts` (browser, anon key) and `lib/supabase/server.ts` (server, service role key — never import from client components)
- Used for: appointments, message threads, messages, patient documents metadata, notification events

The split is intentional: structured patient records live in the local SQLite DB; real-time/cloud data (appointments, messages, documents) lives in Supabase.

## External Services

| Service | Purpose | SDK/Package |
|---|---|---|
| Supabase | PostgreSQL DB + object storage for documents | `@supabase/supabase-js` |
| Resend | Transactional email delivery | `resend` |
| Anthropic Claude | AI agent (scheduling) | `@anthropic-ai/sdk` |
| react-email | Email template rendering (HTML + plaintext) | `@react-email/*` |

## Feature Flags

`lib/flags.ts` contains a minimal server-readable flags object. Currently the only flag is `messaging.real_delivery`, which defaults to `false` and gates actual PHI outbound delivery. It is read from `process.env.MESSAGING_REAL_DELIVERY`.
