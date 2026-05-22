# Supabase Database Webhook setup

Supabase Database Webhooks fire HTTP requests on table changes. We use one webhook on the `appointments` table to drive the email agent.

## Steps

1. Open your Supabase project dashboard → **Database** → **Webhooks** → **Create a new hook**.

2. Fill in:
   - **Name**: `appointment_changes_to_email_agent`
   - **Table**: `appointments`
   - **Events**: check **Insert**, **Update**, **Delete** (we mainly use Insert + Update; Delete is for safety)
   - **Type**: HTTP Request
   - **Method**: `POST`
   - **URL**: `https://your-app.vercel.app/api/webhooks/appointments`
     - For local dev, use [ngrok](https://ngrok.com) or [Supabase's local CLI](https://supabase.com/docs/guides/local-development) and point at `http://localhost:3000/api/webhooks/appointments`
   - **HTTP Headers**:
     - `Content-Type: application/json`
     - `x-webhook-secret: <some-long-random-string>` — must match `SUPABASE_WEBHOOK_SECRET` in your `.env`
   - **HTTP Params**: leave empty
   - **Timeout**: 5000ms

3. Click **Create webhook**.

## Payload shape

Supabase sends:

```json
{
  "type": "INSERT" | "UPDATE" | "DELETE",
  "table": "appointments",
  "schema": "public",
  "record": { ...new row... },
  "old_record": { ...old row, present on UPDATE/DELETE... }
}
```

The route handler at `src/app/api/webhooks/appointments/route.ts` parses this with Zod and classifies the change into one of three notification kinds.

## Reschedule vs cancel classification

- `INSERT` → `appointment_created`
- `UPDATE` where `status` changed to `'cancelled'` → `appointment_cancelled`
- `UPDATE` where `starts_at` or `ends_at` changed → `appointment_rescheduled`
- Other `UPDATE`s → no notification (status flips like `scheduled → confirmed` aren't worth emailing for v1)
- `DELETE` → log only, no email (hard deletes shouldn't happen in production; if one does we want a trail)

## Testing locally

```bash
# Start your Next.js app
npm run dev

# In another terminal, tunnel:
ngrok http 3000

# Use the ngrok URL in the Supabase webhook config.

# Then insert a test row in the Supabase SQL editor:
insert into appointments (
  patient_id, provider_id, starts_at, ends_at, visit_type, status,
  created_by_agent, agent_reasoning, agent_confidence
) values (
  (select id from patients limit 1),
  (select id from providers limit 1),
  now() + interval '3 days',
  now() + interval '3 days 30 minutes',
  'follow_up',
  'scheduled',
  'scheduling_agent_v1',
  'Patient requested earliest available follow-up slot with Dr. Chen. Insurance verified active. No conflicts.',
  0.94
);
```

You should see an email arrive at `codyypham@berkeley.edu` within a few seconds.
