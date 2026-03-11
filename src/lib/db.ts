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
