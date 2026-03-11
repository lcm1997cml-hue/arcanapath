// src/app/api/reading/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { generateReading } from "@/lib/reading/generate";
import { saveReading, getVisitorUsage, incrementVisitorUsage, incrementUsage } from "@/lib/store";
import { getCurrentUser, canDoReading } from "@/lib/auth";
import { deserializeDrawnCards } from "@/lib/tarot/utils";
import type { Topic } from "@/types/reading";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, topic, cards: serializedCards } = body;

    // ─── Validate input ──────────────────────────────────────
    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return NextResponse.json({ ok: false, error: "請輸入有效問題" }, { status: 400 });
    }

    const validTopics: Topic[] = ["love", "career", "wealth", "life"];
    if (!validTopics.includes(topic)) {
      return NextResponse.json({ ok: false, error: "無效主題" }, { status: 400 });
    }

    if (!Array.isArray(serializedCards) || serializedCards.length !== 3) {
      return NextResponse.json({ ok: false, error: "需要3張牌" }, { status: 400 });
    }

    // ─── Auth & usage check ──────────────────────────────────
    const user = await getCurrentUser();
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const visitorUsage = getVisitorUsage(ip);

    if (!canDoReading(user, visitorUsage)) {
      const message = user
        ? `你今日的免費抽牌次數已用盡（${user.role === "member" ? "每日3次" : "每日1次"}）`
        : "訪客每日限免費抽牌1次，請登入或註冊獲得更多次數";
      return NextResponse.json({ ok: false, error: message }, { status: 403 });
    }

    // ─── Deserialize cards ───────────────────────────────────
    let drawnCards;
    try {
      drawnCards = deserializeDrawnCards(serializedCards);
    } catch (e) {
      return NextResponse.json({ ok: false, error: "牌陣資料錯誤" }, { status: 400 });
    }

    // ─── Generate reading ────────────────────────────────────
    const result = await generateReading({
      id: nanoid(12),
      question: question.trim(),
      topic: topic as Topic,
      cards: drawnCards,
      userId: user?.id ?? null,
    });

    // ─── Save & increment usage ──────────────────────────────
    saveReading(result as any);

    if (user) {
      incrementUsage(user.id);
    } else {
      incrementVisitorUsage(ip);
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    console.error("[/api/reading] error:", err);
    return NextResponse.json({ ok: false, error: "伺服器錯誤，請稍後再試" }, { status: 500 });
  }
}
