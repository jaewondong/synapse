# Setup walkthrough

Drop these files into your existing Synapse Next.js project, then follow the steps below in order.

## 0. File placement

Assuming your repo root is the Next.js project root:

```
your-repo/
├── src/
│   ├── app/api/webhooks/appointments/route.ts   ← from this scaffold
│   └── lib/email/                               ← from this scaffold
├── supabase/migrations/                         ← from this scaffold
└── docs/                                        ← from this scaffold (optional)
```

If your Next.js project uses a different alias (e.g. no `@/` configured), adjust the import in `route.ts` accordingly.

## 1. Install dependencies

```bash
npm install resend @react-email/components @react-email/render zod @supabase/supabase-js
```

If you don't already have `@types/react` and TypeScript installed:

```bash
npm install -D @types/react typescript
```

## 2. Set up Supabase

If you don't already have a Supabase project:

1. Go to https://supabase.com and create a project.
2. Wait for the database to provision (~1 minute).
3. Grab your project URL, anon key, and service role key from **Project Settings → API**.

## 3. Run the migrations

In the Supabase dashboard, open the **SQL Editor** and paste the contents of each migration file in order:

1. `supabase/migrations/001_appointments_schema.sql`
2. `supabase/migrations/002_notification_events.sql`

Run each one. Confirm the tables exist in **Table Editor**.

## 4. Seed a provider, a patient, and yourself as MA

```sql
insert into providers (first_name, last_name, email, specialty)
values ('Eleanor', 'Chen', 'echen@example.com', 'Neurology')
returning id;

insert into patients (mrn, first_name, last_name, date_of_birth)
values ('MRN-00042', 'Maria', 'Lopez', '1972-04-11')
returning id;

insert into staff (email, full_name, role)
values ('codyypham@berkeley.edu', 'Cody Pham', 'ma')
returning id;
```

## 5. Verify your sending domain in Resend

1. Go to https://resend.com, create an account, create an API key.
2. In **Domains**, add the domain you want to send from (e.g. `synapse.health` — must be a domain you own).
3. Resend will give you DNS records (SPF, DKIM, DMARC). Add them at your DNS host.
4. Wait for verification (usually 5–60 minutes).

> ⚠️ Pre-domain-verification, you can only send to the email tied to your Resend account. To test the full pipeline including delivery to `codyypham@berkeley.edu`, the domain must be verified.

## 6. Set environment variables

See `docs/ENV.md`. Put them in `.env.local` at your project root.

## 7. Wire the webhook

See `supabase/migrations/003_webhook_setup.md`. For local dev, use ngrok:

```bash
ngrok http 3000
```

Use the ngrok HTTPS URL + `/api/webhooks/appointments` as the webhook target.

## 8. Test end-to-end

```bash
# Make sure the dev server is running
npm run dev
```

In the Supabase SQL editor, run:

```sql
insert into appointments (
  patient_id, provider_id, starts_at, ends_at,
  visit_type, status, created_by_agent, agent_reasoning, agent_confidence
) values (
  (select id from patients where mrn = 'MRN-00042'),
  (select id from providers where last_name = 'Chen'),
  now() + interval '3 days',
  now() + interval '3 days 30 minutes',
  'follow_up', 'scheduled',
  'scheduling_agent_v1',
  'Earliest available follow-up matching patient preference for morning slots. Insurance verified active. No conflicts.',
  0.94
);
```

You should see an email at `codyypham@berkeley.edu` within ~10 seconds. Then test reschedule:

```sql
update appointments
   set starts_at = starts_at + interval '1 day',
       ends_at   = ends_at   + interval '1 day',
       reschedule_reason = 'Patient requested a later morning slot due to childcare conflict.'
 where id = (select id from appointments order by created_at desc limit 1);
```

And cancellation:

```sql
update appointments
   set status = 'cancelled',
       cancellation_reason = 'Patient symptoms resolved; will reach out if they return.'
 where id = (select id from appointments order by created_at desc limit 1);
```

## 9. Verify the audit trail

```sql
select kind, status, recipient_emails, sent_at, error
  from notification_events
  order by created_at desc
  limit 10;
```

Every row should show `status = 'sent'` and a non-null `sent_at`.

## 10. Common issues

- **No email arrives, no row in `notification_events`** → webhook isn't reaching your app. Check ngrok URL is current; check Supabase webhook logs (Database → Webhooks → click the hook → Recent deliveries).
- **Row in `notification_events` with `status = 'failed'`** → check the `error` column. Most common: sending domain not verified in Resend, or `RESEND_API_KEY` missing.
- **401 from webhook** → `x-webhook-secret` header doesn't match `SUPABASE_WEBHOOK_SECRET`.
- **Update fires but no email** → the change didn't qualify (only `starts_at`/`ends_at` changes or `status → cancelled` trigger emails). See `classifyUpdate` in `src/lib/email/send.ts`.
