// src/app/api/result/[id]/route.ts
"use client";

export const dynamic = "force-dynamic";import { NextRequest, NextResponse } from "next/server";
import { getReading } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { getUsageLimits } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = getReading(id);

    if (!result) {
      return NextResponse.json({ ok: false, error: "找不到此占卜結果" }, { status: 404 });
    }

    const user = await getCurrentUser();
    const limits = getUsageLimits(user);

    // If user is admin or already paid, return full result
    if (!limits.showPaywall || result.isPaid) {
      return NextResponse.json({ ok: true, data: result });
    }

    // Otherwise strip paid content
    const freeResult = {
      ...result,
      deepReading: undefined,
      timelineReport: undefined,
      qaBonus: undefined,
    };

    return NextResponse.json({ ok: true, data: freeResult });
  } catch (err) {
    console.error("[/api/result]", err);
    return NextResponse.json({ ok: false, error: "伺服器錯誤" }, { status: 500 });
  }
}
