import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/db";
import type { UserRole } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "請填寫所有必填欄位" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ ok: false, error: "密碼最少6位" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: typeof name === "string" ? name.trim() : "",
        },
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const user = data.user;
    const session = data.session;
    if (!user) {
      return NextResponse.json({ ok: false, error: "註冊失敗，請稍後再試" }, { status: 400 });
    }

    // Best-effort profile init for Phase 2 auth compatibility.
    const supabaseAdmin = getSupabaseAdmin();
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        role: "member" as UserRole,
        is_active: true,
        display_name: typeof name === "string" ? name.trim() : null,
        daily_usage: 0,
      },
      { onConflict: "id" }
    );
    if (profileError) {
      return NextResponse.json({ ok: false, error: "建立使用者資料失敗" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email ?? email,
        role: "member" as UserRole,
        name: typeof name === "string" && name.trim() ? name.trim() : undefined,
        needsEmailVerification: !session,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "伺服器錯誤" }, { status: 500 });
  }
}
