// src/lib/store.ts
// ─────────────────────────────────────────────────────────────
// In-memory store – acts as mock DB for local dev.
// Replace with Prisma/Supabase calls in production.
// ─────────────────────────────────────────────────────────────
import type { ReadingResult, AppUser, UserRole } from "@/types";

// ─── Readings store ──────────────────────────────────────────
const readings = new Map<string, ReadingResult>();

export function saveReading(result: ReadingResult): void {
  readings.set(result.id, result);
}

export function getReading(id: string): ReadingResult | undefined {
  return readings.get(id);
}

export function getReadingsByUser(userId: string): ReadingResult[] {
  return Array.from(readings.values()).filter((r) => r.userId === userId);
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
