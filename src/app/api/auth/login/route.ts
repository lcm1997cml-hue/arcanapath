// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, createAdminSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "請輸入電郵和密碼" }, { status: 400 });
    }

    const user = await authenticateAdmin(email, password);
    if (!user) {
      return NextResponse.json({ ok: false, error: "電郵或密碼錯誤" }, { status: 401 });
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({
      ok: true,
      data: {
        id: "admin",
        email: process.env.ADMIN_EMAIL!,
        role: "admin",
        name: "Admin",
      },
    });

    response.cookies.set("arcana_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ ok: false, error: "伺服器錯誤" }, { status: 500 });
  }
}
