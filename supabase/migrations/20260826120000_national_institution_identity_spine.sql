-- LEND-NAT-002 — National institution identity spine + typed identifier graph
-- Additive only. Does not alter public.lenders, counties, slugs, or directory tables.
-- Graph is internal research infrastructure. Not a public projection.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================
-- ENUMERATIONS (text + check: avoids brittle PG enum migrations)
-- =====================================================

-- entity_kind: institution | branch | person_mlo
-- identity_confidence: confirmed | high_confidence | review_required | unresolved
-- current_status: unknown | observed | active | inactive
-- Never infer active from ingest recency.

-- =====================================================
-- NATIONAL ENTITIES
-- =====================================================
create table if not exists public.lender_national_entities (
  id uuid primary key default uuid_generate_v4(),
  entity_kind text not null check (entity_kind in ('institution', 'branch', 'person_mlo')),
  stable_key text not null,
  legal_name text not null,
  display_name text,
  identity_confidence text not null check (
    identity_confidence in ('confirmed', 'high_confidence', 'review_required', 'unresolved')
  ),
  current_status text not null default 'unknown' check (
    current_status in ('unknown', 'observed', 'active', 'inactive')
  ),
  public_projection_status text not null default 'internal_only' check (
    public_projection_status in ('internal_only', 'bridged', 'projected')
  ),
  review_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stable_key)
);

create unique index if not exists uq_lender_entities_institution_stable
  on public.lender_national_entities (stable_key)
  where entity_kind = 'institution';

create index if not exists idx_lender_entities_kind
  on public.lender_national_entities (entity_kind);

comment on table public.lender_national_entities is
  'Canonical national entities. One institution per confirmed institution NMLS. Branch and person_mlo kinds are reserved; LEND-NAT-002 seeds institutions only.';

-- =====================================================
-- NAMES (legal / display / dba / alternate — never overwrite)
-- =====================================================
create table if not exists public.lender_entity_names (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references public.lender_national_entities(id) on delete cascade,
  name_kind text not null check (name_kind in ('legal', 'display', 'dba', 'alternate')),
  name text not null,
  source_dataset text not null,
  source_record_id text,
  observed_at date,
  created_at timestamptz not null default now(),
  unique (entity_id, name_kind, name, source_dataset)
);

-- =====================================================
-- TYPED IDENTIFIERS
-- Uniqueness is (identifier_type, identifier_value) — namespaces never mix.
-- entity_id NULL = unattached / unresolved evidence identity.
-- =====================================================
create table if not exists public.lender_identifiers (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  identifier_type text not null check (
    identifier_type in (
      'NMLS_INSTITUTION',
      'NMLS_BRANCH',
      'NMLS_PERSON',
      'LEI',
      'FDIC_CERT',
      'NCUA_CHARTER',
      'RSSD',
      'FHA_ID',
      'HUD_ID',
      'SBA_ID',
      'STATE_LICENSE',
      'OTHER_AUTHORITATIVE'
    )
  ),
  identifier_value text not null,
  jurisdiction text,
  source_dataset text not null,
  source_record_id text,
  observed_at date,
  status text,
  confidence text not null check (
    confidence in ('confirmed', 'high_confidence', 'review_required', 'unresolved')
  ),
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (identifier_type, identifier_value)
);

create index if not exists idx_lender_identifiers_entity
  on public.lender_identifiers (entity_id);
create index if not exists idx_lender_identifiers_type
  on public.lender_identifiers (identifier_type);

comment on table public.lender_identifiers is
  'Typed identifiers. NMLS_INSTITUTION:3030 and LEI:XYZ are different namespaces. Unattached rows preserve unresolved HMDA LEIs and future FDIC/NCUA IDs.';

-- Guard: NMLS_INSTITUTION values must be digits (never LEI / CERT strings).
create or replace function public.lender_identifier_type_guard()
returns trigger
language plpgsql
as $$
begin
  if new.identifier_type in ('NMLS_INSTITUTION', 'NMLS_BRANCH', 'NMLS_PERSON') then
    if new.identifier_value !~ '^[0-9]{3,12}$' then
      raise exception 'NMLS identifier_value must be 3-12 digits, got %', new.identifier_value;
    end if;
  elsif new.identifier_type = 'LEI' then
    if new.identifier_value !~ '^[A-Z0-9]{20}$' then
      raise exception 'LEI must be 20-character ISO 17442 value, got %', new.identifier_value;
    end if;
  elsif new.identifier_type = 'FDIC_CERT' then
    if new.identifier_value !~ '^[0-9]+$' then
      raise exception 'FDIC_CERT must be numeric, got %', new.identifier_value;
    end if;
  elsif new.identifier_type = 'NCUA_CHARTER' then
    if new.identifier_value !~ '^[0-9]+$' then
      raise exception 'NCUA_CHARTER must be numeric, got %', new.identifier_value;
    end if;
  elsif new.identifier_type = 'RSSD' then
    if new.identifier_value !~ '^[0-9]+$' then
      raise exception 'RSSD must be numeric, got %', new.identifier_value;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lender_identifier_type_guard on public.lender_identifiers;
create trigger trg_lender_identifier_type_guard
  before insert or update on public.lender_identifiers
  for each row execute function public.lender_identifier_type_guard();

-- =====================================================
-- SOURCE RECORD LINKS
-- Natural key: (source_dataset, source_record_id)
-- =====================================================
create table if not exists public.lender_source_record_links (
  id uuid primary key default uuid_generate_v4(),
  source_dataset text not null,
  source_record_id text not null,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  identifier_id uuid references public.lender_identifiers(id) on delete set null,
  attribution_confidence text not null check (
    attribution_confidence in ('confirmed', 'high_confidence', 'review_required', 'unresolved')
  ),
  method text not null,
  observed_at date,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_dataset, source_record_id)
);

create index if not exists idx_lender_source_links_entity
  on public.lender_source_record_links (entity_id);

-- =====================================================
-- LEGACY PUBLIC CATALOG BRIDGE (internal only — no slug/sitemap change)
-- Natural key: (legacy_source, legacy_row_id)
-- =====================================================
create table if not exists public.legacy_lender_bridges (
  id uuid primary key default uuid_generate_v4(),
  legacy_source text not null default 'public_catalog',
  legacy_row_id text not null,
  legacy_slug text,
  entity_id uuid references public.lender_national_entities(id) on delete set null,
  geo_class text not null check (
    geo_class in (
      'HEADQUARTERS_CATALOG_REPRESENTATION',
      'GEO_DISCOVERY_CLONE',
      'BRANCH_CANDIDATE',
      'UNKNOWN'
    )
  ),
  confidence text not null check (
    confidence in ('confirmed', 'high_confidence', 'review_required', 'unresolved')
  ),
  created_at timestamptz not null default now(),
  unique (legacy_source, legacy_row_id)
);

create index if not exists idx_legacy_lender_bridges_entity
  on public.legacy_lender_bridges (entity_id);
create index if not exists idx_legacy_lender_bridges_slug
  on public.legacy_lender_bridges (legacy_slug);

-- =====================================================
-- IDENTITY CONFLICTS / QUARANTINE
-- =====================================================
create table if not exists public.lender_identity_conflicts (
  id uuid primary key default uuid_generate_v4(),
  conflict_class text not null,
  identifier_type text,
  identifier_value text,
  related_values jsonb not null default '[]'::jsonb,
  disposition text not null check (
    disposition in ('quarantined', 'review_required', 'unresolved', 'recorded')
  ),
  notes text,
  created_at timestamptz not null default now(),
  unique (conflict_class, identifier_type, identifier_value)
);

-- =====================================================
-- CLASSIFICATION (editorial catalog type is NEVER authoritative)
-- =====================================================
create table if not exists public.lender_entity_classifications (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references public.lender_national_entities(id) on delete cascade,
  family text not null check (
    family in (
      'DEPOSITORY_BANK',
      'CREDIT_UNION',
      'INDEPENDENT_MORTGAGE_BANK',
      'MORTGAGE_BROKER',
      'SERVICER',
      'WHOLESALE',
      'CORRESPONDENT',
      'FINTECH_DIRECT',
      'COMMERCIAL',
      'OTHER',
      'UNKNOWN'
    )
  ),
  source text not null,
  is_authoritative boolean not null default false,
  raw_label text,
  created_at timestamptz not null default now(),
  unique (entity_id, family, source)
);

-- =====================================================
-- RELATIONSHIPS (parent/sub/brand/successor — empty until authoritative)
-- =====================================================
create table if not exists public.lender_entity_relationships (
  id uuid primary key default uuid_generate_v4(),
  from_entity_id uuid not null references public.lender_national_entities(id) on delete cascade,
  to_entity_id uuid not null references public.lender_national_entities(id) on delete cascade,
  relationship_type text not null check (
    relationship_type in (
      'SUBSIDIARY_OF',
      'PARENT_OF',
      'BRAND_OF',
      'SUCCESSOR_TO',
      'PREDECESSOR_OF'
    )
  ),
  confidence text not null check (
    confidence in ('confirmed', 'high_confidence', 'review_required', 'unresolved')
  ),
  source_dataset text,
  notes text,
  created_at timestamptz not null default now(),
  check (from_entity_id <> to_entity_id),
  unique (from_entity_id, to_entity_id, relationship_type)
);

-- =====================================================
-- RLS — internal graph, not public directory
-- =====================================================
alter table public.lender_national_entities enable row level security;
alter table public.lender_entity_names enable row level security;
alter table public.lender_identifiers enable row level security;
alter table public.lender_source_record_links enable row level security;
alter table public.legacy_lender_bridges enable row level security;
alter table public.lender_identity_conflicts enable row level security;
alter table public.lender_entity_classifications enable row level security;
alter table public.lender_entity_relationships enable row level security;

drop policy if exists "Service role manage lender_national_entities" on public.lender_national_entities;
create policy "Service role manage lender_national_entities"
  on public.lender_national_entities for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage lender_entity_names" on public.lender_entity_names;
create policy "Service role manage lender_entity_names"
  on public.lender_entity_names for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage lender_identifiers" on public.lender_identifiers;
create policy "Service role manage lender_identifiers"
  on public.lender_identifiers for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage lender_source_record_links" on public.lender_source_record_links;
create policy "Service role manage lender_source_record_links"
  on public.lender_source_record_links for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage legacy_lender_bridges" on public.legacy_lender_bridges;
create policy "Service role manage legacy_lender_bridges"
  on public.legacy_lender_bridges for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage lender_identity_conflicts" on public.lender_identity_conflicts;
create policy "Service role manage lender_identity_conflicts"
  on public.lender_identity_conflicts for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage lender_entity_classifications" on public.lender_entity_classifications;
create policy "Service role manage lender_entity_classifications"
  on public.lender_entity_classifications for all
  using (auth.role() = 'service_role');

drop policy if exists "Service role manage lender_entity_relationships" on public.lender_entity_relationships;
create policy "Service role manage lender_entity_relationships"
  on public.lender_entity_relationships for all
  using (auth.role() = 'service_role');
