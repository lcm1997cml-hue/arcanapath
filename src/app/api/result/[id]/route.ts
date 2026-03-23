// src/app/api/result/[id]/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { consumePremiumAccessForView, getReading } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { getUsageLimits } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const VISITOR_COOKIE = "arcana_visitor_id";
    const LEAD_EMAIL_COOKIE = "arcana_lead_email";
    const { id } = await params;
    const result = await getReading(id);

    if (!result) {
      return NextResponse.json({ ok: false, error: "找不到此占卜結果" }, { status: 404 });
    }

    const user = await getCurrentUser();
    const limits = getUsageLimits(user);

    const paidPlan = (result as any)?.paidPlan as "19" | "39" | "88" | undefined;
    const isPaidInDb = !!result.isPaid;

    // If user is admin, return full result
    if (!limits.showPaywall) {
      return NextResponse.json({ ok: true, data: result });
    }

    let accountPremium = false;
    if (!isPaidInDb) {
      const visitorId = req.cookies.get(VISITOR_COOKIE)?.value?.trim() ?? "";
      const restoredEmail = req.cookies.get(LEAD_EMAIL_COOKIE)?.value?.trim() ?? "";
      if (visitorId) {
        const consume = await consumePremiumAccessForView(visitorId, restoredEmail || undefined);
        accountPremium = consume.ok;
      }
    }

    const unlockDeep = accountPremium || (isPaidInDb && (paidPlan === "19" || paidPlan === "39" || paidPlan === "88"));
    const unlockTimeline = accountPremium || (isPaidInDb && (paidPlan === "39" || paidPlan === "88"));
    const unlockQa = accountPremium || (isPaidInDb && paidPlan === "88");

    const freeResult = {
      ...result,
      deepReading: unlockDeep ? result.deepReading : undefined,
      timelineReport: unlockTimeline ? result.timelineReport : undefined,
      qaBonus: unlockQa ? result.qaBonus : undefined,
    };

    return NextResponse.json({ ok: true, data: freeResult });
  } catch (err) {
    console.error("[/api/result]", err);
    return NextResponse.json({ ok: false, error: "伺服器錯誤" }, { status: 500 });
  }
}
