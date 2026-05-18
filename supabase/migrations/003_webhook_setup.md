# Supabase Database Webhook setup

Wire a Database Webhook on the `appointments` table to drive the email agent.

## Steps

1. Open your Supabase project → **Database** → **Webhooks** → **Create a new hook**

2. Fill in:
   - **Name**: `appointment_changes_to_email_agent`
   - **Table**: `appointments`
   - **Events**: Insert, Update, Delete
   - **Type**: HTTP Request / POST
   - **URL**: `https://your-app.vercel.app/api/webhooks/appointments`
     - Local dev: use `ngrok http 3000` and set the ngrok HTTPS URL
   - **HTTP Headers**:
     - `Content-Type: application/json`
     - `x-webhook-secret: <value of SUPABASE_WEBHOOK_SECRET>`
   - **Timeout**: 5000ms

3. Click **Create webhook**.

## Classification logic

| Event | Email sent |
|---|---|
| `INSERT` | appointment_created |
| `UPDATE` — `status → 'cancelled'` | appointment_cancelled |
| `UPDATE` — `starts_at` or `ends_at` changed | appointment_rescheduled |
| Other `UPDATE`s (e.g. `scheduled → confirmed`) | none |
| `DELETE` | none (log only) |

## Seed data

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

## End-to-end test

```sql
-- Created
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
  'Earliest available follow-up matching patient preference for morning slots. Insurance verified active.',
  0.94
);

-- Rescheduled (trigger auto-snapshots previous_starts_at)
update appointments
   set starts_at = starts_at + interval '1 day',
       ends_at   = ends_at   + interval '1 day',
       reschedule_reason = 'Patient requested a later morning slot due to childcare conflict.'
 where id = (select id from appointments order by created_at desc limit 1);

-- Cancelled
update appointments
   set status = 'cancelled',
       cancellation_reason = 'Patient symptoms resolved; will reach out if they return.'
 where id = (select id from appointments order by created_at desc limit 1);
```

## Verify audit trail

```sql
select kind, status, recipient_emails, sent_at, error
  from notification_events
  order by created_at desc
  limit 10;
```
