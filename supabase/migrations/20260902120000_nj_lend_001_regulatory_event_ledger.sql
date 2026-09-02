-- NJ-LEND-001 — reusable regulatory-document / multi-party enforcement ledger.
-- Additive, internal-only. No public projection, no state-silo tables, no customer-claim changes.
-- Source adapters may be NJ-named; persisted structures are lender-wide.

-- ------------------------------------------------------------
-- Expand existing observation and ingest-run vocabularies.
-- ------------------------------------------------------------
alter table public.lender_regulatory_observations
  drop constraint if exists lender_regulatory_observations_observation_family_check;
alter table public.lender_regulatory_observations
  add constraint lender_regulatory_observations_observation_family_check
  check (observation_family in (
    'CREDENTIAL_SNAPSHOT','PENDING_APPLICATION','ADDRESS_CONTACT_SNAPSHOT',
    'WORK_CLASSIFICATION','SOURCE_GEOGRAPHY_ANOMALY','SOURCE_NAME_OBSERVATION',
    'ENFORCEMENT_ACTION','CHARTER_LIST_SNAPSHOT','LICENSE_VERIFICATION','SOURCE_COVERAGE'
  ));

alter table public.lender_regulatory_observations
  drop constraint if exists lender_regulatory_observations_subject_type_check;
alter table public.lender_regulatory_observations
  add constraint lender_regulatory_observations_subject_type_check
  check (subject_type in (
    'NMLS_INSTITUTION','NMLS_BRANCH','NMLS_PERSON',
    'STATE_LICENSE','FDIC_CERT','RSSD','NCUA_CHARTER',
    'REGULATORY_EVENT','FINANCIAL_INSTITUTION','INDIVIDUAL','OTHER'
  ));

alter table public.lender_relationship_observations
  drop constraint if exists lender_relationship_observations_relationship_class_check;
alter table public.lender_relationship_observations
  add constraint lender_relationship_observations_relationship_class_check
  check (relationship_class in (
    'BRANCH_PARENT','MLO_SPONSORSHIP','BRANCH_MANAGER','EVENT_RESPONDENT','LICENSE_HOLDER'
  ));

alter table public.lender_ingest_runs
  drop constraint if exists lender_ingest_runs_mode_check;
alter table public.lender_ingest_runs
  add constraint lender_ingest_runs_mode_check
  check (mode in (
    'DRY_RUN','EXECUTE','VERIFY','DISCOVER','DOWNLOAD','LOCAL_INPUT','INSPECT'
  ));

-- ------------------------------------------------------------
-- Source coverage (missing year is not zero enforcement)
-- ------------------------------------------------------------
create table if not exists public.lender_source_coverage (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  source_family text not null,
  source_year integer,
  source_page text not null,
  source_url text not null,
  source_hash text check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$'),
  coverage_state text not null check (coverage_state in (
    'ACQUIRED_COMPLETE','ACQUIRED_CURRENT_SNAPSHOT','ACQUIRED_PARTIAL_HISTORY',
    'PARTIAL_SOURCE_COVERAGE','SOURCE_NOT_ACQUIRED','SOURCE_ACCESS_BLOCKED',
    'SOURCE_AVAILABLE_BY_REQUEST','SOURCE_UNVERIFIED'
  )),
  retrieved_at timestamptz,
  source_as_of date,
  http_status integer,
  notes text,
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_dataset, source_family, source_url)
);

create index if not exists idx_lender_source_coverage_family_year
  on public.lender_source_coverage (source_family, source_year);

comment on table public.lender_source_coverage is
  'Official source-year acquisition state. A 404 or missing year is SOURCE_NOT_ACQUIRED, never a zero-enforcement finding.';

-- ------------------------------------------------------------
-- Source occurrences (index rows, including INDEX_ONLY)
-- ------------------------------------------------------------
create table if not exists public.lender_source_occurrences (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  source_family text not null,
  source_year integer,
  source_url text not null,
  index_location text not null,
  order_number text,
  respondent_caption text not null,
  action_date date,
  document_url text,
  acquisition_state text not null check (acquisition_state in (
    'DOCUMENT_DOWNLOADED','INDEX_ONLY','DOCUMENT_UNAVAILABLE','HTTP_404','SKIPPED_EXISTING_HASH'
  )),
  occurrence_fingerprint text not null check (occurrence_fingerprint ~ '^[a-f0-9]{64}$'),
  raw_value jsonb not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_dataset, occurrence_fingerprint)
);

create index if not exists idx_lender_source_occ_order
  on public.lender_source_occurrences (order_number);
create index if not exists idx_lender_source_occ_family_year
  on public.lender_source_occurrences (source_family, source_year);

comment on table public.lender_source_occurrences is
  'Immutable index-row occurrences. Duplicate URLs and year-page repeats are preserved as occurrences; order_number is an event identifier, never an entity identifier.';

-- ------------------------------------------------------------
-- Canonical regulatory documents
-- ------------------------------------------------------------
create table if not exists public.lender_regulatory_documents (
  id uuid primary key default uuid_generate_v4(),
  canonical_document_id text not null,
  order_number text,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  document_type text,
  source_url text,
  byte_length bigint not null default 0 check (byte_length >= 0),
  effective_date date,
  source_status text not null default 'CURRENT' check (source_status in (
    'CURRENT','RESCINDED','SUPERSEDED','UNKNOWN'
  )),
  text_extraction_state text not null default 'NOT_ATTEMPTED' check (text_extraction_state in (
    'EXTRACTED','IMAGE_ONLY','NOT_ATTEMPTED','FAILED','UNAVAILABLE'
  )),
  extracted_text_hash text check (extracted_text_hash is null or extracted_text_hash ~ '^[a-f0-9]{64}$'),
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  raw_metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (canonical_document_id),
  unique (content_hash)
);

comment on table public.lender_regulatory_documents is
  'Canonical document inventory keyed by content hash. Same PDF at several URLs is one document with several occurrences.';

-- ------------------------------------------------------------
-- Regulatory events
-- ------------------------------------------------------------
create table if not exists public.lender_regulatory_events (
  id uuid primary key default uuid_generate_v4(),
  event_id text not null,
  source_dataset text not null,
  source_family text not null,
  order_number text,
  event_class text not null,
  event_status text not null check (event_status in ('FINAL','PENDING','UNKNOWN')),
  action_date date,
  effective_date date,
  end_date date,
  civil_penalty_amount numeric,
  restitution_amount numeric,
  reimbursement_amount numeric,
  legal_citations text[] not null default '{}',
  document_id uuid references public.lender_regulatory_documents(id) on delete set null,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  monitoring_state text not null default 'baseline_only' check (monitoring_state in (
    'baseline_only','future_eligible','suppressed'
  )),
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_dataset, event_id)
);

create index if not exists idx_lender_reg_events_order
  on public.lender_regulatory_events (order_number);
create index if not exists idx_lender_reg_events_class
  on public.lender_regulatory_events (event_class, event_status);

comment on table public.lender_regulatory_events is
  'Official regulatory events. entity_id remains nullable. First corpus monitoring_state is baseline_only. Amounts are not duplicated across parties.';

-- ------------------------------------------------------------
-- Event parties (do not collapse respondent classes)
-- ------------------------------------------------------------
create table if not exists public.lender_regulatory_event_parties (
  id uuid primary key default uuid_generate_v4(),
  event_uuid uuid not null references public.lender_regulatory_events(id) on delete cascade,
  party_type text not null,
  legal_name text not null,
  role_in_order text not null default 'respondent',
  nmls_id text,
  fdic_cert text,
  rssd text,
  ncua_charter text,
  state_reference text,
  match_status text not null check (match_status in (
    'EXACT','HIGH_CONFIDENCE','REVIEW_REQUIRED','CONFLICT','UNRESOLVED',
    'UNSAFE_REJECTED','INTERNAL_ONLY_INDIVIDUAL'
  )),
  match_method text,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_lender_reg_parties_natural
  on public.lender_regulatory_event_parties (
    event_uuid, legal_name, party_type, coalesce(nmls_id, ''), coalesce(state_reference, '')
  );

create index if not exists idx_lender_reg_parties_nmls
  on public.lender_regulatory_event_parties (nmls_id);
create index if not exists idx_lender_reg_parties_match
  on public.lender_regulatory_event_parties (match_status);

comment on table public.lender_regulatory_event_parties is
  'Separately typed respondents. Individuals stay internal-only. Order numbers are never stored as entity identifiers.';

-- ------------------------------------------------------------
-- Identity match ledger
-- ------------------------------------------------------------
create table if not exists public.lender_identity_match_ledger (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  subject_fingerprint text not null check (subject_fingerprint ~ '^[a-f0-9]{64}$'),
  subject_name text not null,
  subject_class text not null,
  match_status text not null check (match_status in (
    'EXACT','HIGH_CONFIDENCE','REVIEW_REQUIRED','CONFLICT','UNRESOLVED',
    'UNSAFE_REJECTED','INTERNAL_ONLY_INDIVIDUAL'
  )),
  match_method text not null,
  identifier_type text,
  identifier_value text,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  evidence jsonb not null default '{}'::jsonb,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  created_at timestamptz not null default now(),
  unique (source_dataset, subject_fingerprint)
);

comment on table public.lender_identity_match_ledger is
  'Append-only match decisions. Unsafe name-only matches are rejected and never auto-attached.';

-- ------------------------------------------------------------
-- RLS — service_role only. Do not weaken customer-claim policies.
-- ------------------------------------------------------------
alter table public.lender_source_coverage enable row level security;
alter table public.lender_source_coverage force row level security;
alter table public.lender_source_occurrences enable row level security;
alter table public.lender_source_occurrences force row level security;
alter table public.lender_regulatory_documents enable row level security;
alter table public.lender_regulatory_documents force row level security;
alter table public.lender_regulatory_events enable row level security;
alter table public.lender_regulatory_events force row level security;
alter table public.lender_regulatory_event_parties enable row level security;
alter table public.lender_regulatory_event_parties force row level security;
alter table public.lender_identity_match_ledger enable row level security;
alter table public.lender_identity_match_ledger force row level security;

drop policy if exists "Service role manages source coverage" on public.lender_source_coverage;
drop policy if exists "Service role manages source occurrences" on public.lender_source_occurrences;
drop policy if exists "Service role manages regulatory documents" on public.lender_regulatory_documents;
drop policy if exists "Service role manages regulatory events" on public.lender_regulatory_events;
drop policy if exists "Service role manages regulatory event parties" on public.lender_regulatory_event_parties;
drop policy if exists "Service role manages identity match ledger" on public.lender_identity_match_ledger;

create policy "Service role manages source coverage"
  on public.lender_source_coverage for all to service_role using (true) with check (true);
create policy "Service role manages source occurrences"
  on public.lender_source_occurrences for all to service_role using (true) with check (true);
create policy "Service role manages regulatory documents"
  on public.lender_regulatory_documents for all to service_role using (true) with check (true);
create policy "Service role manages regulatory events"
  on public.lender_regulatory_events for all to service_role using (true) with check (true);
create policy "Service role manages regulatory event parties"
  on public.lender_regulatory_event_parties for all to service_role using (true) with check (true);
create policy "Service role manages identity match ledger"
  on public.lender_identity_match_ledger for all to service_role using (true) with check (true);

revoke all on table public.lender_source_coverage from anon, authenticated, public;
revoke all on table public.lender_source_occurrences from anon, authenticated, public;
revoke all on table public.lender_regulatory_documents from anon, authenticated, public;
revoke all on table public.lender_regulatory_events from anon, authenticated, public;
revoke all on table public.lender_regulatory_event_parties from anon, authenticated, public;
revoke all on table public.lender_identity_match_ledger from anon, authenticated, public;

grant all on table public.lender_source_coverage to service_role;
grant all on table public.lender_source_occurrences to service_role;
grant all on table public.lender_regulatory_documents to service_role;
grant all on table public.lender_regulatory_events to service_role;
grant all on table public.lender_regulatory_event_parties to service_role;
grant all on table public.lender_identity_match_ledger to service_role;
