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
  readingId: string,
  plan: "19" | "39" | "88"
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("readings")
    .update({ is_paid: true, paid_plan: plan })
    .eq("id", readingId);
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

type LeadRow = {
  id: string;
  email: string;
  usage_count: number;
  free_limit: number;
  plan_type?: string | null;
  plan_credits?: number | null;
  premium_expires_at?: string | null;
  plan_expires_at?: string | null;
};

type VisitorUsageRow = {
  id: string;
  visitor_id: string;
  usage_count: number;
  free_limit: number;
  created_at: string;
  updated_at: string;
  plan_type?: string | null;
  plan_credits?: number | null;
  premium_expires_at?: string | null;
  plan_expires_at?: string | null;
};

const LEAD_SELECT_WITH_PREMIUM = `
  id,
  email,
  usage_count,
  free_limit,
  premium_expires_at,
  plan_type,
  plan_credits
`;

const LEAD_SELECT_WITH_PLAN_EXPIRES = `
  id,
  email,
  usage_count,
  free_limit,
  plan_expires_at,
  plan_type,
  plan_credits
`;

const LEAD_SELECT_BASIC = "id,email,usage_count,free_limit";

function normalizeLeadRow(raw: any): LeadRow {
  return {
    id: String(raw?.id ?? ""),
    email: String(raw?.email ?? ""),
    usage_count: Number(raw?.usage_count ?? 0),
    free_limit: Number(raw?.free_limit ?? 0),
    plan_type: raw?.plan_type ?? "free",
    plan_credits: Number(raw?.plan_credits ?? 0),
    premium_expires_at: raw?.premium_expires_at ?? null,
    plan_expires_at: raw?.plan_expires_at ?? null,
  };
}

async function getLeadByEmailSafeInternal(supabase: ReturnType<typeof getSupabaseAdmin>, normalizedEmail: string): Promise<LeadRow | null> {
  const tries = [LEAD_SELECT_WITH_PREMIUM, LEAD_SELECT_WITH_PLAN_EXPIRES, LEAD_SELECT_BASIC] as const;
  for (const sel of tries) {
    const { data, error } = await supabase.from("leads").select(sel).eq("email", normalizedEmail).maybeSingle();
    if (!error) return data ? normalizeLeadRow(data) : null;
    const msg = String((error as any)?.message ?? "").toLowerCase();
    const missingColumn = (error as any)?.code === "42703" || msg.includes("column") || msg.includes("schema cache");
    if (!missingColumn || sel === LEAD_SELECT_BASIC) throw error;
  }
  return null;
}

export function normalizeLeadEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidLeadEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function getLeadByEmail(email: string): Promise<LeadRow | null> {
  const normalizedEmail = normalizeLeadEmail(email);
  const supabase = getSupabaseAdmin();
  return getLeadByEmailSafeInternal(supabase, normalizedEmail);
}

export async function getOrCreateLeadByEmail(email: string): Promise<LeadRow> {
  const normalizedEmail = normalizeLeadEmail(email);
  const existing = await getLeadByEmail(normalizedEmail);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const first = await supabase
    .from("leads")
    .insert({ email: normalizedEmail, usage_count: 0, free_limit: 0, plan_credits: 0 })
    .select(LEAD_SELECT_WITH_PREMIUM)
    .single();
  if (!first.error && first.data) return normalizeLeadRow(first.data);

  const msg = String((first.error as any)?.message ?? "").toLowerCase();
  const missingColumn = (first.error as any)?.code === "42703" || msg.includes("column");
  if (!missingColumn) throw first.error;

  const fallback = await supabase
    .from("leads")
    .insert({ email: normalizedEmail, usage_count: 0, free_limit: 0 })
    .select(LEAD_SELECT_BASIC)
    .single();
  if (fallback.error) throw fallback.error;
  return normalizeLeadRow(fallback.data);
}

export async function incrementLeadUsage(email: string): Promise<number> {
  const lead = await getOrCreateLeadByEmail(email);
  const nextUsageCount = Number(lead.usage_count ?? 0) + 1;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("leads")
    .update({ usage_count: nextUsageCount })
    .eq("id", lead.id);
  if (error) throw error;
  return nextUsageCount;
}

export async function getOrCreateVisitorUsage(visitorId: string): Promise<VisitorUsageRow> {
  const normalizedVisitorId = visitorId.trim();
  const supabase = getSupabaseAdmin();
  const fullSelect = "id,visitor_id,usage_count,free_limit,created_at,updated_at,plan_type,plan_credits,plan_expires_at,premium_expires_at";
  const basicSelect = "id,visitor_id,usage_count,free_limit,created_at,updated_at";
  let existing: any = null;
  let queryError: any = null;
  ({ data: existing, error: queryError } = await supabase
    .from("visitor_usage")
    .select(fullSelect)
    .eq("visitor_id", normalizedVisitorId)
    .maybeSingle());
  if (queryError) {
    const msg = String(queryError?.message ?? "").toLowerCase();
    const missingColumn = queryError?.code === "42703" || msg.includes("column") || msg.includes("schema cache");
    if (!missingColumn) throw queryError;
    const fallback = await supabase
      .from("visitor_usage")
      .select(basicSelect)
      .eq("visitor_id", normalizedVisitorId)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    existing = fallback.data;
  }
  if (existing) return existing as VisitorUsageRow;

  let inserted: any = null;
  let insertErr: any = null;
  ({ data: inserted, error: insertErr } = await supabase
    .from("visitor_usage")
    .insert({ visitor_id: normalizedVisitorId, usage_count: 0, free_limit: 1, plan_credits: 0 })
    .select(fullSelect)
    .single());
  if (insertErr) {
    const msg = String(insertErr?.message ?? "").toLowerCase();
    const missingColumn = insertErr?.code === "42703" || msg.includes("column");
    if (!missingColumn) throw insertErr;
    const fallback = await supabase
      .from("visitor_usage")
      .insert({ visitor_id: normalizedVisitorId, usage_count: 0, free_limit: 1 })
      .select(basicSelect)
      .single();
    if (fallback.error) throw fallback.error;
    inserted = fallback.data;
  }
  return inserted as VisitorUsageRow;
}

export async function incrementVisitorUsagePersistent(visitorId: string): Promise<number> {
  const row = await getOrCreateVisitorUsage(visitorId);
  const nextUsageCount = Number(row.usage_count ?? 0) + 1;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("visitor_usage")
    .update({ usage_count: nextUsageCount })
    .eq("id", row.id);
  if (error) throw error;
  return nextUsageCount;
}

export async function addVisitorFreeCredits(visitorId: string, credits: number): Promise<VisitorUsageRow> {
  const row = await getOrCreateVisitorUsage(visitorId);
  const nextFreeLimit = Number(row.free_limit ?? 1) + Math.max(0, credits);

  const supabase = getSupabaseAdmin();
  const fullSelect = "id,visitor_id,usage_count,free_limit,created_at,updated_at,plan_type,plan_credits,plan_expires_at,premium_expires_at";
  const basicSelect = "id,visitor_id,usage_count,free_limit,created_at,updated_at";
  const first = await supabase
    .from("visitor_usage")
    .update({ free_limit: nextFreeLimit })
    .eq("id", row.id)
    .select(fullSelect)
    .single();
  if (!first.error) return first.data as VisitorUsageRow;
  const msg = String((first.error as any)?.message ?? "").toLowerCase();
  const missingColumn = (first.error as any)?.code === "42703" || msg.includes("column");
  if (!missingColumn) throw first.error;
  const fallback = await supabase
    .from("visitor_usage")
    .update({ free_limit: nextFreeLimit })
    .eq("id", row.id)
    .select(basicSelect)
    .single();
  if (fallback.error) throw fallback.error;
  return fallback.data as VisitorUsageRow;
}

export async function getVisitorRemainingFree(visitorId: string): Promise<number> {
  const row = await getOrCreateVisitorUsage(visitorId);
  return Math.max(0, Number(row.free_limit ?? 0) - Number(row.usage_count ?? 0));
}

export async function addLeadFreeCredits(email: string, credits: number): Promise<LeadRow> {
  const lead = await getOrCreateLeadByEmail(email);
  const before = Number(lead.free_limit ?? 0);
  const add = Math.max(0, credits);
  const nextFreeLimit = before + add;
  console.log("[addLeadFreeCredits] lead", lead.id, "free_limit before:", before, "add:", add);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .update({ free_limit: nextFreeLimit })
    .eq("id", lead.id)
    .select(LEAD_SELECT_WITH_PREMIUM)
    .single();
  if (!error) {
    console.log("[addLeadFreeCredits] free_limit after:", nextFreeLimit);
    return normalizeLeadRow(data);
  }
  const msg = String((error as any)?.message ?? "").toLowerCase();
  const missingColumn = (error as any)?.code === "42703" || msg.includes("column");
  if (!missingColumn) throw error;
  const fallback = await supabase
    .from("leads")
    .update({ free_limit: nextFreeLimit })
    .eq("id", lead.id)
    .select(LEAD_SELECT_BASIC)
    .single();
  if (fallback.error) throw fallback.error;
  console.log("[addLeadFreeCredits] free_limit after:", nextFreeLimit);
  return normalizeLeadRow(fallback.data);
}

export type LeadPlanAccess = {
  hasAccess: boolean;
  mode: "none" | "unlimited" | "credits";
  creditsLeft: number;
  isExpired: boolean;
  expiresAt: string | null;
};

function isPlanExpired(planExpiresAt?: string | null, now = new Date()): boolean {
  if (!planExpiresAt) return false;
  const exp = new Date(planExpiresAt);
  if (Number.isNaN(exp.getTime())) return true;
  return exp.getTime() <= now.getTime();
}

export function evaluateLeadPlanAccess(lead: LeadRow, now = new Date()): LeadPlanAccess {
  const planType = lead.plan_type ?? "free";
  const credits = Number(lead.plan_credits ?? 0);
  const expiresRaw = lead.premium_expires_at ?? lead.plan_expires_at ?? null;
  const expires = expiresRaw ? new Date(expiresRaw) : null;
  const isExpired = expires ? expires.getTime() <= now.getTime() : false;
  if (isExpired) {
    return { hasAccess: false, mode: "none", creditsLeft: 0, isExpired: true, expiresAt: expiresRaw };
  }

  if (planType === "unlimited") {
    return {
      hasAccess: true,
      mode: "unlimited",
      creditsLeft: credits,
      isExpired: false,
      expiresAt: expiresRaw,
    };
  }

  const safeCredits = Math.max(0, credits);
  if (safeCredits > 0) {
    return {
      hasAccess: true,
      mode: "credits",
      creditsLeft: safeCredits,
      isExpired: false,
      expiresAt: expiresRaw,
    };
  }

  return { hasAccess: false, mode: "none", creditsLeft: 0, isExpired: false, expiresAt: expiresRaw };
}

type PlanLike = {
  plan_type?: string | null;
  plan_credits?: number | null;
  premium_expires_at?: string | null;
  plan_expires_at?: string | null;
};

function evaluatePlanLikeAccess(plan: PlanLike, now = new Date()): LeadPlanAccess {
  const expRaw = plan.premium_expires_at ?? plan.plan_expires_at ?? null;
  const isExpired = isPlanExpired(expRaw, now);
  if (isExpired) {
    return { hasAccess: false, mode: "none", creditsLeft: 0, isExpired: true, expiresAt: expRaw };
  }
  if (plan.plan_type === "unlimited") {
    return { hasAccess: true, mode: "unlimited", creditsLeft: Number(plan.plan_credits ?? 0), isExpired: false, expiresAt: expRaw };
  }
  const credits = Math.max(0, Number(plan.plan_credits ?? 0));
  if (credits > 0) {
    return { hasAccess: true, mode: "credits", creditsLeft: credits, isExpired: false, expiresAt: expRaw };
  }
  return { hasAccess: false, mode: "none", creditsLeft: 0, isExpired: false, expiresAt: expRaw };
}

export async function hasPremiumAccess(
  visitorId: string,
  email?: string
): Promise<{
  hasAccess: boolean;
  mode: "none" | "unlimited" | "credits";
  creditsLeft: number;
  source: "lead" | "visitor" | "none";
  expiresAt: string | null;
}> {
  const normalizedVisitorId = visitorId.trim();
  const normalizedEmail = email ? normalizeLeadEmail(email) : "";

  if (normalizedEmail) {
    const lead = await getLeadByEmail(normalizedEmail);
    if (lead) {
      const a = evaluateLeadPlanAccess(lead);
      if (a.hasAccess) {
        return {
          hasAccess: true,
          mode: a.mode,
          creditsLeft: a.creditsLeft,
          source: "lead",
          expiresAt: a.expiresAt,
        };
      }
    }
  }

  const visitor = await getOrCreateVisitorUsage(normalizedVisitorId);
  const v = evaluatePlanLikeAccess(visitor);
  if (v.hasAccess) {
    return {
      hasAccess: true,
      mode: v.mode,
      creditsLeft: v.creditsLeft,
      source: "visitor",
      expiresAt: v.expiresAt,
    };
  }

  return { hasAccess: false, mode: "none", creditsLeft: 0, source: "none", expiresAt: null };
}

export async function consumePremiumAccessForView(
  visitorId: string,
  email?: string
): Promise<{
  ok: boolean;
  mode: "none" | "unlimited" | "credits";
  creditsLeft: number;
  source: "lead" | "visitor" | "none";
  reason?: "expired" | "no_access";
}> {
  const normalizedVisitorId = visitorId.trim();
  const normalizedEmail = email ? normalizeLeadEmail(email) : "";
  const access = await hasPremiumAccess(normalizedVisitorId, normalizedEmail || undefined);
  if (!access.hasAccess) return { ok: false, mode: "none", creditsLeft: 0, source: "none", reason: "no_access" };
  if (access.mode === "unlimited") {
    return { ok: true, mode: "unlimited", creditsLeft: access.creditsLeft, source: access.source };
  }

  // mode === credits: consume one credit per premium view.
  const next = Math.max(0, access.creditsLeft - 1);
  const supabase = getSupabaseAdmin();
  if (access.source === "lead" && normalizedEmail) {
    const lead = await getLeadByEmail(normalizedEmail);
    if (!lead) return { ok: false, mode: "none", creditsLeft: 0, source: "none", reason: "no_access" };
    const leadUpd = await supabase.from("leads").update({ plan_credits: next }).eq("id", lead.id);
    if (leadUpd.error) {
      const msg = String((leadUpd.error as any)?.message ?? "").toLowerCase();
      const missingColumn = (leadUpd.error as any)?.code === "42703" || msg.includes("column");
      if (!missingColumn) throw leadUpd.error;
      return { ok: false, mode: "none", creditsLeft: 0, source: "none", reason: "no_access" };
    }
    await supabase.from("visitor_usage").update({ plan_credits: next }).eq("visitor_id", normalizedVisitorId);
    return { ok: true, mode: "credits", creditsLeft: next, source: "lead" };
  }

  const visitor = await getOrCreateVisitorUsage(normalizedVisitorId);
  const upd = await supabase.from("visitor_usage").update({ plan_credits: next }).eq("id", visitor.id);
  if (upd.error) {
    const msg = String((upd.error as any)?.message ?? "").toLowerCase();
    const missingColumn = (upd.error as any)?.code === "42703" || msg.includes("column");
    if (!missingColumn) throw upd.error;
    return { ok: false, mode: "none", creditsLeft: 0, source: "none", reason: "no_access" };
  }
  return { ok: true, mode: "credits", creditsLeft: next, source: "visitor" };
}

export async function consumeLeadPlanUnlock(email: string): Promise<{
  ok: boolean;
  mode: "none" | "unlimited" | "credits";
  creditsLeft: number;
  reason?: string;
}> {
  const lead = await getLeadByEmail(email);
  if (!lead) return { ok: false, mode: "none", creditsLeft: 0, reason: "lead_not_found" };
  const access = evaluateLeadPlanAccess(lead);
  if (!access.hasAccess) {
    return { ok: false, mode: "none", creditsLeft: 0, reason: access.isExpired ? "plan_expired" : "no_plan_access" };
  }

  if (access.mode === "unlimited") {
    return { ok: true, mode: "unlimited", creditsLeft: access.creditsLeft };
  }

  const nextCredits = Math.max(0, access.creditsLeft - 1);
  const supabase = getSupabaseAdmin();
  const upd = await supabase.from("leads").update({ plan_credits: nextCredits }).eq("id", lead.id);
  if (upd.error) {
    const msg = String((upd.error as any)?.message ?? "").toLowerCase();
    const missingColumn = (upd.error as any)?.code === "42703" || msg.includes("column");
    if (!missingColumn) throw upd.error;
    return { ok: false, mode: "none", creditsLeft: 0, reason: "no_plan_access" };
  }
  return { ok: true, mode: "credits", creditsLeft: nextCredits };
}

export async function getLeadRemainingFree(email: string): Promise<number> {
  const lead = await getOrCreateLeadByEmail(email);
  return Math.max(0, Number(lead.free_limit ?? 0) - Number(lead.usage_count ?? 0));
}

function isPgUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (e.code === "23505") return true;
  const m = String(e.message ?? "").toLowerCase();
  return m.includes("duplicate key") || m.includes("unique constraint");
}

/**
 * Email +3：額度與 email 主資料只在 `leads`；`lead_email_bonus` 僅記錄「當日是否已領」。
 * 併發時若 insert 撞 unique，會把剛加的 `free_limit` 減回。
 */
export async function claimEmailBonusForVisitor(
  visitorId: string,
  email: string
): Promise<{
  awarded: boolean;
  remainingFreeCount: number;
  message?: string;
}> {
  if (!isValidLeadEmail(email)) {
    throw new Error("invalid email");
  }
  const normalizedEmail = normalizeLeadEmail(email);
  const normalizedVisitorId = visitorId.trim();
  const today = new Date().toISOString().slice(0, 10);
  const supabase = getSupabaseAdmin();

  console.log("[claimEmailBonus] email received:", normalizedEmail, "bonus_date:", today);

  const { data: alreadyRow, error: checkErr } = await supabase
    .from("lead_email_bonus")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("bonus_date", today)
    .maybeSingle();
  if (checkErr) throw checkErr;
  if (alreadyRow) {
    console.log("[claimEmailBonus] already claimed today (lead_email_bonus exists)");
    const remainingFreeCount = await getVisitorRemainingFree(normalizedVisitorId);
    return {
      awarded: false,
      remainingFreeCount,
      message: "今日已領取 email 獎勵",
    };
  }

  const existingLead = await getLeadByEmail(normalizedEmail);
  const lead = existingLead ?? (await getOrCreateLeadByEmail(normalizedEmail));
  console.log(
    "[claimEmailBonus]",
    existingLead ? "lead found" : "lead created",
    lead.id,
    lead.email,
    "free_limit before claim:",
    lead.free_limit
  );

  const freeLimitBefore = Number(lead.free_limit ?? 0);
  const freeLimitAfter = freeLimitBefore + 3;

  const { error: leadUpErr } = await supabase
    .from("leads")
    .update({ free_limit: freeLimitAfter })
    .eq("id", lead.id);
  if (leadUpErr) throw leadUpErr;
  console.log("[claimEmailBonus] leads.free_limit after +3:", freeLimitAfter);

  const { error: insertBonusError } = await supabase.from("lead_email_bonus").insert({
    email: normalizedEmail,
    bonus_date: today,
  });

  if (insertBonusError) {
    await supabase.from("leads").update({ free_limit: freeLimitBefore }).eq("id", lead.id);
    if (isPgUniqueViolation(insertBonusError)) {
      console.log("[claimEmailBonus] already claimed today (unique on insert, reverted free_limit)");
      const remainingFreeCount = await getVisitorRemainingFree(normalizedVisitorId);
      return {
        awarded: false,
        remainingFreeCount,
        message: "今日已領取 email 獎勵",
      };
    }
    throw insertBonusError;
  }

  try {
    const afterVisitor = await addVisitorFreeCredits(normalizedVisitorId, 3);
    const remainingFreeCount = Math.max(
      0,
      Number(afterVisitor.free_limit ?? 0) - Number(afterVisitor.usage_count ?? 0)
    );
    return { awarded: true, remainingFreeCount };
  } catch (err) {
    await supabase.from("lead_email_bonus").delete().eq("email", normalizedEmail).eq("bonus_date", today);
    await supabase.from("leads").update({ free_limit: freeLimitBefore }).eq("id", lead.id);
    throw err;
  }
}

/**
 * Restore access by email:
 * - Source of truth: leads.free_limit / usage_count
 * - Sync current visitor free limit so this browser can continue.
 */
export async function restoreAccessByEmailForVisitor(
  visitorId: string,
  email: string
): Promise<{
  restored: boolean;
  remainingFreeCount: number;
  planAccess?: {
    hasAccess: boolean;
    mode: "none" | "unlimited" | "credits";
    creditsLeft: number;
    expiresAt: string | null;
  };
  message?: string;
}> {
  if (!isValidLeadEmail(email)) {
    throw new Error("invalid email");
  }

  const normalizedEmail = normalizeLeadEmail(email);
  const normalizedVisitorId = visitorId.trim();
  const lead = await getLeadByEmail(normalizedEmail);
  if (!lead) {
    return { restored: false, remainingFreeCount: await getVisitorRemainingFree(normalizedVisitorId), message: "找不到此 email 的權限資料" };
  }
  const planAccess = evaluateLeadPlanAccess(lead);

  const leadRemaining = Math.max(0, Number(lead.free_limit ?? 0) - Number(lead.usage_count ?? 0));
  if (leadRemaining <= 0 && !planAccess.hasAccess) {
    return {
      restored: false,
      remainingFreeCount: await getVisitorRemainingFree(normalizedVisitorId),
      planAccess: {
        hasAccess: false,
        mode: "none",
        creditsLeft: 0,
        expiresAt: planAccess.expiresAt,
      },
      message: planAccess.isExpired ? "此 email 的方案已過期" : "此 email 目前沒有可恢復的可用次數",
    };
  }

  const visitor = await getOrCreateVisitorUsage(normalizedVisitorId);
  const visitorUsage = Number(visitor.usage_count ?? 0);
  const visitorCurrentRemaining = Math.max(0, Number(visitor.free_limit ?? 0) - visitorUsage);
  const targetVisitorFreeLimit = visitorUsage + Math.max(visitorCurrentRemaining, leadRemaining);

  const supabase = getSupabaseAdmin();
  const visitorUpdatePayload: {
    free_limit: number;
    plan_type: string | null;
    plan_credits: number;
    plan_expires_at: string | null;
  } = {
    free_limit: targetVisitorFreeLimit,
    plan_type: planAccess.mode === "unlimited" ? "unlimited" : null,
    plan_credits: planAccess.mode === "credits" ? planAccess.creditsLeft : 0,
    plan_expires_at: planAccess.expiresAt,
  };
  const primaryUpdate = await supabase
    .from("visitor_usage")
    .update(visitorUpdatePayload)
    .eq("id", visitor.id);
  if (primaryUpdate.error) {
    const msg = String((primaryUpdate.error as any)?.message ?? "").toLowerCase();
    const missingColumn = (primaryUpdate.error as any)?.code === "42703" || msg.includes("column");
    if (!missingColumn) throw primaryUpdate.error;
    const fallback = await supabase.from("visitor_usage").update({ free_limit: targetVisitorFreeLimit }).eq("id", visitor.id);
    if (fallback.error) throw fallback.error;
  }

  return {
    restored: true,
    remainingFreeCount: Math.max(visitorCurrentRemaining, leadRemaining),
    planAccess: {
      hasAccess: planAccess.hasAccess,
      mode: planAccess.mode,
      creditsLeft: planAccess.mode === "credits" ? planAccess.creditsLeft : 0,
      expiresAt: planAccess.expiresAt,
    },
  };
}
