// src/lib/auth.ts
import type { AppUser, UserRole, UsageLimit } from "@/types";
import { ROLE_LIMITS } from "@/types";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, display_name, daily_usage")
      .eq("id", user.id)
      .single();

    const role = ((profile?.role as UserRole | undefined) ?? "member");
    const dailyUsage = Number(profile?.daily_usage ?? 0);

    return {
      id: user.id,
      email: user.email ?? "",
      name:
        profile?.display_name ??
        (typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : undefined),
      role,
      dailyUsage,
      totalUsage: dailyUsage,
      isActive: profile?.is_active ?? true,
      createdAt: user.created_at ?? new Date().toISOString(),
      lastActiveAt: user.last_sign_in_at ?? user.created_at ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
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
