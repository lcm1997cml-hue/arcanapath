import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { claimEmailBonusForVisitor, isValidLeadEmail, normalizeLeadEmail } from "@/lib/store";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "arcana_visitor_id";

export async function POST(req: NextRequest) {
  try {
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const raw = typeof body.email === "string" ? body.email.trim() : "";
    if (!raw || !isValidLeadEmail(raw)) {
      return NextResponse.json({ ok: false, error: "請輸入有效 email" }, { status: 400 });
    }

    const result = await claimEmailBonusForVisitor(visitorId, normalizeLeadEmail(raw));

    const res = NextResponse.json({
      ok: true,
      awarded: result.awarded,
      remainingFreeCount: result.remainingFreeCount,
      message: result.message,
    });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch (e) {
    if (e instanceof Error && e.message === "invalid email") {
      return NextResponse.json({ ok: false, error: "請輸入有效 email" }, { status: 400 });
    }
    console.error("[/api/email-bonus]", e);
    return NextResponse.json({ ok: false, error: "處理失敗，請稍後再試" }, { status: 500 });
  }
}
