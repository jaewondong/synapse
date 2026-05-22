-- Synapse: messaging tables (Steps 1-4, mock-delivery mode)
-- Real outbound delivery is fenced behind messaging.real_delivery flag (Step 5).
-- RLS is intentionally disabled for the pre-auth demo build.

-- Threads: one per patient/channel conversation
create table if not exists message_threads (
  id                    uuid primary key default gen_random_uuid(),
  patient_mrn           text not null,
  patient_name          text not null,
  patient_initials      text not null default '',
  patient_age           int,
  patient_sex           text,
  patient_allergy_count int not null default 0,
  channel               text not null check (channel in ('email', 'sms')),
  subject               text,
  status                text not null default 'open',
  sensitive_flag        boolean not null default false,
  last_message_at       timestamptz,
  last_message_preview  text,
  last_message_direction text check (last_message_direction in ('inbound', 'outbound')),
  created_at            timestamptz not null default now()
);

-- Messages: individual messages within a thread
create table if not exists messages (
  id                     uuid primary key default gen_random_uuid(),
  thread_id              uuid not null references message_threads(id) on delete cascade,
  direction              text not null check (direction in ('inbound', 'outbound')),
  channel                text not null check (channel in ('email', 'sms')),
  body                   text not null,
  sender_name            text,
  sender_user_id         text,
  sender_agent_name      text,
  delivery_status        text not null default 'mock'
    check (delivery_status in ('mock', 'sending', 'sent', 'failed', 'received')),
  external_message_id    text,
  modified_by_type       text not null default 'human'
    check (modified_by_type in ('human', 'agent')),
  modified_by_agent_name text,
  sent_at                timestamptz,
  created_at             timestamptz not null default now()
);

-- Contact methods: per-patient verified contact info (for Step 5 consent gating)
create table if not exists contact_methods (
  id                  uuid primary key default gen_random_uuid(),
  patient_mrn         text not null,
  type                text not null check (type in ('email', 'mobile')),
  value               text not null,
  verified            boolean not null default false,
  consent_to_contact  boolean not null default false,
  created_at          timestamptz not null default now()
);

-- Audit: immutable log of every send attempt
create table if not exists message_audit (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid references messages(id),
  action         text not null,
  actor_user_id  text,
  patient_mrn    text not null,
  message_hash   text not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_messages_thread        on messages(thread_id, created_at);
create index if not exists idx_threads_patient        on message_threads(patient_mrn, last_message_at desc);
create index if not exists idx_threads_last_msg       on message_threads(last_message_at desc);
