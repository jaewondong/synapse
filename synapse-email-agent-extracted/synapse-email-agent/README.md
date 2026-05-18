# Synapse — Scheduling Agent Email Notifications

This scaffold adds appointment-change email notifications to Synapse, surfaced to clinical staff (MA / provider) as a capability of the existing Scheduling Agent.

## What this does

When an appointment is **created**, **rescheduled**, or **cancelled** in the database, a Supabase webhook fires a Next.js API route. The route classifies the event, renders a React Email template, and sends via Resend to `codyypham@berkeley.edu` (and any other staff on the routing list).

- **Created** → standardized confirmation email
- **Rescheduled** → includes old time, new time, and reason (from the agent or the rescheduler)
- **Cancelled** → standardized cancellation email with reason

Every send is logged to `notification_events` for audit (per PRD §4.9 — every agent action is auditable).

## Stack

- **Next.js 14** (App Router) — you already have this
- **Supabase** — Postgres + Database Webhooks
- **Resend** — transactional email, send-from domain `scheduling@synapse.health` (or your verified domain)
- **React Email** — JSX templates, type-safe
- **Zod** — webhook payload validation

## File map

```
supabase/migrations/
  001_appointments_schema.sql       # appointments + audit + RLS
  002_notification_events.sql       # audit log for emails
  003_webhook_setup.md              # how to wire the webhook in Supabase

src/lib/email/
  client.ts                         # Resend client
  send.ts                           # send + log wrapper
  recipients.ts                     # who gets notified for what
  types.ts                          # shared types

src/lib/email/templates/
  AppointmentCreated.tsx
  AppointmentRescheduled.tsx
  AppointmentCancelled.tsx
  _components.tsx                   # shared header/footer/styles

src/app/api/webhooks/appointments/
  route.ts                          # webhook receiver

docs/
  SETUP.md                          # step-by-step setup
  ARCHITECTURE.md                   # how it fits the PRD
  ENV.md                            # env vars
```

## Quick start

See `docs/SETUP.md` for the full walkthrough. TL;DR:

1. `npm install resend @react-email/components @react-email/render zod @supabase/supabase-js`
2. Run the SQL migrations against your Supabase project
3. Set env vars (see `docs/ENV.md`)
4. Verify your sending domain in Resend
5. Wire the Supabase Database Webhook to `POST /api/webhooks/appointments`
6. Insert a test appointment — email should land in your inbox

## How this fits the PRD

This implements a slice of **§4.6 Communications → Automated reminders, confirmations** and is a capability of the **Scheduling Agent** (§4.2). Specifically:

- Audit-visible (PRD principle #5): every email send is logged with agent identity, timestamp, recipient, template version, and payload hash
- HIPAA-safe by default (PRD principle #6): emails to staff contain MRN, not full PHI in subject lines; routing respects role
- Trust through explainability (PRD principle #8): rescheduled emails carry the reason, not just the change

See `docs/ARCHITECTURE.md` for the longer version.
