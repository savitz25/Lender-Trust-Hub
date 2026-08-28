-- FL-LEND-006 — Internal Florida company-profile projections.
-- Additive. Does not alter lender_profile_intelligence (stays 8,447).
-- Does not publish routes, sitemaps, or national 180/181 cohorts.
-- One confirmed Chapter 494 company identity → one internal Florida projection.

create table if not exists public.lender_state_company_profiles (
  institution_id uuid primary key references public.lender_national_entities(id) on delete cascade,
  jurisdiction text not null default 'FL' check (jurisdiction = 'FL'),
  contract_version text not null default 'fl-lend-provider-v1' check (contract_version = 'fl-lend-provider-v1'),
  nmls_id text not null,
  slug text not null,
  profile jsonb not null,
  content_sha256 text not null,
  credential_count integer not null,
  confirmed_ofr_event_count integer not null default 0,
  has_national_snapshot boolean not null default false,
  public_projection_status text not null default 'internal_only' check (
    public_projection_status = 'internal_only'
  ),
  computed_at timestamptz not null default now(),
  unique (slug),
  unique (jurisdiction, nmls_id)
);

create index if not exists idx_state_co_prof_nmls
  on public.lender_state_company_profiles (nmls_id);
create index if not exists idx_state_co_prof_slug
  on public.lender_state_company_profiles (slug);
create index if not exists idx_state_co_prof_computed
  on public.lender_state_company_profiles (computed_at);

comment on table public.lender_state_company_profiles is
  'Internal Florida company profile projection (fl-lend-provider-v1). Not a public profile, ranking, or national LPI row.';

alter table public.lender_state_company_profiles enable row level security;

drop policy if exists "Service role manage lender_state_company_profiles" on public.lender_state_company_profiles;
create policy "Service role manage lender_state_company_profiles"
  on public.lender_state_company_profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on table public.lender_state_company_profiles from anon, authenticated;
grant all on table public.lender_state_company_profiles to service_role;
