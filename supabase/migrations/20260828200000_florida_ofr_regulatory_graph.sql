-- FL-LEND-002B — Additive Florida OFR/NMLS regulatory graph attach.
-- Reuses the live national identity spine. Does not replace it. Does not create a v2 graph.
-- Does not CREATE lender_state_licenses: that table already exists in Production
-- without a matching CREATE in the intel-004 git lineage. This migration only
-- adds columns/constraints and new observation/resolution tables.

do $$
begin
  if to_regclass('public.lender_state_licenses') is null then
    raise exception 'FL-LEND-002B STOP: public.lender_state_licenses is missing. Introspect Production before inventing a licenses table.';
  end if;
  if to_regclass('public.lender_national_entities') is null
     or to_regclass('public.lender_identifiers') is null
     or to_regclass('public.lender_profile_intelligence') is null then
    raise exception 'FL-LEND-002B STOP: national graph tables are missing.';
  end if;
end $$;

alter table public.lender_state_licenses
  add column if not exists source_clock text;

comment on column public.lender_state_licenses.source_clock is
  'monthly_full = OFR website extract including Expired/Terminated. nmls_active = NMLS PRR active-oriented roster. Do not collapse.';

-- License-class support: add a check only when none exists.
-- Never DROP an existing constraint (FL-LEND-002C: no destructive DDL).
do $$
declare
  conname text;
  def text;
begin
  select c.conname, pg_get_constraintdef(c.oid)
    into conname, def
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'lender_state_licenses'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%license_class%';
  if conname is null then
    alter table public.lender_state_licenses
      add constraint lender_state_licenses_license_class_check
      check (
        license_class in (
          'MLD', 'MBR', 'MLDB', 'MBRB', 'LO', 'MLS', 'MLSB'
        )
      );
  elsif def not ilike '%MLS%' then
    raise exception
      'FL-LEND-002C STOP: existing license_class check omits MLS/MLSB and DROP is forbidden. Constraint: %',
      conname;
  end if;
end $$;

comment on table public.lender_state_licenses is
  'Florida (and future state) regulatory credentials. Classes remain distinct: MLD, MBR, MLDB, MBRB, LO, MLS, MLSB. MLS is the official Florida Mortgage Lender Servicer License, not the national servicer-role evidence family.';

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
      'ATTACHED_EXISTING_EXACT_NMLS',
      'ATTACHED_EXISTING_ID',
      'CROSSWALK_ATTACHED',
      'MATCH_CANDIDATE_REVIEWED',
      'NET_NEW_CONFIRMED',
      'REVIEW_REQUIRED',
      'IDENTITY_CONFLICT',
      'MULTI_ENTITY_CONFLICT',
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
