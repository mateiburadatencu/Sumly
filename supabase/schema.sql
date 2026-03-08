-- Sumly Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================
-- PROFILES (linked to Supabase Auth users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  plan text not null default 'basic' check (plan in ('basic', 'plus', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- SUMMARIES (cached AI outputs)
-- ============================================
create table public.summaries (
  id uuid default gen_random_uuid() primary key,
  video_id text not null,
  plan text not null check (plan in ('basic', 'plus', 'pro')),
  summary_json jsonb not null,
  transcript_hash text,
  video_title text,
  video_duration_seconds integer,
  created_at timestamptz not null default now(),
  unique(video_id, plan)
);

create index idx_summaries_video_plan on public.summaries(video_id, plan);

alter table public.summaries enable row level security;

create policy "Summaries are readable by everyone"
  on public.summaries for select using (true);

create policy "Service role can insert summaries"
  on public.summaries for insert with check (true);

-- ============================================
-- USER USAGE TRACKING
-- ============================================
create table public.user_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ip_address text,
  plan text not null default 'basic',
  daily_count integer not null default 0,
  monthly_count integer not null default 0,
  last_used_at timestamptz not null default now(),
  daily_reset_date date not null default current_date,
  monthly_reset_date date not null default (current_date + interval '30 days')::date,
  created_at timestamptz not null default now(),
  constraint unique_user unique (user_id),
  constraint unique_ip unique (ip_address),
  constraint has_identifier check (user_id is not null or ip_address is not null)
);

create index idx_user_usage_user on public.user_usage(user_id);
create index idx_user_usage_ip on public.user_usage(ip_address);

alter table public.user_usage enable row level security;

create policy "Users can view own usage"
  on public.user_usage for select using (auth.uid() = user_id);

create policy "Service role manages usage"
  on public.user_usage for all using (true);

-- ============================================
-- SUMMARY HISTORY (per-user log)
-- ============================================
create table public.summary_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ip_address text,
  video_id text not null,
  video_title text,
  plan text not null,
  created_at timestamptz not null default now()
);

create index idx_summary_history_user on public.summary_history(user_id);

alter table public.summary_history enable row level security;

create policy "Users can view own history"
  on public.summary_history for select using (auth.uid() = user_id);

create policy "Service role manages history"
  on public.summary_history for all using (true);
