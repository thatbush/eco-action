-- Verification status enum
create type public.verification_status as enum (
  'pending', 'verified', 'rejected'
);

-- Create organizations table
create table public.organizations (
  id                        uuid primary key default gen_random_uuid(),
  profile_id                uuid not null references public.profiles(id) on delete cascade,
  org_name                  text not null,
  description               text,
  verification_status       public.verification_status not null default 'pending',
  kra_pin                   text not null,
  contact_email             text not null,
  points_balance            integer not null default 0,
  escrow_balance            integer not null default 0,
  lifetime_points_purchased integer not null default 0,
  created_at                timestamptz not null default now(),

  -- One org per KRA PIN
  unique (kra_pin),
  -- One org per profile
  unique (profile_id)
);

-- For admin approval queue queries
create index idx_orgs_verification on public.organizations(verification_status);

-- For lookups by profile
create index idx_orgs_profile on public.organizations(profile_id);

-- RLS on immediately
alter table public.organizations enable row level security;