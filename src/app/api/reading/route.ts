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
    console.log("[reading] request received");
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
    console.log("[reading] input valid", {
      topic,
      questionLength: question?.trim()?.length,
      cardCount: serializedCards?.length,
    });

    // ─── Auth & usage check ──────────────────────────────────
    const user = await getCurrentUser();
    console.log("[reading] user", user ? { id: user.id, role: user.role } : null);
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    console.log("[reading] ip", ip);
    const visitorUsage = getVisitorUsage(ip);
    console.log("[reading] visitorUsage", visitorUsage);
    const canRead = canDoReading(user, visitorUsage);
    console.log("[reading] canDoReading", canRead);

    if (!canRead) {
      const message = user
        ? `你今日的免費抽牌次數已用盡（${user.role === "member" ? "每日3次" : "每日1次"}）`
        : "訪客每日限免費抽牌1次，請登入或註冊獲得更多次數";
      return NextResponse.json({ ok: false, error: message }, { status: 403 });
    }

    // ─── Deserialize cards ───────────────────────────────────
    let drawnCards;
    try {
      drawnCards = deserializeDrawnCards(serializedCards);
      console.log("[reading] cards deserialized");
    } catch (e) {
      return NextResponse.json({ ok: false, error: "牌陣資料錯誤" }, { status: 400 });
    }

    // ─── Generate reading ────────────────────────────────────
    console.log("[reading] generateReading start");
    const result = await generateReading({
      id: nanoid(12),
      question: question.trim(),
      topic: topic as Topic,
      cards: drawnCards,
      userId: user?.id ?? null,
    });
    console.log("[reading] generateReading success", { id: result?.id });

    // ─── Save & increment usage ──────────────────────────────
    console.log("[reading] saveReading start");
    await saveReading(result as any);
    console.log("[reading] saveReading success");

    console.log("[reading] increment usage start");
    if (user) {
      incrementUsage(user.id);
    } else {
      incrementVisitorUsage(ip);
    }
    console.log("[reading] increment usage success");

    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    console.error("[/api/reading] full error:", err);
    if (err instanceof Error) {
      console.error("[/api/reading] error message:", err.message);
      console.error("[/api/reading] error stack:", err.stack);
    }
    return NextResponse.json({ ok: false, error: "伺服器錯誤，請稍後再試" }, { status: 500 });
  }
}
