-- LEND-NAT-003 — Canonical HMDA observations (LEI primary, institution nullable)
-- Additive. Does not alter public.lenders or identity tables.
-- Grain: data_year + LEI + geo_grain + state + county_fips
-- Institution ID is attribution metadata, not the natural key.

create table if not exists public.lender_hmda_observations (
  id uuid primary key,
  data_year integer not null,
  lei text not null,
  lei_identifier_id uuid references public.lender_identifiers(id) on delete set null,
  institution_id uuid references public.lender_national_entities(id) on delete set null,
  geo_grain text not null check (geo_grain in ('national', 'state', 'county')),
  state_code text,
  county_fips text,
  applications integer not null default 0,
  originations integer not null default 0,
  denials integer,
  apps_conventional integer,
  apps_fha integer,
  apps_va integer,
  apps_usda_other integer,
  apps_other_loan_type integer,
  orig_conventional integer,
  orig_fha integer,
  orig_va integer,
  orig_usda_other integer,
  orig_other_loan_type integer,
  -- Purpose-of-application fields. NULL at LEI grain in 2025 summaries.
  -- Do not treat as originations.
  purchase_applications integer,
  refinance_applications integer,
  -- Origination-by-purpose: unsupported in current 2025 LEI summaries.
  purchase_originations integer,
  refinance_originations integer,
  attribution_confidence text not null check (
    attribution_confidence in ('confirmed', 'high_confidence', 'review_required', 'unresolved')
  ),
  source_dataset text not null,
  source_vintage text not null default 'HMDA 2025',
  source_observed_date date,
  ingested_at timestamptz not null default now(),
  raw_metadata jsonb not null default '{}'::jsonb,
  check (lei ~ '^[A-Z0-9]{20}$'),
  check (
    (geo_grain = 'national' and state_code is null and county_fips is null)
    or (geo_grain = 'state' and state_code is not null and county_fips is null)
    or (geo_grain = 'county' and state_code is not null and county_fips is not null)
  )
);

create unique index if not exists uq_lender_hmda_obs_natural
  on public.lender_hmda_observations (
    data_year,
    lei,
    geo_grain,
    coalesce(state_code, ''),
    coalesce(county_fips, '')
  );

create index if not exists idx_lender_hmda_obs_lei
  on public.lender_hmda_observations (lei);
create index if not exists idx_lender_hmda_obs_institution
  on public.lender_hmda_observations (institution_id);
create index if not exists idx_lender_hmda_obs_year_geo
  on public.lender_hmda_observations (data_year, geo_grain, state_code);

comment on table public.lender_hmda_observations is
  'HMDA research observations. LEI is the source key. institution_id is nullable attribution. Purchase/refinance application-purpose counts are not originations.';

comment on column public.lender_hmda_observations.purchase_applications is
  'HMDA loan purpose = purchase (applications). Not purchase originations.';
comment on column public.lender_hmda_observations.refinance_applications is
  'HMDA loan purpose = refinance (applications). Not refinance originations.';
comment on column public.lender_hmda_observations.purchase_originations is
  'Originations with purchase purpose. NULL when source summary does not provide it.';
comment on column public.lender_hmda_observations.denials is
  'Denial counts are activity evidence, not a quality score.';

alter table public.lender_hmda_observations enable row level security;

drop policy if exists "Service role manage lender_hmda_observations" on public.lender_hmda_observations;
create policy "Service role manage lender_hmda_observations"
  on public.lender_hmda_observations for all
  using (auth.role() = 'service_role');
