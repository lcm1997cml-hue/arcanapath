// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ ok: false, error: "登出失敗" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
