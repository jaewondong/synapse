-- Audit log for every notification email the Scheduling Agent sends.
-- Satisfies PRD §4.9 (Agent supervision → audit log) and principle #5 (Audit-visible).

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

  -- What happened
  kind notification_event_kind not null,
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,

  -- Who sent it / who got it
  agent_identity text not null default 'scheduling_agent_v1',
  template_id text not null,          -- e.g. 'appointment_rescheduled_v1'
  recipient_emails text[] not null,

  -- The send itself
  status notification_status not null default 'queued',
  provider_message_id text,           -- Resend message ID, for tracing
  error text,

  -- Why this email looks the way it does
  -- Includes the rendered subject, the payload snapshot, and the reasoning
  -- captured from the appointment at decision time.
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
