// ============================================================
// ArcanaPath – Core TypeScript Schema
// src/types/index.ts
// ============================================================

// ─── Tarot Card ───────────────────────────────────────────────
export interface TarotCardData {
  id: number;
  name: string;
  name_zh: string;
  arcana: "major" | "minor";
  suit?: string;
  number: number;
  image: string; // e.g. "RWS1909_-_00_Fool.jpeg"
  keywords: string[];
  keywords_reversed: string[];
  meaning_upright: string;
  meaning_reversed: string;
  description: string;
}

export interface DrawnCard {
  card: TarotCardData;
  position: "past" | "present" | "future" | string;
  reversed: boolean;
}

// ─── Reading ──────────────────────────────────────────────────
export type Topic = "love" | "career" | "wealth" | "life";

export interface ReadingRequest {
  question: string;
  topic: Topic;
  cards: DrawnCard[];
  userId?: string;
}

export interface FreeReading {
  headline: string;        // 一句直接結論
  mainAxis: string;        // 整體主軸 (2-3 句)
  cardReadings: {          // 三張牌逐張短解
    position: string;
    cardName: string;
    interpretation: string;
  }[];
  wakeUpLine: string;      // 屌醒位
  nextStep: string;        // 下一步建議
}

export interface DeepReading {
  psychologicalBreakdown: string;   // 心理拆解
  hiddenTruth: string;              // 對方內心 / 局勢真相
  actionAdvice: string;             // 行動建議
  hardQuestion: string;             // 最唔想面對但最應該面對
}

export interface TimelineReport {
  shortTerm: string;   // 1-4 週
  midTerm: string;     // 1-3 個月
  longTerm: string;    // 3 個月以上
}

export interface QaBonus {
  question: string;
  answer: string;
}

export interface ReadingResult {
  id: string;
  createdAt: string;
  question: string;
  topic: Topic;
  cards: DrawnCard[];
  freeReading: FreeReading;
  deepReading?: DeepReading;       // 付費解鎖
  timelineReport?: TimelineReport; // 付費解鎖
  qaBonus?: QaBonus[];             // 付費解鎖
  isPaid: boolean;
  userId?: string;
}

// ─── User / Auth ──────────────────────────────────────────────
export type UserRole = "visitor" | "member" | "admin";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  dailyUsage: number;        // today's reading count
  totalUsage: number;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface UsageLimit {
  daily: number;       // -1 = unlimited
  canSeeHistory: boolean;
  canBuyReport: boolean;
  showPaywall: boolean;
}

export const ROLE_LIMITS: Record<UserRole, UsageLimit> = {
  visitor: {
    daily: 1,
    canSeeHistory: false,
    canBuyReport: false,
    showPaywall: true,
  },
  member: {
    daily: 3,
    canSeeHistory: true,
    canBuyReport: true,
    showPaywall: true,
  },
  admin: {
    daily: -1,
    canSeeHistory: true,
    canBuyReport: true,
    showPaywall: false,
  },
};

// ─── Admin ────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  dailyUsage: number;
  totalUsage: number;
  createdAt: string;
  lastActiveAt: string;
  paidCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalReadings: number;
  totalRevenue: number;
  activeToday: number;
}

// ─── API Response wrappers ────────────────────────────────────
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
