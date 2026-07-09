-- LandingRoast AI — initial schema
-- Run with: supabase db push  (or paste into the SQL editor)

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Audits ──────────────────────────────────────────────────────────────────
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  site_title text,
  status text not null default 'pending' check (status in ('pending', 'running', 'complete', 'failed')),
  overall_score integer check (overall_score between 0 and 100),
  report jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists audits_user_created_idx
  on public.audits (user_id, created_at desc);

alter table public.audits enable row level security;

create policy "Users can view own audits"
  on public.audits for select
  using (auth.uid() = user_id);

create policy "Users can create own audits"
  on public.audits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own audits"
  on public.audits for update
  using (auth.uid() = user_id);

create policy "Users can delete own audits"
  on public.audits for delete
  using (auth.uid() = user_id);
