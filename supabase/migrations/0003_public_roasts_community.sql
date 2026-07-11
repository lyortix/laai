-- LandingRoast AI — v1.2: public roast feed, community, feedback triage
-- Run after 0002 (SQL editor or `supabase db push`).

-- ── Public roasts ────────────────────────────────────────────────────────────
alter table public.audits
  add column if not exists is_public boolean not null default false,
  add column if not exists slug text unique,
  add column if not exists public_at timestamptz,
  add column if not exists view_count integer not null default 0;

create index if not exists audits_public_idx
  on public.audits (is_public, public_at desc);
create index if not exists audits_slug_idx on public.audits (slug);

-- Anyone (even anonymous) may read a completed, public audit. This is additive
-- to the existing "own audits" policy.
drop policy if exists "Anyone can read public audits" on public.audits;
create policy "Anyone can read public audits"
  on public.audits for select
  using (is_public = true and status = 'complete');

-- Atomic view counter (avoids read-modify-write races).
create or replace function public.increment_audit_views(audit_slug text)
returns void
language sql security definer set search_path = public
as $$
  update public.audits set view_count = view_count + 1
  where slug = audit_slug and is_public = true;
$$;

-- ── Ratings on public roasts ─────────────────────────────────────────────────
create table if not exists public.roast_ratings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (audit_id, user_id)   -- one rating per user per roast
);

create index if not exists roast_ratings_audit_idx on public.roast_ratings (audit_id);

alter table public.roast_ratings enable row level security;

create policy "Anyone can read ratings" on public.roast_ratings for select using (true);
create policy "Users manage own rating" on public.roast_ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Comments on public roasts ────────────────────────────────────────────────
create table if not exists public.roast_comments (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  pinned boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists roast_comments_audit_idx
  on public.roast_comments (audit_id, created_at desc);

alter table public.roast_comments enable row level security;

-- Public sees only non-hidden comments; authors and admins see their own/all.
create policy "Read visible comments" on public.roast_comments for select
  using (hidden = false or auth.uid() = user_id or public.is_admin());
create policy "Authenticated users comment" on public.roast_comments for insert
  with check (auth.uid() = user_id);
create policy "Users delete own comments" on public.roast_comments for delete
  using (auth.uid() = user_id or public.is_admin());
create policy "Admins moderate comments" on public.roast_comments for update
  using (public.is_admin()) with check (public.is_admin());

-- ── Comment likes ────────────────────────────────────────────────────────────
create table if not exists public.roast_comment_likes (
  comment_id uuid not null references public.roast_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.roast_comment_likes enable row level security;

create policy "Anyone can read likes" on public.roast_comment_likes for select using (true);
create policy "Users manage own likes" on public.roast_comment_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Feedback triage + landing-page social proof ──────────────────────────────
alter table public.feedback
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'resolved', 'archived')),
  add column if not exists featured boolean not null default false,
  add column if not exists display_name text;

-- Featured feedback is publicly readable so it can appear on the homepage as
-- social proof. Nothing else in feedback is exposed to non-admins.
drop policy if exists "Anyone can read featured feedback" on public.feedback;
create policy "Anyone can read featured feedback"
  on public.feedback for select
  using (featured = true);

-- ── Public platform stats (for the homepage trust band) ──────────────────────
-- SECURITY DEFINER so an anonymous visitor can read aggregate counts without
-- any row-level access to the underlying tables.
create or replace function public.platform_stats()
returns table (total_users bigint, total_audits bigint, avg_score numeric)
language sql stable security definer set search_path = public
as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.audits where status = 'complete'),
    (select round(avg(overall_score)) from public.audits where status = 'complete')
$$;

grant execute on function public.platform_stats() to anon, authenticated;
grant execute on function public.increment_audit_views(text) to anon, authenticated;
