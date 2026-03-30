import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { claimShareReward, getVisitorRemainingFree } from "@/lib/store";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "arcana_visitor_id";

export async function GET(req: NextRequest) {
  try {
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    const remainingFreeCount = await getVisitorRemainingFree(visitorId);
    const res = NextResponse.json({ ok: true, remainingFreeCount });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "讀取剩餘次數失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    const result = await claimShareReward({
      visitorId,
      credits: 3,
    });

    const res = NextResponse.json({
      ok: true,
      rewarded: result.rewarded,
      remainingFreeCount: result.remainingFreeCount,
    });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[/api/share-reward] full error:", err);
    return NextResponse.json({ ok: false, error: "分享獎勵處理失敗" }, { status: 500 });
  }
}
