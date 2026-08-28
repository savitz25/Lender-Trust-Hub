-- FL-LEND-009 — Additive PERSON_MLO / BRANCH identity foundation.
-- Does not alter institution rows, company licenses, profiles, or publication.
-- Identifier vocabulary: existing NMLS_PERSON (not a new NMLS_INDIVIDUAL namespace).

alter table public.lender_entity_relationships
  drop constraint if exists lender_entity_relationships_relationship_type_check;

alter table public.lender_entity_relationships
  add constraint lender_entity_relationships_relationship_type_check
  check (
    relationship_type in (
      'SUBSIDIARY_OF',
      'PARENT_OF',
      'BRAND_OF',
      'SUCCESSOR_TO',
      'PREDECESSOR_OF',
      'ASSOCIATED_WITH',
      'BELONGS_TO'
    )
  );

alter table public.lender_entity_relationships
  add column if not exists valid_from date,
  add column if not exists valid_to date,
  add column if not exists ofr_status text,
  add column if not exists source_record_id text;

comment on column public.lender_entity_relationships.relationship_type is
  'ASSOCIATED_WITH / BELONGS_TO only when official source supplies the parent/employer identifier. Never inferred from name/address/phone.';

create table if not exists public.lender_entity_contacts (
  id uuid primary key,
  entity_id uuid not null references public.lender_national_entities(id) on delete cascade,
  contact_kind text not null check (contact_kind in ('phone', 'email', 'prim_address', 'mail_address')),
  contact_role text not null default 'unknown' check (
    contact_role in ('business', 'professional', 'unknown')
  ),
  classification text not null check (
    classification in ('internal_only', 'review_before_public', 'public_candidate')
  ),
  phone text,
  email text,
  address1 text,
  address2 text,
  city text,
  county text,
  state text,
  zip text,
  source_dataset text not null,
  source_record_id text not null,
  observed_at date,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (entity_id, contact_kind, source_record_id)
);

create index if not exists idx_entity_contacts_entity on public.lender_entity_contacts (entity_id);

comment on table public.lender_entity_contacts is
  'Internal contact observations. Person contacts are never auto public_candidate. Not a public projection.';

alter table public.lender_entity_contacts enable row level security;

drop policy if exists "Service role manage lender_entity_contacts" on public.lender_entity_contacts;
create policy "Service role manage lender_entity_contacts"
  on public.lender_entity_contacts for all
  using (auth.role() = 'service_role');

grant all on table public.lender_entity_contacts to service_role;
revoke all on table public.lender_entity_contacts from anon, authenticated, public;

alter table public.lender_state_regulatory_events
  add column if not exists respondent_entity_id uuid references public.lender_national_entities(id) on delete set null;

create index if not exists idx_sre_respondent_entity
  on public.lender_state_regulatory_events (respondent_entity_id);
