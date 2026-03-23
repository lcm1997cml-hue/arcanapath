import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;

export const READINGS_TABLE_SQL = `
create table if not exists public.readings (
  id text primary key,
  user_id text,
  question text not null,
  topic text not null,
  cards jsonb not null,
  free_reading jsonb not null,
  deep_reading jsonb,
  is_paid boolean not null default false,
  paid_plan text,
  created_at timestamp with time zone not null default now()
);
`;

export const LEADS_TABLE_SQL = `
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  usage_count integer not null default 0,
  free_limit integer not null default 0,
  last_email_bonus_date date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_leads_updated_at on public.leads;
create trigger trg_set_leads_updated_at
before update on public.leads
for each row
execute function public.set_leads_updated_at();
`;

/** Add email bonus tracking to existing databases. */
export const LEADS_LAST_EMAIL_BONUS_SQL = `
alter table public.leads
  add column if not exists last_email_bonus_date date;
`;

export const LEADS_PLAN_COLUMNS_SQL = `
alter table public.leads
  add column if not exists plan_type text,
  add column if not exists plan_credits integer not null default 0,
  add column if not exists plan_expires_at timestamptz;
`;

export const VISITOR_USAGE_TABLE_SQL = `
create table if not exists public.visitor_usage (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null unique,
  usage_count integer not null default 0,
  free_limit integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_visitor_usage_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_visitor_usage_updated_at on public.visitor_usage;
create trigger trg_set_visitor_usage_updated_at
before update on public.visitor_usage
for each row
execute function public.set_visitor_usage_updated_at();
`;

export const VISITOR_USAGE_PLAN_COLUMNS_SQL = `
alter table public.visitor_usage
  add column if not exists plan_type text,
  add column if not exists plan_credits integer not null default 0,
  add column if not exists plan_expires_at timestamptz;
`;

export const VISITOR_SHARE_BONUS_TABLE_SQL = `
create table if not exists public.visitor_share_bonus (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  bonus_date date not null,
  credits integer not null default 3,
  created_at timestamp with time zone not null default now(),
  unique(visitor_id, bonus_date)
);
`;

/** Run if an older DB created visitor_share_bonus without the unique constraint. */
export const VISITOR_SHARE_BONUS_UNIQUE_INDEX_SQL = `
create unique index if not exists visitor_share_bonus_visitor_id_bonus_date_key
  on public.visitor_share_bonus (visitor_id, bonus_date);
`;

/** Daily cap: one email bonus per calendar day (UTC date string). */
export const LEAD_EMAIL_BONUS_TABLE_SQL = `
create table if not exists public.lead_email_bonus (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  bonus_date date not null,
  created_at timestamptz not null default now(),
  unique (email, bonus_date)
);
`;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}
