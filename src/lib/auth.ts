// src/lib/auth.ts
import { cookies } from "next/headers";
import type { AppUser, UserRole, UsageLimit } from "@/types";
import { ROLE_LIMITS } from "@/types";
import { getUserById, getUserByEmail } from "@/lib/store";

const ADMIN_SESSION_COOKIE = "arcana_admin_session";
const DEFAULT_ADMIN_EMAIL = "admin@arcanapath.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as {
      userId?: string;
    };
    if (!payload?.userId) return null;

    const user = getUserById(payload.userId);
    if (!user || user.role !== "admin" || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function createAdminSessionToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64");
}

export async function authenticateAdmin(email: string, password: string): Promise<AppUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  if (normalizedEmail !== adminEmail) return null;
  if (password !== adminPassword) return null;

  const user = getUserByEmail(adminEmail);
  if (!user || user.role !== "admin" || !user.isActive) return null;
  return user;
}

// ─── Check if user is admin ───────────────────────────────────
export function isAdmin(user: AppUser | null): boolean {
  return user?.role === "admin";
}

// ─── Get usage limits for user ────────────────────────────────
export function getUsageLimits(user: AppUser | null): UsageLimit {
  const role: UserRole = user?.role ?? "visitor";
  return ROLE_LIMITS[role];
}

// Compatibility helper for pages using newer RolePolicy shape.
export function getRolePolicy(user: AppUser | null): {
  dailyLimit: number;
  canSeeHistory: boolean;
  canBuyReport: boolean;
  showPaywall: boolean;
} {
  const limits = getUsageLimits(user);
  return {
    dailyLimit: limits.daily,
    canSeeHistory: limits.canSeeHistory,
    canBuyReport: limits.canBuyReport,
    showPaywall: limits.showPaywall,
  };
}

// ─── Check if user can do a reading ──────────────────────────
export function canDoReading(user: AppUser | null, visitorUsage = 0): boolean {
  if (!user) {
    return visitorUsage < ROLE_LIMITS.visitor.daily;
  }
  const limits = getUsageLimits(user);
  if (limits.daily === -1) return true;
  return user.dailyUsage < limits.daily;
}
