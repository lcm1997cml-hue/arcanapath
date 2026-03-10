// =============================================================
// src/types/reading.ts  — Single source of truth for all types
// =============================================================

export interface TarotCardData {
  id: number;
  name: string;
  name_zh: string;
  arcana: "major" | "minor";
  suit?: string;
  number: number;
  image: string;
  keywords: string[];
  keywords_reversed: string[];
  meaning_upright: string;
  meaning_reversed: string;
  description: string;
}

export interface DrawnCard {
  card: TarotCardData;
  position: string;
  reversed: boolean;
}

export interface SerializedCard {
  cardId: number;
  position: string;
  reversed: boolean;
}

export type Topic = "love" | "career" | "wealth" | "life";

export const TOPIC_LABELS: Record<Topic, string> = {
  love:   "感情",
  career: "事業",
  wealth: "財運",
  life:   "人生方向",
};

export interface CardReading {
  position: string;
  cardName: string;
  interpretation: string;
}

/**
 * Free reading — always shown.
 * Note: wakeUpLine removed. The direct/cutting tone is now
 * embedded throughout headline / mainAxis / cardReadings / nextStep.
 */
export interface FreeReading {
  headline:     string;          // ≤20字 直接結論
  mainAxis:     string;          // 整體主軸 3-5 句
  cardReadings: CardReading[];   // 三牌逐張短解
  nextStep:     string;          // 下一步具體建議
}

export interface DeepReading {
  psychologicalBreakdown: string;
  hiddenTruth:            string;
  actionAdvice:           string;
  hardQuestion:           string;
}

export interface TimelineReport {
  shortTerm: string;
  midTerm:   string;
  longTerm:  string;
}

export interface QaBonus {
  question: string;
  answer:   string;
}

export interface ReadingResult {
  id:              string;
  createdAt:       string;
  question:        string;
  topic:           Topic;
  cards:           DrawnCard[];
  freeReading:     FreeReading;
  deepReading:     DeepReading | null;
  timelineReport:  TimelineReport | null;
  qaBonus:         QaBonus[];
  isPaid:          boolean;
  userId:          string | null;
}

// ─── API ──────────────────────────────────────────────────────

export interface ReadingApiRequest {
  question: string;
  topic:    Topic;
  cards:    SerializedCard[];
}

export type ReadingApiResponse =
  | { ok: true;  id: string }
  | { ok: false; error: string };

// ─── Auth / Roles ─────────────────────────────────────────────

export type UserRole = "visitor" | "member" | "admin";

export interface AppUser {
  id:           string;
  email:        string;
  name:         string;
  role:         UserRole;
  dailyUsage:   number;
  totalUsage:   number;
  isActive:     boolean;
  createdAt:    string;
  lastActiveAt: string;
}

export interface RolePolicy {
  dailyLimit:     number;   // -1 = unlimited
  canSeeHistory:  boolean;
  canBuyReport:   boolean;
  showPaywall:    boolean;
}

export const ROLE_POLICY: Record<UserRole, RolePolicy> = {
  visitor: { dailyLimit: 1,  canSeeHistory: false, canBuyReport: false, showPaywall: true  },
  member:  { dailyLimit: 3,  canSeeHistory: true,  canBuyReport: true,  showPaywall: true  },
  admin:   { dailyLimit: -1, canSeeHistory: true,  canBuyReport: true,  showPaywall: false },
};
