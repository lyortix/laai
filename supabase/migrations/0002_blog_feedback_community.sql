-- LandingRoast AI — blog, feedback, and dormant community architecture
-- Run after 0001_init.sql (SQL editor or `supabase db push`).

-- ── Admin flag ───────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Security-definer helper so RLS policies can check adminship without
-- recursive profile lookups.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ── Blog ─────────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,           -- markdown
  tags text[] not null default '{}',
  category text,
  author_id uuid references public.profiles (id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_published_idx
  on public.posts (published, published_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);

alter table public.posts enable row level security;

create policy "Anyone can read published posts"
  on public.posts for select
  using (published = true or public.is_admin());

create policy "Admins manage posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── User feedback ────────────────────────────────────────────────────────────
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('suggestion', 'bug', 'feature', 'other')),
  rating integer check (rating between 1 and 5),
  message text not null check (char_length(message) <= 2000),
  page text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Users can submit feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Admins can read feedback"
  on public.feedback for select
  using (public.is_admin());

-- ── Community (DORMANT — schema prepared, no product surface yet) ────────────
-- Reviews of audited websites, threaded comments, likes, and a moderation
-- trail with a spam-score column for future automated filtering.
-- RLS is enabled with NO permissive policies for regular users, so these
-- tables are inert until community features ship.

create table if not exists public.community_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  site_host text not null,          -- normalized hostname being reviewed
  rating integer not null check (rating between 1 and 5),
  title text,
  body text check (char_length(body) <= 5000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'spam')),
  spam_score numeric(4,3),          -- 0..1 from future spam detection
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_reviews_host_idx
  on public.community_reviews (site_host, status, created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  review_id uuid not null references public.community_reviews (id) on delete cascade,
  parent_id uuid references public.community_comments (id) on delete cascade, -- replies
  body text not null check (char_length(body) <= 2000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'spam')),
  spam_score numeric(4,3),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_review_idx
  on public.community_comments (review_id, created_at);

create table if not exists public.community_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('review', 'comment')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('review', 'comment')),
  target_id uuid not null,
  action text not null check (action in ('approve', 'reject', 'mark_spam', 'delete')),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.community_reviews enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.moderation_actions enable row level security;

-- Admin-only until the feature launches; user policies land in a later
-- migration together with the UI.
create policy "Admins manage reviews" on public.community_reviews
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage comments" on public.community_comments
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage likes" on public.community_likes
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage moderation" on public.moderation_actions
  for all using (public.is_admin()) with check (public.is_admin());
