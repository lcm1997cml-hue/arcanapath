// =============================================================
// src/lib/reading/normalize.ts
// Guarantees a ReadingResult is always complete.
// wakeUpLine has been removed from FreeReading schema.
// =============================================================

import type {
  ReadingResult, FreeReading, DeepReading,
  TimelineReport, QaBonus, CardReading, DrawnCard, Topic,
} from "@/types/reading";

function str(v: unknown, fb = ""): string {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  if (Array.isArray(v)) return v.map((x) => String(x)).join("；");
  return fb;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeFreeReading(raw: unknown, cards: DrawnCard[]): FreeReading {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const rawCR = arr<unknown>(r.cardReadings);
  const cardReadings: CardReading[] = cards.map((dc, i) => {
    const cr = (rawCR[i] && typeof rawCR[i] === "object" ? rawCR[i] : {}) as Record<string, unknown>;
    return {
      position:       str(cr.position, dc.position),
      cardName:       str(cr.cardName, dc.card.name_zh),
      interpretation: str(cr.interpretation,
        dc.reversed ? dc.card.meaning_reversed : dc.card.meaning_upright),
    };
  });
  while (cardReadings.length < 3) {
    cardReadings.push({ position: `第${cardReadings.length + 1}張`, cardName: "未知", interpretation: "牌面解讀暫時未能載入。" });
  }

  return {
    headline:     str(r.headline,  "牌面已揭示，答案在你心中"),
    mainAxis:     str(r.mainAxis,  "請見下方各牌詳細解讀。"),
    cardReadings,
    nextStep:     str(r.nextStep,  "靜下來，誠實面對你真正想要的結果。"),
  };
}

function normalizeDeepReading(raw: unknown): DeepReading | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pb = str(r.psychologicalBreakdown);
  const ht = str(r.hiddenTruth);
  const aa = str(r.actionAdvice);
  const hq = str(r.hardQuestion);
  if (!pb && !ht && !aa && !hq) return null;
  return {
    psychologicalBreakdown: pb || "深度分析暫時未能載入。",
    hiddenTruth:            ht || "局勢真相分析暫時未能載入。",
    actionAdvice:           aa || "行動建議暫時未能載入。",
    hardQuestion:           hq || "核心問題暫時未能載入。",
  };
}

function normalizeTimeline(raw: unknown): TimelineReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const st = str(r.shortTerm), mt = str(r.midTerm), lt = str(r.longTerm);
  if (!st && !mt && !lt) return null;
  return {
    shortTerm: st || "短期走向暫時未能載入。",
    midTerm:   mt || "中期走向暫時未能載入。",
    longTerm:  lt || "長期走向暫時未能載入。",
  };
}

function normalizeQa(raw: unknown): QaBonus[] {
  return arr<unknown>(raw)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      const q = str(r.question), a = str(r.answer);
      if (!q || !a) return null;
      return { question: q, answer: a };
    })
    .filter((x): x is QaBonus => x !== null)
    .slice(0, 3);
}

export function normalizeResult(
  raw: Record<string, unknown>,
  cards: DrawnCard[],
  overrides: { id: string; question: string; topic: Topic; userId: string | null }
): ReadingResult {
  return {
    id:             overrides.id,
    createdAt:      new Date().toISOString(),
    question:       overrides.question,
    topic:          overrides.topic,
    cards,
    freeReading:    normalizeFreeReading(raw.freeReading, cards),
    deepReading:    normalizeDeepReading(raw.deepReading),
    timelineReport: normalizeTimeline(raw.timelineReport),
    qaBonus:        normalizeQa(raw.qaBonus),
    isPaid:         false,
    userId:         overrides.userId,
  };
}

export function stripPaidContent(result: ReadingResult): ReadingResult {
  return { ...result, deepReading: null, timelineReport: null, qaBonus: [] };
}
