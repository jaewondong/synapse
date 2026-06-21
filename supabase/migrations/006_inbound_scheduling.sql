-- Synapse §2.9: inbound patient email → scheduling loop.
-- One canonical inbound message table. Triage + scheduling proposal are stored
-- as jsonb (agent-drafted layers over the same row) alongside operator-state
-- columns the UI flips as the human verifies and commits.
-- RLS mirrors the existing pre-auth demo posture (service_role only).

-- ============================================================================
-- Outbound confirmation reply needs a new notification kind (§8).
-- ALTER TYPE ... ADD VALUE must run outside a transaction; keep it standalone.
-- ============================================================================
alter type notification_event_kind add value if not exists 'appointment_confirmation';

-- ============================================================================
-- Inbound emails (canonical, provider-agnostic)
-- ============================================================================
create table if not exists inbound_emails (
  id uuid primary key default uuid_generate_v4(),

  -- Idempotency: the provider's message id (svix/Resend). Duplicate webhook
  -- deliveries must not double-insert. Nullable for mock-injected fixtures,
  -- which supply their own deterministic id below instead.
  provider_message_id text unique,

  from_email text not null,
  from_name text,
  to_address text not null,            -- route on this (e.g. drhernandez@synapse.org)
  subject text not null default '',
  body_text text not null default '',
  body_html text,
  received_at timestamptz not null default now(),
  attachments jsonb not null default '[]'::jsonb,

  -- Lifecycle: new → triaged → in_progress → resolved
  status text not null default 'new'
    check (status in ('new', 'triaged', 'in_progress', 'resolved')),

  -- Agent-drafted layers (shape mirrors lib/inbound/InboundEmail.ts).
  -- Null until the triage / scheduling agent has run.
  triage jsonb,
  proposal jsonb,

  -- Operator-verified state (the human owns these; agent never sets them).
  escalation_actioned boolean not null default false,  -- §1.G-B urgency gate
  confirmed_mrn text,                                   -- operator-confirmed match
  committed_appointment_id uuid references appointments(id) on delete set null,
  reply_sent boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbound_emails_status_idx on inbound_emails(status);
create index if not exists inbound_emails_received_idx on inbound_emails(received_at desc);

-- Keep updated_at fresh on every write.
create or replace function inbound_emails_touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists inbound_emails_before_update on inbound_emails;
create trigger inbound_emails_before_update
before update on inbound_emails
for each row execute function inbound_emails_touch_updated_at();

-- ============================================================================
-- Appointments: link a committed appointment back to its source email and make
-- commitAppointment idempotent on it (a double-click can't double-book).
-- ============================================================================
alter table appointments
  add column if not exists source_email_id uuid references inbound_emails(id) on delete set null;

-- Partial unique index: at most one appointment per source email, while still
-- allowing many manually-created appointments with a null source.
create unique index if not exists appointments_source_email_unique
  on appointments(source_email_id)
  where source_email_id is not null;

-- ============================================================================
-- Row-Level Security (service_role only — matches existing demo posture)
-- ============================================================================
alter table inbound_emails enable row level security;

drop policy if exists service_role_all on inbound_emails;
create policy service_role_all on inbound_emails
  for all to service_role using (true) with check (true);
