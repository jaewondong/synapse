# Architecture

## How this fits the PRD

This feature is a capability of the **Scheduling Agent** (PRD §4.2). It implements the staff-facing notification slice of **Communications** (§4.6) — patient-facing comms are a separate workstream.

Concretely, the scaffold honors these design principles:

| PRD principle | How this implements it |
|---|---|
| #2 Exception-based attention | We only email on changes that need a human to know — create, reschedule, cancel. Routine status flips (scheduled → confirmed) don't generate noise. |
| #5 Audit-visible | Every email writes a `notification_events` row with template ID, recipients, payload snapshot, agent identity, and message ID. Failures are logged too. |
| #6 HIPAA-safe by default | Subject lines use last name + first initial + MRN, not full PHI. Recipients are role-resolved. Sending domain requires SPF/DKIM/DMARC and Resend BAA before real data. |
| #8 Trust through explainability | The reschedule template includes the reason. The created/rescheduled templates surface the agent's at-decision-time reasoning. |

## Data flow

```
┌────────────────────┐
│ Scheduling Agent   │ writes/updates
│ or human scheduler │ ─────────────┐
└────────────────────┘              │
                                    ▼
                          ┌──────────────────┐
                          │ appointments     │ Supabase Postgres
                          │ (Postgres table) │
                          └─────────┬────────┘
                                    │ INSERT / UPDATE
                                    ▼
                          ┌──────────────────────┐
                          │ Database Webhook     │ Supabase
                          └─────────┬────────────┘
                                    │ HTTP POST
                                    ▼
                  ┌─────────────────────────────────────┐
                  │ /api/webhooks/appointments          │ Next.js (Node runtime)
                  │  1. verify x-webhook-secret         │
                  │  2. parse + validate (Zod)          │
                  │  3. classify: created/resched/cancl │
                  │  4. hydrate patient + provider      │
                  │  5. resolve recipients              │
                  │  6. render React Email template     │
                  │  7. send via Resend                 │
                  │  8. log to notification_events      │
                  └─────────────┬───────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
         ┌──────────────┐               ┌───────────────────┐
         │ Resend API   │ → SMTP → inbox │ notification_     │
         └──────────────┘               │ events (audit)    │
                                        └───────────────────┘
```

## Why a webhook, not polling

Polling would mean a cron job hitting Postgres every N seconds asking "did anything change?" That:

- adds latency (up to N seconds before the email goes out)
- adds load
- needs extra state to remember what's already been emailed
- introduces a race (two pollers double-emailing)

Supabase Database Webhooks are push, fire on actual row changes, and let Postgres be the source of truth for "what changed." For pilot scale (~10 patients/day) it's more than sufficient.

## What's NOT in this scaffold (intentionally)

- **Retries.** Resend retries internally. Supabase will retry the webhook on non-2xx. We return 200 even on send failure (the audit row captures the failure) to avoid Supabase retrying a known-bad payload forever. If you want active retry, add a job queue (Inngest, Trigger.dev, or a Supabase pg_cron worker that scans `notification_events` for `status = 'failed'`).
- **Digest mode.** Every change emails immediately. If MAs get overwhelmed, batch into a 15-minute digest. The audit log makes this easy to bolt on.
- **Patient-facing emails.** Out of scope — handled by the Communications Agent (PRD §4.6), separate workstream, different templates and consent rules.
- **In-app notifications.** The PRD wants a notification bell (§3) for real-time pushes. That should hang off the same `notification_events` table, possibly via Supabase Realtime, but the UI work is separate.
- **LLM-generated copy.** Per your decision: templates are deterministic. The "reason" field is captured upstream (from the patient, the scheduler, or the Scheduling Agent's reasoning at the moment of the reschedule) and rendered verbatim. This keeps the audit story clean — no LLM call at email-send time means no per-send variance to explain.

## Where the LLM lives (if/when you want one)

If later you want richer "reason for reschedule" copy than what the scheduler typed, the right place to add an LLM call is **inside the Scheduling Agent**, not inside the email pipeline. The agent should write `reschedule_reason` into the `appointments` row before the webhook fires. The email pipeline stays a dumb deterministic renderer. That keeps the email audit trail tight: what got sent is exactly what's in the row, and you can re-render any past email from `notification_events.payload` to prove what a recipient saw.

## Anti-rubber-stamp note (PRD §4.9)

This scaffold doesn't yet implement the rubber-stamp safeguards your PRD calls out (open question #4). For email notifications it likely doesn't matter — emails are output, not input. But when you build the in-app review surfaces for these same events (Inbox, Agent Card), apply the friction there. The `notification_events` log is also a useful signal for the QA review your PRD calls for in §4.9.

## Deployment

- Local: `npm run dev` + ngrok
- Staging / pilot: Vercel + Supabase. Add env vars in Vercel project settings. Point the Supabase webhook at your Vercel deployment URL.
- HIPAA: signed BAAs with Supabase, Resend, and Vercel before any real PHI. Without BAAs, only synthetic data.
