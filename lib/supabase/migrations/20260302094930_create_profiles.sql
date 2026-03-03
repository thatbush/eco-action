-- Create the role enum
create type public.user_role as enum ('user', 'org', 'admin');

-- Create profiles table
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.user_role not null default 'user',
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Index for fast role-based queries (admin dashboard etc.)
create index idx_profiles_role on public.profiles(role);

-- Enable RLS immediately — never leave a table without it
alter table public.profiles enable row level security;