-- NJ-LEND-002 — reusable state authority, program participation, market overlay, monitoring.
-- Additive, internal-only. No public projection, no NJ-only silos, no customer-claim changes.
-- Source adapters may be NJ-named; persisted structures are lender-wide.

-- ------------------------------------------------------------
-- Expand existing vocabularies (additive values only).
-- ------------------------------------------------------------
alter table public.lender_source_coverage
  drop constraint if exists lender_source_coverage_coverage_state_check;
alter table public.lender_source_coverage
  add constraint lender_source_coverage_coverage_state_check
  check (coverage_state in (
    'ACQUIRED_COMPLETE','ACQUIRED_CURRENT_SNAPSHOT','ACQUIRED_PARTIAL_HISTORY',
    'PARTIAL_SOURCE_COVERAGE','OPEN_SEARCH_ONLY','SOURCE_AVAILABLE_BY_REQUEST',
    'SOURCE_NOT_ACQUIRED','SOURCE_ACCESS_BLOCKED','SOURCE_UNVERIFIED'
  ));

alter table public.lender_regulatory_observations
  drop constraint if exists lender_regulatory_observations_observation_family_check;
alter table public.lender_regulatory_observations
  add constraint lender_regulatory_observations_observation_family_check
  check (observation_family in (
    'CREDENTIAL_SNAPSHOT','PENDING_APPLICATION','ADDRESS_CONTACT_SNAPSHOT',
    'WORK_CLASSIFICATION','SOURCE_GEOGRAPHY_ANOMALY','SOURCE_NAME_OBSERVATION',
    'ENFORCEMENT_ACTION','CHARTER_LIST_SNAPSHOT','LICENSE_VERIFICATION','SOURCE_COVERAGE',
    'PROGRAM_PARTICIPATION','SERVICER_LICENSE','LICENSE_STATUS','MARKET_OBSERVATION',
    'IDENTITY_MATCH','MONITORING_EVENT','POLICY_BULLETIN'
  ));

alter table public.lender_regulatory_observations
  drop constraint if exists lender_regulatory_observations_subject_type_check;
alter table public.lender_regulatory_observations
  add constraint lender_regulatory_observations_subject_type_check
  check (subject_type in (
    'NMLS_INSTITUTION','NMLS_BRANCH','NMLS_PERSON',
    'STATE_LICENSE','FDIC_CERT','RSSD','NCUA_CHARTER',
    'REGULATORY_EVENT','FINANCIAL_INSTITUTION','INDIVIDUAL','OTHER',
    'PROGRAM','STATE_MARKET','SERVICER','PARTICIPATING_LENDER'
  ));

alter table public.lender_relationship_observations
  drop constraint if exists lender_relationship_observations_relationship_class_check;
alter table public.lender_relationship_observations
  add constraint lender_relationship_observations_relationship_class_check
  check (relationship_class in (
    'BRANCH_PARENT','MLO_SPONSORSHIP','BRANCH_MANAGER','EVENT_RESPONDENT','LICENSE_HOLDER',
    'PROGRAM_PARTICIPANT','SERVICER_REGISTRATION','LICENSE_CLASS','CHARTER_TYPE'
  ));

alter table public.lender_entity_classifications
  drop constraint if exists lender_entity_classifications_family_check;
alter table public.lender_entity_classifications
  add constraint lender_entity_classifications_family_check
  check (family in (
    'DEPOSITORY_BANK','CREDIT_UNION','INDEPENDENT_MORTGAGE_BANK','MORTGAGE_BROKER',
    'SERVICER','WHOLESALE','CORRESPONDENT','FINTECH_DIRECT','COMMERCIAL','OTHER','UNKNOWN',
    'STATE_CHARTER','FEDERAL_CHARTER','OUT_OF_STATE_CHARTER','LIMITED_PURPOSE_TRUST'
  ));

alter table public.lender_entity_relationships
  drop constraint if exists lender_entity_relationships_relationship_type_check;
alter table public.lender_entity_relationships
  add constraint lender_entity_relationships_relationship_type_check
  check (relationship_type in (
    'SUBSIDIARY_OF','PARENT_OF','BRAND_OF','SUCCESSOR_TO','PREDECESSOR_OF',
    'ASSOCIATED_WITH','BELONGS_TO','BRANCH_OF','PROGRAM_PARTICIPANT_OF'
  ));

-- ------------------------------------------------------------
-- Program catalog (HFA / DPA / similar first-mortgage programs, any state)
-- ------------------------------------------------------------
create table if not exists public.lender_program_catalog (
  id uuid primary key default uuid_generate_v4(),
  program_key text not null,
  jurisdiction text not null,
  official_name text not null,
  program_class text not null,
  first_mortgage_required boolean,
  loan_type_raw text,
  rate_structure text,
  term_raw text,
  government_insurer_eligibility text,
  first_time_buyer_requirement text,
  dpa_available boolean,
  participating_lender_required boolean,
  source_url text not null,
  source_hash text check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$'),
  source_effective_on date,
  retrieved_at timestamptz,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  caveat text not null default '',
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jurisdiction, program_key)
);

create index if not exists idx_lender_program_catalog_jurisdiction
  on public.lender_program_catalog (jurisdiction, program_class);

comment on table public.lender_program_catalog is
  'Official housing-finance / first-mortgage program catalog. Participation is not an endorsement. Not a consumer eligibility calculator.';

-- ------------------------------------------------------------
-- Program geographic limits (income, purchase price, DPA amounts)
-- ------------------------------------------------------------
create table if not exists public.lender_program_limit_observations (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  jurisdiction text not null,
  program_key text not null,
  limit_family text not null check (limit_family in (
    'INCOME_LIMIT','PURCHASE_PRICE_LIMIT','DPA_AMOUNT','MORTGAGE_AMOUNT_LIMIT','OTHER'
  )),
  geo_grain text not null check (geo_grain in ('state','county_group','county','urban_target_area','other')),
  geography_label text not null,
  county_names text[] not null default '{}',
  household_size_label text,
  unit_count integer,
  amount_numeric numeric,
  amount_raw text,
  source_url text not null,
  source_hash text check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$'),
  source_effective_on date,
  observed_on date not null,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  caveat text not null default '',
  row_fingerprint text not null check (row_fingerprint ~ '^[a-f0-9]{64}$'),
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, row_fingerprint)
);

create index if not exists idx_lender_program_limits_program
  on public.lender_program_limit_observations (jurisdiction, program_key, limit_family);

comment on table public.lender_program_limit_observations is
  'Dated official program limits. County presence is not borrower qualification. Urban Target Area lists are not parcel-level eligibility.';

-- ------------------------------------------------------------
-- Program participation (NJHMFA participating lender, future HFAs)
-- ------------------------------------------------------------
create table if not exists public.lender_program_participations (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  jurisdiction text not null,
  program_key text not null default 'ALL_CURRENT_PROGRAMS',
  participation_label text not null,
  subject_name text not null,
  subject_name_normalized text not null,
  nmls_id text,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  match_status text not null check (match_status in (
    'EXACT','HIGH_CONFIDENCE','REVIEW_REQUIRED','CONFLICT','UNRESOLVED','UNSAFE_REJECTED'
  )),
  match_method text,
  cohort text not null check (cohort in (
    'OFFICIAL_FULL_LIST','VOLUME_ORDERED_SUBSET','PROGRAM_SUBSET','PAIRING_FORM_SUBSET','OTHER'
  )),
  source_order integer,
  phone_raw text,
  source_url text not null,
  source_hash text check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$'),
  source_effective_on date,
  observed_on date not null,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  caveat text not null default '',
  row_fingerprint text not null check (row_fingerprint ~ '^[a-f0-9]{64}$'),
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, row_fingerprint)
);

create index if not exists idx_lender_program_part_name
  on public.lender_program_participations (subject_name_normalized);
create index if not exists idx_lender_program_part_nmls
  on public.lender_program_participations (nmls_id);
create index if not exists idx_lender_program_part_entity
  on public.lender_program_participations (entity_id);

comment on table public.lender_program_participations is
  'Official program participation observations. Participation is not approved/recommended/preferred/safer. Source order is not a quality rank. Pairing-form subsets are not the full participating universe.';

-- ------------------------------------------------------------
-- Policy / bulletin index (HFA lender policy, reusable)
-- ------------------------------------------------------------
create table if not exists public.lender_policy_bulletins (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  jurisdiction text not null,
  bulletin_number text not null,
  title text not null,
  bulletin_date date,
  effective_date date,
  affected_programs text[] not null default '{}',
  source_url text not null,
  source_hash text check (source_hash is null or source_hash ~ '^[a-f0-9]{64}$'),
  current_or_superseded text not null default 'CURRENT' check (current_or_superseded in (
    'CURRENT','SUPERSEDED','UNKNOWN'
  )),
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  caveat text not null default 'Policy bulletin is not adverse evidence against participating lenders.',
  row_fingerprint text not null check (row_fingerprint ~ '^[a-f0-9]{64}$'),
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, bulletin_number),
  unique (source_dataset, row_fingerprint)
);

comment on table public.lender_policy_bulletins is
  'Official lender-policy / bulletin index. A bulletin is not an enforcement action and is not a quality score.';

-- ------------------------------------------------------------
-- State-market observations (HMDA overlays and similar; not a ranking)
-- ------------------------------------------------------------
create table if not exists public.lender_state_market_observations (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  data_year integer not null,
  geo_grain text not null check (geo_grain in ('national','state','county')),
  state_code text,
  county_fips text,
  county_name text,
  metric_key text not null,
  numerator numeric,
  denominator numeric,
  value_numeric numeric,
  value_raw text,
  computation text,
  caveat text not null default '',
  source_url text,
  public_eligibility text not null default 'internal_only' check (public_eligibility in (
    'internal_only','review_required','public_candidate'
  )),
  row_fingerprint text not null check (row_fingerprint ~ '^[a-f0-9]{64}$'),
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, row_fingerprint)
);

create unique index if not exists uq_lender_state_market_natural
  on public.lender_state_market_observations (
    source_dataset, data_year, geo_grain, coalesce(state_code, ''), coalesce(county_fips, ''), metric_key
  );

comment on table public.lender_state_market_observations is
  'Descriptive state/county market overlays. HMDA denials are not a quality score. Disparities do not prove discrimination. Not a county publication page.';

-- ------------------------------------------------------------
-- Monitoring events (first snapshot baseline_only; no historical customer alerts)
-- ------------------------------------------------------------
create table if not exists public.lender_monitoring_events (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  event_family text not null check (event_family in (
    'LICENSE_CHANGE','SERVICER_CHANGE','PROGRAM_CHANGE','HMDA_VINTAGE',
    'ENFORCEMENT_CHANGE','IDENTITY_CHANGE','COVERAGE_CHANGE','SUPPRESSED'
  )),
  stable_key text not null,
  observed_on date not null,
  monitoring_state text not null default 'baseline_only' check (monitoring_state in (
    'baseline_only','future_eligible','suppressed','alerted'
  )),
  suppression_reason text,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  raw_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, event_family, stable_key, observed_on)
);

comment on table public.lender_monitoring_events is
  'First corpus is baseline_only. Do not emit historical customer alerts. Formatting-only or same-hash URL changes are suppressed.';

-- ------------------------------------------------------------
-- RLS — service_role only. Do not weaken customer-claim policies.
-- ------------------------------------------------------------
alter table public.lender_program_catalog enable row level security;
alter table public.lender_program_catalog force row level security;
alter table public.lender_program_limit_observations enable row level security;
alter table public.lender_program_limit_observations force row level security;
alter table public.lender_program_participations enable row level security;
alter table public.lender_program_participations force row level security;
alter table public.lender_policy_bulletins enable row level security;
alter table public.lender_policy_bulletins force row level security;
alter table public.lender_state_market_observations enable row level security;
alter table public.lender_state_market_observations force row level security;
alter table public.lender_monitoring_events enable row level security;
alter table public.lender_monitoring_events force row level security;

drop policy if exists "Service role manages program catalog" on public.lender_program_catalog;
drop policy if exists "Service role manages program limits" on public.lender_program_limit_observations;
drop policy if exists "Service role manages program participations" on public.lender_program_participations;
drop policy if exists "Service role manages policy bulletins" on public.lender_policy_bulletins;
drop policy if exists "Service role manages state market observations" on public.lender_state_market_observations;
drop policy if exists "Service role manages monitoring events" on public.lender_monitoring_events;

create policy "Service role manages program catalog"
  on public.lender_program_catalog for all to service_role using (true) with check (true);
create policy "Service role manages program limits"
  on public.lender_program_limit_observations for all to service_role using (true) with check (true);
create policy "Service role manages program participations"
  on public.lender_program_participations for all to service_role using (true) with check (true);
create policy "Service role manages policy bulletins"
  on public.lender_policy_bulletins for all to service_role using (true) with check (true);
create policy "Service role manages state market observations"
  on public.lender_state_market_observations for all to service_role using (true) with check (true);
create policy "Service role manages monitoring events"
  on public.lender_monitoring_events for all to service_role using (true) with check (true);

revoke all on table public.lender_program_catalog from anon, authenticated, public;
revoke all on table public.lender_program_limit_observations from anon, authenticated, public;
revoke all on table public.lender_program_participations from anon, authenticated, public;
revoke all on table public.lender_policy_bulletins from anon, authenticated, public;
revoke all on table public.lender_state_market_observations from anon, authenticated, public;
revoke all on table public.lender_monitoring_events from anon, authenticated, public;

grant all on table public.lender_program_catalog to service_role;
grant all on table public.lender_program_limit_observations to service_role;
grant all on table public.lender_program_participations to service_role;
grant all on table public.lender_policy_bulletins to service_role;
grant all on table public.lender_state_market_observations to service_role;
grant all on table public.lender_monitoring_events to service_role;
