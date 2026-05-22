# Environment variables

Add these to `.env.local` (Next.js will pick them up) and to your Vercel project settings for production.

```bash
# ---- Supabase ----
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key — safe in client bundle>
SUPABASE_SERVICE_ROLE_KEY=<service role key — SERVER ONLY, never expose>

# ---- Resend ----
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM_ADDRESS="Synapse Scheduling <scheduling@synapse.health>"
# Use your verified sending domain. `synapse.com` likely belongs to someone else;
# pick a domain you own, e.g. synapse.health or synapse-emr.com.

# ---- Webhook shared secret ----
SUPABASE_WEBHOOK_SECRET=<long random string — used in the x-webhook-secret header>
```

## How to generate the webhook secret

```bash
# macOS / Linux
openssl rand -hex 32
```

Paste that value into both your `.env.local` (as `SUPABASE_WEBHOOK_SECRET`) **and** the Supabase webhook's HTTP header field.

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It must never appear in client-side code. The only places it's used in this scaffold are server-only files (`src/lib/email/*` and the API route).
- `RESEND_API_KEY` is also server-only.
- The webhook secret is the only thing protecting the API route. Rotate it if you ever leak the value.
