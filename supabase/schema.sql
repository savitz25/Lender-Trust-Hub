-- =====================================================
-- Lender Trust Hub — Supabase PostgreSQL Schema
-- Project: dedicated LenderTrustHub instance (NOT MoveTrustHub)
-- Run in Supabase SQL Editor, then: npm run seed
-- =====================================================

create extension if not exists "uuid-ossp";

-- =====================================================
-- COUNTIES (directory geography)
-- =====================================================
create table if not exists public.counties (
  id uuid primary key default uuid_generate_v4(),
  state text not null,
  state_slug text not null,
  county text not null,
  county_slug text not null,
  lender_count integer default 0,
  region text,
  created_at timestamptz default now(),
  unique (state_slug, county_slug)
);

create index if not exists idx_counties_state on public.counties (state_slug);

-- =====================================================
-- LENDERS (NMLS-verified directory)
-- =====================================================
create table if not exists public.lenders (
  id text primary key,
  slug text unique not null,
  name text not null,
  nmls_id text not null,
  lender_type text default 'Broker',
  city text,
  state text not null,
  state_slug text not null,
  county text not null,
  county_slug text not null,
  zip_codes jsonb default '[]'::jsonb,
  rating numeric(3,2),
  review_count integer default 0,
  trust_score integer default 0 check (trust_score >= 0 and trust_score <= 100),
  county_experience_score integer default 0,
  loan_types jsonb default '[]'::jsonb,
  specialties jsonb default '[]'::jsonb,
  credit_tiers jsonb default '[]'::jsonb,
  nmls_verified boolean default true,
  cfpb_complaints integer default 0,
  bbb_rating text,
  google_rating numeric(3,2),
  trustpilot_rating numeric(3,2),
  short_description text,
  website text,
  phone text,
  is_featured boolean default false,
  zero_paid_placement boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lenders_slug on public.lenders (slug);
create index if not exists idx_lenders_state_county on public.lenders (state_slug, county_slug);
create index if not exists idx_lenders_trust on public.lenders (trust_score desc);
create index if not exists idx_lenders_nmls on public.lenders (nmls_id);

-- =====================================================
-- REVIEWS
-- =====================================================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  lender_id text not null references public.lenders(id) on delete cascade,
  author text not null,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  review_date date not null default current_date,
  source text not null default 'Google',
  title text,
  content text not null,
  verified boolean default false,
  location text,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_lender on public.reviews (lender_id, review_date desc);

-- =====================================================
-- TESTIMONIALS (featured quotes)
-- =====================================================
create table if not exists public.testimonials (
  id uuid primary key default uuid_generate_v4(),
  lender_id text references public.lenders(id) on delete set null,
  author text not null,
  quote text not null,
  context text,
  featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =====================================================
-- LEAD SUBMISSIONS (email capture from calculators/directory)
-- =====================================================
create table if not exists public.lead_submissions (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  category text not null default 'mortgage',
  state_name text,
  intent text not null,
  source text,
  variant text,
  calculator_payload jsonb,
  status text not null default 'new' check (status in ('new','contacted','matched','closed','spam')),
  created_at timestamptz default now()
);

create index if not exists idx_leads_email on public.lead_submissions (email);
create index if not exists idx_leads_status on public.lead_submissions (status, created_at desc);

-- =====================================================
-- SAVED CALCULATOR SCENARIOS
-- =====================================================
create table if not exists public.saved_calculator_scenarios (
  id uuid primary key default uuid_generate_v4(),
  session_id text,
  user_id uuid references auth.users(id) on delete cascade,
  calc_id text not null,
  label text,
  payload jsonb not null default '{}'::jsonb,
  share_token text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_saved_calc_session on public.saved_calculator_scenarios (session_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table public.counties enable row level security;
alter table public.lenders enable row level security;
alter table public.reviews enable row level security;
alter table public.testimonials enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.saved_calculator_scenarios enable row level security;

-- Public read: directory data (transparent, verified listings)
create policy "Public read counties" on public.counties for select using (true);
create policy "Public read lenders" on public.lenders for select using (true);
create policy "Public read reviews" on public.reviews for select using (true);
create policy "Public read testimonials" on public.testimonials for select using (featured = true);

-- Anonymous lead capture (insert only, no read)
create policy "Anon insert leads" on public.lead_submissions
  for insert to anon, authenticated
  with check (true);

-- Service role full access (seeds, admin)
create policy "Service role manage lenders" on public.lenders for all using (auth.role() = 'service_role');
create policy "Service role manage counties" on public.counties for all using (auth.role() = 'service_role');
create policy "Service role manage reviews" on public.reviews for all using (auth.role() = 'service_role');
create policy "Service role manage testimonials" on public.testimonials for all using (auth.role() = 'service_role');
create policy "Service role manage leads" on public.lead_submissions for all using (auth.role() = 'service_role');
create policy "Service role manage scenarios" on public.saved_calculator_scenarios for all using (auth.role() = 'service_role');

-- Saved scenarios: users read/write own rows (when auth ships)
create policy "Users manage own scenarios" on public.saved_calculator_scenarios
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);