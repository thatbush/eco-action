-- Create users table (gamification data for regular users)
create table public.users (
  id               uuid primary key references public.profiles(id) on delete cascade,
  tier_id          integer,  -- FK to tiers added in Phase 2
  current_points   integer not null default 0,
  lifetime_points  integer not null default 0,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_task_date   date,
  created_at       timestamptz not null default now()
);

-- For tier-based leaderboard queries
create index idx_users_lifetime_points on public.users(lifetime_points desc);

-- For streak queries
create index idx_users_streak on public.users(current_streak desc);

-- RLS on immediately
alter table public.users enable row level security;