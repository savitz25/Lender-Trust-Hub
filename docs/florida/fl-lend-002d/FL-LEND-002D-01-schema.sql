-- FL-LEND-002D-01-schema.sql
-- Paste in Supabase SQL Editor on project hidcrbexurginnuqgipx (Lender-Trust-Hub).
-- Additive only. No DROP of national tables. No CREATE lender_state_licenses.

begin;

create extension if not exists "uuid-ossp";

do $$
begin
  if to_regclass('public.lender_state_licenses') is null
     or to_regclass('public.lender_national_entities') is null
     or to_regclass('public.lender_identifiers') is null
     or to_regclass('public.lender_profile_intelligence') is null then
    raise exception 'FL-LEND-002D STOP: national graph or lender_state_licenses missing';
  end if;
end $$;

alter table public.lender_state_licenses
  add column if not exists source_clock text;

-- Production already expanded lender_state_licenses_license_class_check to
-- MBR, MBRB, MLD, MLDB, LO, MLS, MLSB. Do not DROP or recreate that constraint.

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
      check (license_class in ('MLD','MBR','MLDB','MBRB','LO','MLS','MLSB'));
  elsif def not ilike '%MLS%' then
    raise exception 'FL-LEND-002D STOP: license_class check omits MLS/MLSB; DROP is forbidden. Constraint %', conname;
  end if;
end $$;

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
  source_clock text not null check (source_clock in ('monthly_full', 'nmls_active')),
  source_dataset text not null,
  source_record_id text not null,
  source_observed_on date,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, source_record_id)
);
create index if not exists idx_license_obs_license on public.lender_state_license_observations (jurisdiction, license_number);
alter table public.lender_state_license_observations enable row level security;
drop policy if exists "Service role manage lender_state_license_observations" on public.lender_state_license_observations;
create policy "Service role manage lender_state_license_observations"
  on public.lender_state_license_observations for all using (auth.role() = 'service_role');
grant all on table public.lender_state_license_observations to service_role;
revoke all on table public.lender_state_license_observations from anon, authenticated, public;

create table if not exists public.lender_source_identity_resolutions (
  id uuid primary key,
  identifier_type text not null,
  identifier_value text not null,
  source_dataset text not null,
  resolution_class text not null check (
    resolution_class in (
      'ATTACHED_EXISTING_EXACT_NMLS',
      'UNRESOLVED_SOURCE_COMPANY_NMLS',
      'MULTI_ENTITY_CONFLICT',
      'MALFORMED'
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
alter table public.lender_source_identity_resolutions enable row level security;
drop policy if exists "Service role manage lender_source_identity_resolutions" on public.lender_source_identity_resolutions;
create policy "Service role manage lender_source_identity_resolutions"
  on public.lender_source_identity_resolutions for all using (auth.role() = 'service_role');
grant all on table public.lender_source_identity_resolutions to service_role;
revoke all on table public.lender_source_identity_resolutions from anon, authenticated, public;

-- Isolated staging (ingestion infrastructure, not product).
create table if not exists public.staging_fl_ofr_companies (
  company_nmls_id text primary key,
  legal_name text,
  source_families text,
  source_record_keys text
);
create table if not exists public.staging_fl_ofr_company_credentials (
  company_nmls_id text,
  license_number text,
  license_class text,
  ofr_status text,
  initial_approval_on date,
  status_effective_on date,
  source_clock text,
  source_dataset text,
  source_record_id text,
  source_observed_on date,
  firm_name text,
  prim_address1 text,
  prim_address2 text,
  prim_city text,
  prim_county text,
  prim_state text,
  prim_zip text,
  phone text,
  servicer_flag text,
  raw_metadata text
);
create table if not exists public.staging_fl_ofr_branches (
  branch_nmls_id text,
  parent_company_nmls_id text,
  license_number text,
  license_class text,
  ofr_status text,
  source_clock text,
  source_dataset text,
  source_record_id text,
  source_observed_on date,
  firm_name text,
  address1 text,
  city text,
  state text,
  zip text,
  email text,
  phone text
);
create table if not exists public.staging_fl_ofr_mlos (
  individual_nmls_id text,
  fl_lo_license text,
  ofr_status text,
  person_last text,
  person_first text,
  person_middle text,
  source_clock text,
  source_dataset text,
  source_record_id text,
  source_observed_on date,
  initial_approval_on date,
  status_effective_on date
);
create table if not exists public.staging_fl_ofr_sponsorships (
  individual_nmls_id text,
  sponsor_company_nmls_id text,
  source_dataset text,
  source_record_id text,
  source_observed_on date,
  sponsorship_status text
);
create table if not exists public.staging_fl_ofr_business_contacts (
  company_nmls_id text,
  contact_kind text,
  phone text,
  email text,
  address1 text,
  city text,
  state text,
  zip text,
  classification text,
  source_dataset text,
  source_record_id text,
  source_observed_on date
);
create table if not exists public.staging_fl_ofr_person_contacts (
  individual_nmls_id text,
  contact_kind text,
  email text,
  classification text,
  source_dataset text,
  source_record_id text,
  source_observed_on date
);

do $$
declare t text;
begin
  foreach t in array array[
    'staging_fl_ofr_companies','staging_fl_ofr_company_credentials','staging_fl_ofr_branches',
    'staging_fl_ofr_mlos','staging_fl_ofr_sponsorships','staging_fl_ofr_business_contacts',
    'staging_fl_ofr_person_contacts'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated, public', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

commit;
