// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, upsertUser, updateUserRole, toggleUserActive } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types";
import { nanoid } from "nanoid";

async function checkAdmin(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "無權限" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/users – list all users
export async function GET(req: NextRequest) {
  const denied = await checkAdmin(req);
  if (denied) return denied;

  const users = getAllUsers();
  return NextResponse.json({ ok: true, data: users });
}

// POST /api/admin/users – create user
export async function POST(req: NextRequest) {
  const denied = await checkAdmin(req);
  if (denied) return denied;

  const { email, name, role } = await req.json();
  if (!email || !role) {
    return NextResponse.json({ ok: false, error: "缺少必要欄位" }, { status: 400 });
  }

  const newUser = {
    id: nanoid(),
    email,
    name: name ?? email.split("@")[0],
    role: role as UserRole,
    dailyUsage: 0,
    totalUsage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  upsertUser(newUser);
  return NextResponse.json({ ok: true, data: newUser });
}

// PATCH /api/admin/users – update role or active status
export async function PATCH(req: NextRequest) {
  const denied = await checkAdmin(req);
  if (denied) return denied;

  const { userId, action, role } = await req.json();
  if (!userId) return NextResponse.json({ ok: false, error: "缺少 userId" }, { status: 400 });

  if (action === "toggleActive") {
    const ok = toggleUserActive(userId);
    return NextResponse.json({ ok });
  }

  if (action === "setRole" && role) {
    const ok = updateUserRole(userId, role as UserRole);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ ok: false, error: "未知操作" }, { status: 400 });
}
