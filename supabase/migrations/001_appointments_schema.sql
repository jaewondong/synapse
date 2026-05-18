-- Synapse: appointments schema
-- Minimal slice sufficient for the email notification feature.
-- Extend (insurance, encounters, etc.) in separate migrations.

create extension if not exists "uuid-ossp";

-- ============================================================================
-- Patients
-- ============================================================================
create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  mrn text unique not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  preferred_phone text,
  preferred_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Providers (clinicians)
-- ============================================================================
create table if not exists providers (
  id uuid primary key default uuid_generate_v4(),
  npi text unique,
  first_name text not null,
  last_name text not null,
  specialty text,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Staff (MAs, schedulers, billers) — recipients of notifications
-- ============================================================================
create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('ma','scheduler','biller','provider','admin','social_worker')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Appointments
-- ============================================================================
create type appointment_status as enum (
  'scheduled','confirmed','checked_in','in_room','complete','no_show','cancelled'
);

create type appointment_visit_type as enum (
  'new_patient_eval','follow_up','procedure','infusion','telehealth','other'
);

create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete restrict,
  provider_id uuid not null references providers(id) on delete restrict,
  scheduled_ma_id uuid references staff(id) on delete set null,

  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visit_type appointment_visit_type not null default 'follow_up',
  status appointment_status not null default 'scheduled',
  room text,
  notes text,

  -- Provenance: which agent (if any) booked this, and why
  created_by_agent text,
  agent_reasoning text,
  agent_confidence numeric(4,3),

  -- Lifecycle audit fields
  reschedule_reason text,
  cancellation_reason text,
  previous_starts_at timestamptz,
  previous_ends_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appt_time_valid check (ends_at > starts_at)
);

create index appointments_starts_at_idx on appointments(starts_at);
create index appointments_patient_idx on appointments(patient_id);
create index appointments_provider_idx on appointments(provider_id);
create index appointments_status_idx on appointments(status);

-- ============================================================================
-- Trigger: snapshot previous times on reschedule
-- ============================================================================
create or replace function appointments_capture_previous_times()
returns trigger as $$
begin
  if (old.starts_at is distinct from new.starts_at)
     or (old.ends_at is distinct from new.ends_at) then
    new.previous_starts_at := old.starts_at;
    new.previous_ends_at   := old.ends_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger appointments_before_update
before update on appointments
for each row execute function appointments_capture_previous_times();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table patients      enable row level security;
alter table providers     enable row level security;
alter table staff         enable row level security;
alter table appointments  enable row level security;

create policy service_role_all on appointments
  for all to service_role using (true) with check (true);
create policy service_role_all on patients
  for all to service_role using (true) with check (true);
create policy service_role_all on providers
  for all to service_role using (true) with check (true);
create policy service_role_all on staff
  for all to service_role using (true) with check (true);
