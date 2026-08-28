-- LEND-NAT-011 — Internal national lender profile intelligence snapshots.
-- Additive. Does not alter public.lenders, slugs, sitemap, HMDA, CFPB, or enforcement rows.
-- Snapshot is evidence presentation, not a score. public_projection_status remains internal_only.

create table if not exists public.lender_profile_intelligence (
  entity_id uuid primary key references public.lender_national_entities(id) on delete cascade,
  contract_version text not null default 'lend-nat-011-v1',
  profile jsonb not null,
  hmda_application_count integer,
  hmda_origination_count integer,
  cfpb_complaint_count integer,
  cfpb_complaint_count_24m integer,
  enforcement_event_count integer,
  computed_at timestamptz not null default now(),
  public_projection_status text not null default 'internal_only' check (
    public_projection_status in ('internal_only', 'bridged', 'projected')
  ),
  check (public_projection_status = 'internal_only')
);

comment on table public.lender_profile_intelligence is
  'Internal profile intelligence snapshot. One row per institution. Not a ranking, Trust Score, or public profile.';

create index if not exists idx_profile_intel_computed
  on public.lender_profile_intelligence (computed_at);

alter table public.lender_profile_intelligence enable row level security;

drop policy if exists "Service role manage lender_profile_intelligence" on public.lender_profile_intelligence;
create policy "Service role manage lender_profile_intelligence"
  on public.lender_profile_intelligence for all
  using (auth.role() = 'service_role');
