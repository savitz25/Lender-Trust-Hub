-- My Lending V1.1 — signed-in research workspace sync foundation
-- Full state blob per user (plans, lenders, LE saves). No lead routing.
-- Guest users continue to use device localStorage only.

create table if not exists public.my_lending_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_my_lending_workspaces_client_updated
  on public.my_lending_workspaces (client_updated_at desc);

alter table public.my_lending_workspaces enable row level security;

drop policy if exists "Users manage own my_lending workspace" on public.my_lending_workspaces;
create policy "Users manage own my_lending workspace"
  on public.my_lending_workspaces
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manage my_lending workspaces" on public.my_lending_workspaces;
create policy "Service role manage my_lending workspaces"
  on public.my_lending_workspaces
  for all
  using (auth.role() = 'service_role');
