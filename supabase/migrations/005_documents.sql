-- Synapse: patient documents metadata table
-- Files live in Supabase Storage; this table stores metadata and soft-delete state.
-- RLS intentionally disabled for the pre-auth demo build.

create table if not exists patient_documents (
  id                uuid primary key default gen_random_uuid(),
  -- Caller-supplied dedup key; prevents double-uploads on retry.
  idempotency_key   text unique,
  patient_mrn       text not null,
  patient_name      text not null,
  -- Clinical department this document is filed under.
  department        text not null,
  file_name         text not null,
  file_size         bigint not null,
  mime_type         text not null,
  -- Path within the storage bucket, e.g. "MRN001/neurology/1700000000-abc.pdf"
  storage_path      text not null unique,
  bucket            text not null,
  uploaded_by       text not null default 'demo-user',
  -- Soft-delete: non-null means deleted; rows are never hard-deleted.
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Most common query: patient's documents, newest first, excluding deleted.
create index if not exists idx_patient_docs_mrn
  on patient_documents(patient_mrn, created_at desc)
  where deleted_at is null;

-- Department filter within a patient chart.
create index if not exists idx_patient_docs_dept
  on patient_documents(patient_mrn, department)
  where deleted_at is null;
