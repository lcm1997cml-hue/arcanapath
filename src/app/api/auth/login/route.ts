// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "請輸入電郵和密碼" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ ok: false, error: "電郵或密碼錯誤" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, display_name")
      .eq("id", data.user.id)
      .single();

    const role = ((profile?.role as UserRole | undefined) ?? "member");
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return NextResponse.json({ ok: false, error: "帳戶已停用" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: data.user.id,
        email: data.user.email ?? "",
        role,
        name:
          profile?.display_name ??
          (typeof data.user.user_metadata?.display_name === "string"
            ? data.user.user_metadata.display_name
            : typeof data.user.user_metadata?.name === "string"
            ? data.user.user_metadata.name
            : undefined),
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "伺服器錯誤" }, { status: 500 });
  }
}
