// src/lib/store.ts
// ─────────────────────────────────────────────────────────────
// In-memory store – acts as mock DB for local dev.
// Replace with Prisma/Supabase calls in production.
// ─────────────────────────────────────────────────────────────
import type { ReadingResult, AppUser, UserRole } from "@/types";
import { getSupabaseAdmin } from "./db";

// ─── Readings store ──────────────────────────────────────────
type ReadingRow = {
  id: string;
  user_id: string | null;
  question: string;
  topic: string;
  cards: unknown;
  free_reading: unknown;
  deep_reading: unknown;
  is_paid: boolean;
  paid_plan?: "19" | "39" | "88" | null;
  created_at: string;
};

function fromRow(row: ReadingRow): ReadingResult {
  const deepPayload = (row.deep_reading ?? null) as any;
  const deepReading = deepPayload?.deepReading ?? deepPayload ?? null;
  const timelineReport = deepPayload?.timelineReport ?? null;
  const qaBonus = Array.isArray(deepPayload?.qaBonus) ? deepPayload.qaBonus : [];

  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    question: row.question,
    topic: row.topic as any,
    cards: (row.cards ?? []) as any,
    freeReading: (row.free_reading ?? {}) as any,
    deepReading: deepReading as any,
    timelineReport: timelineReport as any,
    qaBonus: qaBonus as any,
    isPaid: !!row.is_paid,
    paidPlan: row.paid_plan ?? undefined,
    createdAt: row.created_at,
  } as ReadingResult;
}

export async function saveReading(result: ReadingResult): Promise<void> {
  const supabase = getSupabaseAdmin();
  const deepPayload = {
    deepReading: (result as any).deepReading ?? null,
    timelineReport: (result as any).timelineReport ?? null,
    qaBonus: (result as any).qaBonus ?? null,
  };

  const { error } = await supabase.from("readings").upsert(
    {
      id: result.id,
      user_id: (result as any).userId ?? null,
      question: result.question,
      topic: result.topic,
      cards: result.cards,
      free_reading: result.freeReading,
      deep_reading: deepPayload,
      is_paid: !!result.isPaid,
      paid_plan: ((result as any).paidPlan ?? null) as "19" | "39" | "88" | null,
      created_at: result.createdAt,
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function getReading(id: string): Promise<ReadingResult | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("readings")
    .select("id,user_id,question,topic,cards,free_reading,deep_reading,is_paid,paid_plan,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;
  return fromRow(data as ReadingRow);
}

export async function getReadingsByUser(userId: string): Promise<ReadingResult[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("readings")
    .select("id,user_id,question,topic,cards,free_reading,deep_reading,is_paid,paid_plan,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as ReadingRow));
}

export async function updateReadingPaid(
  id: string,
  isPaid = true,
  paidPlan?: "19" | "39" | "88"
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const payload: { is_paid: boolean; paid_plan?: "19" | "39" | "88" } = { is_paid: isPaid };
  if (paidPlan) payload.paid_plan = paidPlan;
  const { error } = await supabase.from("readings").update(payload).eq("id", id);
  if (error) throw error;
}

// ─── Users store ─────────────────────────────────────────────
const users = new Map<string, AppUser>();

// Seed admin user
users.set("admin-001", {
  id: "admin-001",
  email: "admin@arcanapath.com",
  name: "Admin",
  role: "admin",
  dailyUsage: 0,
  totalUsage: 0,
  isActive: true,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
});

// Seed demo member
users.set("member-001", {
  id: "member-001",
  email: "demo@arcanapath.com",
  name: "Demo User",
  role: "member",
  dailyUsage: 0,
  totalUsage: 5,
  isActive: true,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
});

export function getUserById(id: string): AppUser | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): AppUser | undefined {
  return Array.from(users.values()).find((u) => u.email === email);
}

export function getAllUsers(): AppUser[] {
  return Array.from(users.values());
}

export function upsertUser(user: AppUser): void {
  users.set(user.id, user);
}

export function incrementUsage(userId: string): void {
  const user = users.get(userId);
  if (user) {
    user.dailyUsage += 1;
    user.totalUsage += 1;
    user.lastActiveAt = new Date().toISOString();
    users.set(userId, user);
  }
}

export function updateUserRole(userId: string, role: UserRole): boolean {
  const user = users.get(userId);
  if (!user) return false;
  user.role = role;
  users.set(userId, user);
  return true;
}

export function toggleUserActive(userId: string): boolean {
  const user = users.get(userId);
  if (!user) return false;
  user.isActive = !user.isActive;
  users.set(userId, user);
  return true;
}

// ─── Usage tracking (visitor by IP) ──────────────────────────
const visitorUsage = new Map<string, { count: number; date: string }>();

export function getVisitorUsage(ip: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const entry = visitorUsage.get(ip);
  if (!entry || entry.date !== today) return 0;
  return entry.count;
}

export function incrementVisitorUsage(ip: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = visitorUsage.get(ip);
  if (!entry || entry.date !== today) {
    visitorUsage.set(ip, { count: 1, date: today });
  } else {
    entry.count += 1;
    visitorUsage.set(ip, entry);
  }
}
