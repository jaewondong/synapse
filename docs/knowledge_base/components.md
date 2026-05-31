# Component Hierarchy and Relationships

## Layer Model

```
app/layout.tsx (Root Layout — Server)
  └── QueryProvider (Client)          — TanStack Query context
      └── <body>
          └── (app)/layout.tsx (App Layout — Server)
              └── AppShellClient (Client)
                  ├── HotkeysProvider (Client)  — global keyboard shortcuts
                  │   ├── TopBar (Client)
                  │   │   └── CommandPalette (Client)  — ⌘K overlay
                  │   ├── Sidebar (Client)
                  │   └── <main>{children}</main>
                  │
                  └── [page content rendered as children]
```

---

## Page-Level Component Trees

### Today Dashboard (`/`)

```
TodayPage (Server Component)
  ├── TodayGreeting           — "Good morning, Dr. Chen" + agent summary
  ├── InterventionStrip       — escalation banner (renders if escalations > 0)
  ├── ReviewQueuePreview      — top 3 agent actions, "View all" link to Inbox
  │   └── AgentCard (non-selectable)
  ├── ScheduleCard            — today's appointment list
  ├── QuickStats              — unsigned notes / tasks / messages counts
  ├── AgentActivity           — timeline of recent agent actions
  └── RecentPatients          — last-seen patient list with chart links

All data: static mock from lib/mock/today.ts (no API calls on Today page)
```

### Inbox (`/inbox`)

```
InboxPage (Server Component)
  └── InboxShell (Client)
      ├── CategoryRail         — left nav: agent-review / messages / results / tasks / signatures
      └── [right pane, conditional on category]
          ├── AgentReviewList  — agent-review category
          │   ├── BulkActionBar (shown when selectedIds > 0)
          │   │   └── ReasonCapture
          │   ├── AgentCard[]  — one per visible action
          │   │   └── ReasonCapture (inline, shown on approve/reject)
          │   └── WhyDrawer    — slide-over showing agent reasoning + sources
          ├── MessagesTab      — messages category
          │   ├── [thread list]
          │   ├── MessageReadingPane (shown when thread selected)
          │   │   ├── MessageBubble[]
          │   │   └── ReplyComposer
          │   └── NewComposePane (shown in compose mode)
          ├── CategoryStubList — results / tasks / signatures (stub)
          └── (future categories)
```

**URL state** drives what `InboxPage` renders. The server component reads `searchParams` and passes typed props down to `InboxShell`. Category, selected thread, patient MRN handoff, and return path are all carried in search params.

### Patient Chart (`/chart/:mrn/:department`)

```
ChartDepartmentPage (Server Component)
  └── ChartShell (Client)
      ├── WrongPatientGuard   — invisible, fires toast on A→B→A navigation
      ├── PatientHeader       — name, MRN, DOB, age/sex, status badge, action buttons
      ├── [three-column grid]
      │   ├── DepartmentRail (sticky)      — dept selector with encounter counts
      │   ├── [center column]
      │   │   ├── ReconciliationBanner     — unresolved agent prompts
      │   │   ├── DepartmentView           — renders dept-specific content
      │   │   │   └── NeurologyWidget (when dept=neurology)
      │   │   │       └── AuditStrip       — provenance badge for agent-modified data
      │   │   ├── MedicationsCard          — active medications list
      │   │   └── ImagingCard              — imaging studies list
      │   └── DemographicsRail (sticky)
      │       ├── DemographicsCard
      │       ├── InsuranceCard
      │       │   └── AuditStrip (shown if modified by agent)
      │       ├── AllergiesCard
      │       ├── CareTeamCard
      │       └── UpcomingCard
```

### Patient Lookup (`/lookup`)

```
LookupPage (Server Component)
  └── LookupShell (Client)
      ├── [search form: name / DOB / MRN inputs]
      └── ResultRow[] (after search)
```

### Schedule (`/schedule`)

```
SchedulePage (Server Component)
  └── ScheduleShell (Client)
      ├── PatientContextChip (shown when patient context set)
      ├── WeekCalendar
      │   └── appointment blocks + proposed/booked slot highlights
      └── AgentChat
          └── ChatMessage[]
              ├── [text message]
              ├── [slot_proposal message — Approve & book / Show alternatives]
              └── [slot_alternatives message — selectable slot list]
```

---

## Shared Components

### `AgentCard` (used in both Today and Inbox)

`AgentCard` is used in two contexts:
- **Today**: non-selectable, no checkbox, limited actions (Today is read-only preview)
- **Inbox**: selectable with checkbox, full hotkey support, inline `ReasonCapture`

The card manages its own `pendingOp` state and calls `useDecideAction()` internally. The parent only receives notification callbacks (`onApprove`, `onReject`) — mutation is owned by the card.

### `AuditStrip`

A small provenance badge component used wherever agent-modified data is displayed (insurance cards, problem rows, medication rows). Shows the agent name and modification timestamp to make AI-originated changes transparent.

### `ReasonCapture`

Inline form that appears below an `AgentCard` when the user initiates approve/reject. Accepts an optional free-text reason before confirming. Also used in `BulkActionBar`.

---

## UI Primitives (`components/ui/`)

All UI primitives are built on Radix UI with CVA/Tailwind styling. Currently implemented:
- `Badge`, `Button`, `Checkbox`, `Dialog`, `DropdownMenu`, `Popover`, `Sheet`, `Tooltip`

These follow the shadcn/ui pattern: Radix primitive + `cn()` for class merging + CVA for variants.

---

## Component Conventions

- Files with `'use client'` at the top are Client Components; files without are Server Components
- Shell components (e.g. `InboxShell`, `ChartShell`, `ScheduleShell`) are always `'use client'` — they own all interactive state for their feature area
- Skeleton components (e.g. `AgentReviewListSkeleton`) are co-located with their real counterparts and used as `Suspense` fallbacks
- All `page.tsx` files in `(app)/` that receive `searchParams` declare them as `Promise<{...}>` and `await` them (Next.js 16 App Router requirement)
