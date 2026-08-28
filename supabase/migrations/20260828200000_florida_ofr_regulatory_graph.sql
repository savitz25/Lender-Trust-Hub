-- FL-LEND-002 — Additive Florida OFR/NMLS regulatory graph attach.
-- Reuses the national identity spine. Does not replace it. Does not create a v2 graph.
-- Does not alter public.lenders, slugs, sitemaps, Wave-1, or lender_profile_intelligence.
-- Unresolved company NMLS values are held — never minted as automatic institutions.

-- Production already has lender_state_licenses (CREATE was not in intel-004 git).
-- IF NOT EXISTS reconstructs the table only on a fresh database.

create table if not exists public.lender_state_licenses (
  id uuid primary key,
  jurisdiction text not null,
  license_number text not null,
  license_class text not null,
  entity_class text,
  nmls_id text,
  ofr_status text,
  status_effective_on date,
  initial_approval_on date,
  servicer_flag text,
  firm_name text,
  person_last text,
  person_first text,
  person_middle text,
  phone text,
  prim_address1 text,
  prim_address2 text,
  prim_city text,
  prim_county text,
  prim_state text,
  prim_zip text,
  mail_address1 text,
  mail_address2 text,
  mail_city text,
  mail_state text,
  mail_zip text,
  institution_id uuid references public.lender_national_entities(id) on delete set null,
  identifier_id uuid references public.lender_identifiers(id) on delete set null,
  attribution_confidence text,
  match_method text,
  source_dataset text,
  source_record_id text,
  source_observed_on date,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jurisdiction, license_number)
);

create index if not exists idx_state_licenses_nmls
  on public.lender_state_licenses (nmls_id);
create index if not exists idx_state_licenses_class
  on public.lender_state_licenses (license_class);
create index if not exists idx_state_licenses_institution
  on public.lender_state_licenses (institution_id);

comment on table public.lender_state_licenses is
  'Florida (and future state) regulatory credentials. One row per (jurisdiction, license_number). Classes remain distinct: MLD, MBR, MLDB, MBRB, LO, MLS, MLSB. Not an institution table.';

alter table public.lender_state_licenses
  add column if not exists source_clock text;

comment on column public.lender_state_licenses.source_clock is
  'monthly_full = OFR website extract including Expired/Terminated. nmls_active = NMLS PRR active-oriented roster. Do not collapse.';

-- Expand license_class check if a prior migration constrained it to MLD/MBR/MLDB/MBRB/LO.
do $$
declare
  conname text;
begin
  select c.conname into conname
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'lender_state_licenses'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%license_class%';
  if conname is not null then
    execute format('alter table public.lender_state_licenses drop constraint %I', conname);
    alter table public.lender_state_licenses
      add constraint lender_state_licenses_license_class_check
      check (
        license_class in (
          'MLD', 'MBR', 'MLDB', 'MBRB', 'LO', 'MLS', 'MLSB'
        )
      );
  end if;
end $$;

-- Temporal observations: monthly full universe vs NMLS active-oriented roster.
create table if not exists public.lender_state_license_observations (
  id uuid primary key,
  jurisdiction text not null,
  license_number text not null,
  license_class text not null,
  nmls_id text,
  ofr_status text,
  status_effective_on date,
  initial_approval_on date,
  servicer_flag text,
  source_clock text not null check (
    source_clock in ('monthly_full', 'nmls_active')
  ),
  source_dataset text not null,
  source_record_id text not null,
  source_observed_on date,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, source_record_id)
);

create index if not exists idx_license_obs_license
  on public.lender_state_license_observations (jurisdiction, license_number);
create index if not exists idx_license_obs_nmls
  on public.lender_state_license_observations (nmls_id);
create index if not exists idx_license_obs_clock
  on public.lender_state_license_observations (source_clock, license_class);

comment on table public.lender_state_license_observations is
  'Point-in-time Florida credential observations. Monthly OFR and NMLS PRR clocks stay separate.';

alter table public.lender_state_license_observations enable row level security;

drop policy if exists "Service role manage lender_state_license_observations"
  on public.lender_state_license_observations;
create policy "Service role manage lender_state_license_observations"
  on public.lender_state_license_observations for all
  using (auth.role() = 'service_role');

grant all on table public.lender_state_license_observations to service_role;
revoke all on table public.lender_state_license_observations from anon, authenticated, public;

-- Company NMLS resolution ledger. Unresolved rows are holds, not institutions.
create table if not exists public.lender_source_identity_resolutions (
  id uuid primary key,
  identifier_type text not null,
  identifier_value text not null,
  source_dataset text not null,
  resolution_class text not null check (
    resolution_class in (
      'ATTACHED_EXISTING_ID',
      'CROSSWALK_ATTACHED',
      'MATCH_CANDIDATE_REVIEWED',
      'NET_NEW_CONFIRMED',
      'REVIEW_REQUIRED',
      'IDENTITY_CONFLICT',
      'MALFORMED',
      'UNRESOLVED_SOURCE_COMPANY_NMLS'
    )
  ),
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  match_method text,
  notes text,
  observed_at date,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (identifier_type, identifier_value, source_dataset)
);

create index if not exists idx_src_ident_res_class
  on public.lender_source_identity_resolutions (resolution_class);
create index if not exists idx_src_ident_res_entity
  on public.lender_source_identity_resolutions (entity_id);

comment on table public.lender_source_identity_resolutions is
  'FL-LEND-002 company NMLS attach ledger. UNRESOLVED_SOURCE_COMPANY_NMLS is not a net-new institution.';

alter table public.lender_source_identity_resolutions enable row level security;

drop policy if exists "Service role manage lender_source_identity_resolutions"
  on public.lender_source_identity_resolutions;
create policy "Service role manage lender_source_identity_resolutions"
  on public.lender_source_identity_resolutions for all
  using (auth.role() = 'service_role');

grant all on table public.lender_source_identity_resolutions to service_role;
revoke all on table public.lender_source_identity_resolutions from anon, authenticated, public;

-- RLS for reconstructed licenses table (no-op if already enabled).
alter table public.lender_state_licenses enable row level security;

drop policy if exists "Service role manage lender_state_licenses" on public.lender_state_licenses;
create policy "Service role manage lender_state_licenses"
  on public.lender_state_licenses for all
  using (auth.role() = 'service_role');

grant all on table public.lender_state_licenses to service_role;
revoke all on table public.lender_state_licenses from anon, authenticated, public;
