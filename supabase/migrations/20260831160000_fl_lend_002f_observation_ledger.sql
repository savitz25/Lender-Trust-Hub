-- FL-LEND-002F — OFR PRR 141437 immutable source and observation ledger.
-- Additive, internal-only infrastructure. No public projection or publication writes.

alter table public.lender_state_license_observations
  drop constraint if exists lender_state_license_observations_source_clock_check;
alter table public.lender_state_license_observations
  add constraint lender_state_license_observations_source_clock_check
  check (source_clock in ('monthly_full', 'nmls_active', 'ofr_all_status'));

create table if not exists public.lender_source_artifacts (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  request_number text not null,
  reference_number text not null,
  original_filename text not null,
  byte_length bigint not null check (byte_length >= 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  report_current_as_of date not null,
  report_generated_at timestamp without time zone not null,
  source_scope text not null,
  retrieved_at timestamptz not null,
  ingest_fingerprint text not null check (ingest_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (source_dataset, original_filename),
  unique (sha256)
);

create table if not exists public.staging_fl_ofr_002f_records (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  source_file text not null,
  source_row_number integer not null check (source_row_number > 0),
  record_kind text not null check (record_kind in (
    'COMPANY_CREDENTIAL','BRANCH_CREDENTIAL','MLO_CREDENTIAL','MLO_PENDING'
  )),
  source_record_id text not null,
  row_fingerprint text not null check (row_fingerprint ~ '^[a-f0-9]{64}$'),
  source_scope text not null check (source_scope in ('ACTIVE_SNAPSHOT','ALL_STATUS_LEDGER')),
  company_nmls_id text,
  branch_nmls_id text,
  individual_nmls_id text,
  related_nmls_id text,
  license_number text,
  license_class text,
  source_native_status text,
  normalized_status text,
  status_date_raw text,
  status_effective_on date,
  original_date_raw text,
  initial_approval_on date,
  renewed_through_year text,
  name_raw text,
  name_normalized text,
  address_raw jsonb not null default '{}'::jsonb,
  contact_raw jsonb not null default '{}'::jsonb,
  raw_record jsonb not null,
  normalized_record jsonb not null,
  report_current_as_of date not null,
  report_generated_at timestamp without time zone not null,
  created_at timestamptz not null default now(),
  unique (source_dataset, source_file, source_row_number),
  unique (source_dataset, row_fingerprint)
);

create index if not exists idx_fl_002f_company
  on public.staging_fl_ofr_002f_records (company_nmls_id);
create index if not exists idx_fl_002f_branch
  on public.staging_fl_ofr_002f_records (branch_nmls_id);
create index if not exists idx_fl_002f_person
  on public.staging_fl_ofr_002f_records (individual_nmls_id);
create index if not exists idx_fl_002f_license
  on public.staging_fl_ofr_002f_records (license_number);

create table if not exists public.lender_regulatory_observations (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  source_file text not null,
  source_record_id text not null,
  observation_family text not null check (observation_family in (
    'CREDENTIAL_SNAPSHOT','PENDING_APPLICATION','ADDRESS_CONTACT_SNAPSHOT',
    'WORK_CLASSIFICATION','SOURCE_GEOGRAPHY_ANOMALY','SOURCE_NAME_OBSERVATION'
  )),
  subject_type text not null check (subject_type in (
    'NMLS_INSTITUTION','NMLS_BRANCH','NMLS_PERSON'
  )),
  subject_identifier text not null,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  license_number text,
  license_class text,
  source_native_status text,
  normalized_status text,
  status_effective_on date,
  source_effective_date_raw text,
  observed_on date not null,
  classification text not null check (classification in (
    'INTERNAL_ONLY','REVIEW_REQUIRED','ATTACHED_EXACT','UNRESOLVED'
  )),
  raw_value jsonb not null,
  normalized_value jsonb not null,
  row_fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (source_dataset, source_record_id, observation_family)
);

create index if not exists idx_reg_obs_subject
  on public.lender_regulatory_observations (subject_type, subject_identifier, observed_on);
create index if not exists idx_reg_obs_entity
  on public.lender_regulatory_observations (entity_id, observed_on);

create table if not exists public.lender_relationship_observations (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  source_file text not null,
  source_record_id text not null,
  relationship_class text not null check (relationship_class in (
    'BRANCH_PARENT','MLO_SPONSORSHIP','BRANCH_MANAGER'
  )),
  from_identifier_type text not null,
  from_identifier_value text not null,
  to_identifier_type text not null,
  to_identifier_value text not null,
  from_entity_id uuid references public.lender_national_entities(id) on delete set null,
  to_entity_id uuid references public.lender_national_entities(id) on delete set null,
  source_native_status text,
  normalized_status text,
  relationship_effective_on date,
  observed_on date not null,
  classification text not null check (classification in (
    'INTERNAL_ONLY','REVIEW_REQUIRED','ATTACHED_EXACT','UNRESOLVED','QUARANTINED'
  )),
  raw_value jsonb not null default '{}'::jsonb,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (source_dataset, source_record_id, relationship_class),
  unique (source_dataset, fingerprint)
);

create index if not exists idx_rel_obs_from
  on public.lender_relationship_observations (from_identifier_type, from_identifier_value);
create index if not exists idx_rel_obs_to
  on public.lender_relationship_observations (to_identifier_type, to_identifier_value);

create table if not exists public.lender_ingest_runs (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  ingest_fingerprint text not null,
  mode text not null check (mode in ('DRY_RUN','EXECUTE','VERIFY')),
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null check (status in ('RUNNING','PASSED','FAILED')),
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, ingest_fingerprint, mode)
);

comment on table public.lender_source_artifacts is
  'Immutable source-file inventory. FL-LEND-002F does not expose this through public product APIs.';
comment on table public.staging_fl_ofr_002f_records is
  'Raw plus normalized PRR 141437 records. No identity or publication semantics.';
comment on table public.lender_regulatory_observations is
  'Append-only dated source observations. Never a public-profile minting input by itself.';
comment on table public.lender_relationship_observations is
  'Status-aware relationship history. Requested sponsorship is not accepted sponsorship.';

alter table public.lender_source_artifacts enable row level security;
alter table public.lender_source_artifacts force row level security;
alter table public.staging_fl_ofr_002f_records enable row level security;
alter table public.staging_fl_ofr_002f_records force row level security;
alter table public.lender_regulatory_observations enable row level security;
alter table public.lender_regulatory_observations force row level security;
alter table public.lender_relationship_observations enable row level security;
alter table public.lender_relationship_observations force row level security;
alter table public.lender_ingest_runs enable row level security;
alter table public.lender_ingest_runs force row level security;

drop policy if exists "Service role manages source artifacts" on public.lender_source_artifacts;
drop policy if exists "Service role manages 002f staging" on public.staging_fl_ofr_002f_records;
drop policy if exists "Service role manages regulatory observations" on public.lender_regulatory_observations;
drop policy if exists "Service role manages relationship observations" on public.lender_relationship_observations;
drop policy if exists "Service role manages ingest runs" on public.lender_ingest_runs;

create policy "Service role manages source artifacts"
  on public.lender_source_artifacts for all to service_role using (true) with check (true);
create policy "Service role manages 002f staging"
  on public.staging_fl_ofr_002f_records for all to service_role using (true) with check (true);
create policy "Service role manages regulatory observations"
  on public.lender_regulatory_observations for all to service_role using (true) with check (true);
create policy "Service role manages relationship observations"
  on public.lender_relationship_observations for all to service_role using (true) with check (true);
create policy "Service role manages ingest runs"
  on public.lender_ingest_runs for all to service_role using (true) with check (true);

revoke all on table public.lender_source_artifacts from anon, authenticated, public;
revoke all on table public.staging_fl_ofr_002f_records from anon, authenticated, public;
revoke all on table public.lender_regulatory_observations from anon, authenticated, public;
revoke all on table public.lender_relationship_observations from anon, authenticated, public;
revoke all on table public.lender_ingest_runs from anon, authenticated, public;
grant all on table public.lender_source_artifacts to service_role;
grant all on table public.staging_fl_ofr_002f_records to service_role;
grant all on table public.lender_regulatory_observations to service_role;
grant all on table public.lender_relationship_observations to service_role;
grant all on table public.lender_ingest_runs to service_role;
