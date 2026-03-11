// src/app/api/reading/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { generateReading } from "@/lib/reading/generate";
import {
  saveReading,
  incrementUsage,
  getOrCreateLeadByEmail,
  incrementLeadUsage,
  getOrCreateVisitorUsage,
  incrementVisitorUsagePersistent,
  isValidLeadEmail,
  normalizeLeadEmail,
} from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { deserializeDrawnCards } from "@/lib/tarot/utils";
import type { Topic } from "@/types/reading";

const VISITOR_COOKIE = "arcana_visitor_id";

export async function POST(req: NextRequest) {
  try {
    console.log("[reading] request received");
    const body = await req.json();
    const { question, topic, cards: serializedCards, email } = body;

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
    const isAdmin = user?.role === "admin";
    let leadEmail: string | null = null;
    let leadLimit = 3;
    let visitorLimit = 1;
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    if (!isAdmin) {
      const hasEmail = typeof email === "string" && email.trim().length > 0;
      if (hasEmail) {
        if (!isValidLeadEmail(email)) {
          const res = NextResponse.json(
            { ok: false, error: "請輸入有效電郵" },
            { status: 400 }
          );
          res.cookies.set(VISITOR_COOKIE, visitorId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
          return res;
        }
        leadEmail = normalizeLeadEmail(email);
        const lead = await getOrCreateLeadByEmail(leadEmail);
        leadLimit = Number(lead.free_limit ?? 3);
        if ((lead.usage_count ?? 0) >= leadLimit) {
          const res = NextResponse.json(
            { ok: false, error: "此電郵的免費占卜次數已用完", remainingFree: 0 },
            { status: 403 }
          );
          res.cookies.set(VISITOR_COOKIE, visitorId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
          return res;
        }
      } else {
        const visitorUsage = await getOrCreateVisitorUsage(visitorId);
        visitorLimit = Number(visitorUsage.free_limit ?? 1);
        if ((visitorUsage.usage_count ?? 0) >= visitorLimit) {
          const res = NextResponse.json(
            {
              ok: false,
              error: "再留下 email，即可獲得 3 次免費占卜",
              requireEmailCapture: true,
              remainingFree: 0,
            },
            { status: 403 }
          );
          res.cookies.set(VISITOR_COOKIE, visitorId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
          return res;
        }
      }
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
      userId: isAdmin ? user?.id ?? null : null,
    });
    console.log("[reading] generateReading success", { id: result?.id });

    // ─── Save & increment usage ──────────────────────────────
    console.log("[reading] saveReading start");
    await saveReading(result as any);
    console.log("[reading] saveReading success");

    console.log("[reading] increment usage start");
    let remainingFree: number | null = null;
    if (isAdmin && user) {
      incrementUsage(user.id);
    } else if (leadEmail) {
      const nextUsageCount = await incrementLeadUsage(leadEmail);
      remainingFree = Math.max(0, leadLimit - nextUsageCount);
    } else {
      const nextUsageCount = await incrementVisitorUsagePersistent(visitorId);
      remainingFree = Math.max(0, visitorLimit - nextUsageCount);
    }
    console.log("[reading] increment usage success");

    const res = NextResponse.json({ ok: true, id: result.id, remainingFree });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[/api/reading] full error:", err);
    if (err instanceof Error) {
      console.error("[/api/reading] error message:", err.message);
      console.error("[/api/reading] error stack:", err.stack);
    }
    return NextResponse.json({ ok: false, error: "伺服器錯誤，請稍後再試" }, { status: 500 });
  }
}
