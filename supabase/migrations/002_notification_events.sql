-- Audit log for every notification email the Scheduling Agent sends.
-- Satisfies PRD §4.9 (agent supervision) and principle #5 (audit-visible).

create type notification_event_kind as enum (
  'appointment_created',
  'appointment_rescheduled',
  'appointment_cancelled'
);

create type notification_status as enum (
  'queued','sent','failed','suppressed'
);

create table if not exists notification_events (
  id uuid primary key default uuid_generate_v4(),

  kind notification_event_kind not null,
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,

  agent_identity text not null default 'scheduling_agent_v1',
  template_id text not null,
  recipient_emails text[] not null,

  status notification_status not null default 'queued',
  provider_message_id text,
  error text,

  -- Snapshot of what was rendered — lets you re-prove what a recipient saw.
  payload jsonb not null,

  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notification_events_appt_idx on notification_events(appointment_id);
create index notification_events_kind_idx on notification_events(kind);
create index notification_events_created_at_idx on notification_events(created_at desc);

alter table notification_events enable row level security;

create policy service_role_all on notification_events
  for all to service_role using (true) with check (true);
