---
name: synapse-conventions
description: Key design conventions unique to Synapse — PHI gates, anti-rubber-stamp, URL state, provenance badges
metadata:
  type: project
---

Key non-obvious conventions:

**Anti-rubber-stamp velocity check**: `useInboxStore.recordIndividualApproval()` tracks last 10 individual approval timestamps. Median interval < 800ms triggers warning toast. Safety mechanism against accidental bulk approval via rapid keystrokes.

**PHI safety gates**: Three layers — (1) `localStorage['synapse-phi-hidden']` toggle in TopBar, (2) `MESSAGING_REAL_DELIVERY=false` env flag gates outbound messages, (3) `STORAGE_IS_PHI_ELIGIBLE=false` default gates HIPAA-eligible document storage. None of these are fully wired through all components yet.

**Provenance audit strip**: Fields `modifiedByType: 'agent'|'human'` on Insurance, Problem, Medication, AgentActionRecord. `AuditStrip` component renders inline wherever agent-modified data appears.

**URL as state**: Inbox and Schedule pages use search params as source of truth. Server Component reads params, passes as props to shell. Shell uses `router.push()` for navigable state changes, `window.history.replaceState` for housekeeping-only changes.

**Wrong patient guard**: `WrongPatientGuard` + `useChartStore` detect A→B→A chart navigation within 10 seconds and toast a warning. Pure client-side, no API call.

**G-chord hotkeys**: Global navigation via G+letter (within 600ms). Implemented in `HotkeysProvider` using a `useRef` timestamp, not a state machine.

**Soundex name search**: Patient name search in `lib/db/patients.ts` loads all patients into memory and does Soundex fuzzy matching in JS (appropriate for ~50-patient demo scale).

**`searchParams` must be awaited**: In Next.js 16 App Router, `searchParams` is a `Promise<{...}>`. All `page.tsx` files must `await searchParams` before reading fields.
