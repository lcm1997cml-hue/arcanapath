// =============================================================
// src/app/result/[id]/page.tsx
// Server component. Reads result, checks role/paywall,
// strips paid content if needed, renders ReadingSections.
//
// Changes:
//  - Sticky bottom bar shows "立即解鎖 HK$19" for non-unlocked users
//  - Admin / paid users see normal bottom nav instead
// =============================================================

import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getReading } from "@/lib/store";
import { getCurrentUser, getRolePolicy } from "@/lib/auth";
import { stripPaidContent } from "@/lib/reading/normalize";
import { TOPIC_LABELS } from "@/types/reading";
import ReadingSections from "@/components/ReadingSections";
import CheckoutPlanButtons from "@/components/CheckoutPlanButtons";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; plan?: string; planId?: string }>;
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  // ── Fetch ──────────────────────────────────────────────────
  const rawResult = getReading(id);
  if (!rawResult) notFound();

  // ── Auth / paywall ─────────────────────────────────────────
  const user     = await getCurrentUser();
  const policy   = getRolePolicy(user);
  const isPaidFlag = query?.paid === "1" || query?.paid === "true";
  const paidPlan = isPaidFlag ? (query?.plan ?? query?.planId) : undefined;
  const isPaidQuery =
    isPaidFlag &&
    (paidPlan === "19" || paidPlan === "39" || paidPlan === "88" || paidPlan === "starter" || paidPlan === "insight" || paidPlan === "master");
  const isUnlocked = !policy.showPaywall || rawResult.isPaid || isPaidQuery;
  const result   = isUnlocked ? rawResult : stripPaidContent(rawResult as any);
  const paidLabelMap: Record<string, string> = {
    "19": "基本完整解讀",
    "39": "深入分析",
    "88": "完整 AI 深度解讀",
    starter: "基本完整解讀",
    insight: "深入分析",
    master: "完整 AI 深度解讀",
  };

  const topicLabel = TOPIC_LABELS[result.topic] ?? result.topic;
  const dateStr    = new Date(result.createdAt).toLocaleDateString("zh-HK", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div
      className="min-h-screen text-white pb-24"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #2e1565 0%, #1a0a2e 40%, #0d0518 100%)",
      }}
    >
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-amber-900/20">
        <Link href="/" className="text-amber-500 font-serif text-lg font-semibold tracking-wide">
          ✦ ArcanaPath
        </Link>
        <div className="flex items-center gap-4 text-sm font-serif">
          {user?.role === "admin" && (
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors">
              後台
            </Link>
          )}
          {user ? (
            <Link href="/dashboard" className="text-amber-600/55 hover:text-amber-500 transition-colors">
              我的記錄
            </Link>
          ) : (
            <Link href="/login" className="text-amber-700/50 hover:text-amber-500 transition-colors">
              登入
            </Link>
          )}
        </div>
      </nav>

      {/* ── Page header ──────────────────────────────────── */}
      <div className="text-center pt-8 pb-3 px-6">
        {/* Topic badge */}
        <div className="inline-block text-amber-600/50 font-serif text-xs uppercase tracking-widest mb-3 border border-amber-900/35 rounded-full px-3 py-1">
          {topicLabel}
        </div>

        {/* Question */}
        <h1 className="text-amber-100 font-serif text-lg sm:text-xl font-semibold max-w-xl mx-auto leading-relaxed">
          「{result.question}」
        </h1>

        {/* Meta row */}
        <div className="flex items-center justify-center gap-3 mt-2.5 flex-wrap">
          <span className="text-amber-800/40 text-xs font-serif">{dateStr}</span>

          {user?.role === "admin" && (
            <span className="bg-amber-900/45 border border-amber-700/35 text-amber-400 text-xs font-serif px-2 py-0.5 rounded-full">
              Admin · 完整報告
            </span>
          )}
          {result.isPaid && (
            <span className="bg-amber-800/35 border border-amber-700/35 text-amber-300 text-xs font-serif px-2 py-0.5 rounded-full">
              已解鎖完整版
            </span>
          )}
          {isPaidQuery && (
            <span className="bg-emerald-900/35 border border-emerald-700/35 text-emerald-300 text-xs font-serif px-2 py-0.5 rounded-full">
              付款成功 · {paidLabelMap[paidPlan]}
            </span>
          )}
        </div>
      </div>

      {/* ── Reading content ──────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <ReadingSections result={result as any} showPaywall={!isUnlocked} readingId={id} />
      </div>

      {/* ── Sticky bottom bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div
          className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3"
          style={{
            borderTop:  "1px solid rgba(100,70,15,0.25)",
            background: "rgba(6,2,15,0.88)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Left: back link */}
          <Link
            href="/reading"
            className="text-amber-700/55 hover:text-amber-500 font-serif text-sm transition-colors flex-shrink-0"
          >
            ← 再問一次
          </Link>

          {/* Centre / Right: unlock CTA or nav */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {isUnlocked ? (
              /* Already unlocked — show history link */
              user ? (
                <Link
                  href="/dashboard"
                  className="text-amber-600/55 hover:text-amber-400 font-serif text-sm transition-colors"
                >
                  查看歷史 →
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="text-amber-500/65 hover:text-amber-400 font-serif text-sm transition-colors"
                >
                  免費註冊 →
                </Link>
              )
            ) : (
              /* Not yet unlocked — 3 Stripe checkout plans */
              <>
                <CheckoutPlanButtons readingId={id} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
