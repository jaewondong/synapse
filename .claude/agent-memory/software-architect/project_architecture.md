---
name: synapse-architecture
description: Core technical architecture of the Synapse EMR frontend — framework, routing, databases, external services
metadata:
  type: project
---

Next.js 16.2.6 App Router, React 19, TypeScript. Route group `(app)/` wraps all authenticated pages in AppShellClient (sidebar + topbar). Pages are Server Components; interactive shells are Client Components.

**Why:** The server/client split keeps initial render fast with zero client-side loading states for primary content.

**How to apply:** When adding a new page, create a Server Component `page.tsx` that fetches data and passes it to a `'use client'` shell. Never fetch from a page's useEffect.

Two databases:
- SQLite via Prisma + better-sqlite3 (`synapse.db` at project root): patients, encounters, problems, medications, imaging studies, agent actions, decisions
- Supabase: appointments, message_threads, messages, patient_documents, notification_events

External services: Anthropic (scheduling agent, claude-opus-4-7), Resend (transactional email), Supabase Storage (documents).

Docs written to: `docs/knowledge_base/` (architecture.md, data-flow.md, components.md, state-management.md, api-routes.md, conventions.md)
