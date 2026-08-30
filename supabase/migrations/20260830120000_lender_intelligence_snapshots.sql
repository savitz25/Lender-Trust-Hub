-- FL-LEND-002E — Versioned page-intelligence snapshots.
-- Additive. Does not alter identities, licenses, HMDA, CFPB, LPI, or publication cohorts.
-- Payload is an immutable published fact. Pages consume published (else last superseded), never live SQL.

create table if not exists public.lender_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  contract_name text not null,
  contract_version text not null,
  geography text not null check (geography in ('NATIONAL', 'FL')),
  generated_at timestamptz not null,
  source_as_of jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  fingerprint text not null,
  publication_status text not null check (
    publication_status in ('draft', 'published', 'superseded')
  ),
  created_at timestamptz not null default now()
);

comment on table public.lender_intelligence_snapshots is
  'Immutable page-intelligence snapshots for / and /florida. Not a ranking, Trust Score, or live query cache.';

create unique index if not exists lender_intelligence_snapshots_one_published
  on public.lender_intelligence_snapshots (contract_name, geography)
  where publication_status = 'published';

create index if not exists idx_lender_intelligence_snapshots_lookup
  on public.lender_intelligence_snapshots (contract_name, geography, publication_status, generated_at desc);

alter table public.lender_intelligence_snapshots enable row level security;

drop policy if exists "Service role manage lender_intelligence_snapshots" on public.lender_intelligence_snapshots;
create policy "Service role manage lender_intelligence_snapshots"
  on public.lender_intelligence_snapshots for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Public read published intelligence snapshots" on public.lender_intelligence_snapshots;
create policy "Public read published intelligence snapshots"
  on public.lender_intelligence_snapshots for select
  using (publication_status in ('published', 'superseded'));

grant select on public.lender_intelligence_snapshots to anon, authenticated;
grant all on public.lender_intelligence_snapshots to service_role;
