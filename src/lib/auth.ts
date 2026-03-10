// src/lib/auth.ts
// ─────────────────────────────────────────────────────────────
// Simple mock auth for local dev.
// In production: replace with NextAuth / Clerk / Supabase Auth.
// ─────────────────────────────────────────────────────────────
import { cookies } from "next/headers";
import { getUserById, getUserByEmail } from "./store";
import type { AppUser, UserRole, UsageLimit } from "@/types";
import { ROLE_LIMITS } from "@/types";

// ─── Session cookie key ───────────────────────────────────────
const SESSION_COOKIE = "arcana_session";

// ─── Get current user from cookie (server-side) ───────────────
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE)?.value;
    if (!session) return null;
    const { userId } = JSON.parse(Buffer.from(session, "base64").toString());
    return getUserById(userId) ?? null;
  } catch {
    return null;
  }
}

// ─── Create session token ─────────────────────────────────────
export function createSessionToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64");
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

// ─── Authenticate user (mock) ─────────────────────────────────
export async function authenticateUser(
  email: string,
  _password: string
): Promise<AppUser | null> {
  // In production: verify hashed password
  const user = getUserByEmail(email);
  if (!user || !user.isActive) return null;
  return user;
}

// ─── Production auth recommendation ──────────────────────────
// Recommended: use Clerk (clerk.com)
// Reasons:
// 1. Drop-in Next.js App Router support with middleware
// 2. Built-in UI components (login, register, profile)
// 3. Role/metadata support via publicMetadata
// 4. Social + email/password auth out of the box
// 5. Webhooks for user lifecycle events
// 6. Free tier is generous for MVP
//
// Alternative: Supabase Auth
// - Good if you're already using Supabase for DB
// - More DIY but very flexible
//
// Alternative: Auth.js (NextAuth v5)
// - Open source, self-hosted
// - More setup work but full control
