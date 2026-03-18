import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { claimDailyShareBonus } from "@/lib/store";

const VISITOR_COOKIE = "arcana_visitor_id";

export async function POST(req: NextRequest) {
  try {
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    const { awarded, remainingFree } = await claimDailyShareBonus(visitorId, 3);

    const res = NextResponse.json({
      ok: true,
      awarded,
      remainingFree,
      message: awarded ? "🎉 已解鎖 +3 次占卜" : "今日已領取過 +3 次占卜",
    });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "解鎖失敗，請稍後再試" }, { status: 500 });
  }
}
