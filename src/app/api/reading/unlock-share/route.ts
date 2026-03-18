import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { addVisitorFreeCredits } from "@/lib/store";

const VISITOR_COOKIE = "arcana_visitor_id";

export async function POST(req: NextRequest) {
  try {
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    const row = await addVisitorFreeCredits(visitorId, 3);
    const remainingFree = Math.max(0, Number(row.free_limit ?? 0) - Number(row.usage_count ?? 0));

    const res = NextResponse.json({ ok: true, remainingFree });
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
