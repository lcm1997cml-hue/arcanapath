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
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { consumePremiumAccessForView, getReading } from "@/lib/store";
import { getCurrentUser, getRolePolicy } from "@/lib/auth";
import { stripPaidContent } from "@/lib/reading/normalize";
import { TOPIC_LABELS } from "@/types/reading";
import ResultClientPage from "./ResultClientPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; plan?: string; planId?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getReading(id);
  const q = (result?.question ?? "塔羅牌解讀").replace(/\s+/g, " ").trim().slice(0, 80);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://arcanapath.com").replace(/\/$/, "");
  return {
    title: `AI塔羅牌解讀｜${q}`,
    description: "免費三張牌塔羅占卜結果，包含塔羅牌解析與 AI 塔羅解讀。",
    alternates: {
      canonical: `${appUrl}/tarot-reading/${id}`,
    },
  };
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  // ── Fetch ──────────────────────────────────────────────────
  const rawResult = await getReading(id);
  if (!rawResult) notFound();

  // ── Auth / paywall ─────────────────────────────────────────
  const user     = await getCurrentUser();
  const policy   = getRolePolicy(user);
  const isPaidFlag = query?.paid === "1" || query?.paid === "true";
  const queryPlan = isPaidFlag ? (query?.plan ?? query?.planId) : undefined;
  const normalizedQueryPlan =
    queryPlan === "19" || queryPlan === "39" || queryPlan === "88"
      ? queryPlan
      : queryPlan === "starter"
      ? "19"
      : queryPlan === "insight"
      ? "39"
      : queryPlan === "master"
      ? "88"
      : undefined;

  const storedPlan = (rawResult as any)?.paidPlan as "19" | "39" | "88" | undefined;
  const isPaidInDb = !!rawResult.isPaid;
  const paidPlan = storedPlan;
  const isPaidQuery = !!normalizedQueryPlan && isPaidFlag;

  const fullByPolicy = !policy.showPaywall;
  let accountPremium = false;
  if (!fullByPolicy && !isPaidInDb) {
    const cookieStore = await cookies();
    const visitorId = cookieStore.get("arcana_visitor_id")?.value?.trim() ?? "";
    const restoredEmail = cookieStore.get("arcana_lead_email")?.value?.trim() ?? "";
    if (visitorId) {
      const consume = await consumePremiumAccessForView(visitorId, restoredEmail || undefined);
      accountPremium = consume.ok;
    }
  }
  const unlockDeep = fullByPolicy || accountPremium || (isPaidInDb && (paidPlan === "19" || paidPlan === "39" || paidPlan === "88"));
  const unlockTimeline = fullByPolicy || accountPremium || (isPaidInDb && (paidPlan === "39" || paidPlan === "88"));
  const unlockQa = fullByPolicy || accountPremium || (isPaidInDb && paidPlan === "88");
  const isUnlocked = fullByPolicy || (unlockDeep && unlockTimeline && unlockQa);

  const result = fullByPolicy
    ? rawResult
    : {
        ...stripPaidContent(rawResult as any),
        deepReading: unlockDeep ? rawResult.deepReading : null,
        timelineReport: unlockTimeline ? rawResult.timelineReport : null,
        qaBonus: unlockQa ? rawResult.qaBonus : [],
      };
  const topicLabel = TOPIC_LABELS[result.topic] ?? result.topic;
  const dateStr    = new Date(result.createdAt).toLocaleDateString("zh-HK", {
    year: "numeric", month: "long", day: "numeric",
  });
  const seoH1 = `AI塔羅牌解讀｜${result.question}`;
  const seoSummary = String(
    result.freeReading?.mainAxis ?? result.freeReading?.headline ?? result.freeReading?.nextStep ?? "免費三張牌塔羅占卜結果。"
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "AI塔羅牌解讀",
    description: "免費三張牌塔羅占卜結果",
    author: {
      "@type": "Organization",
      name: "ArcanaPath",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="sr-only">
        <h1>{seoH1}</h1>
        <h2>三張牌塔羅分析</h2>
        <p>{seoSummary}</p>
      </section>
      <ResultClientPage
        id={id}
        result={result as any}
        topicLabel={topicLabel}
        dateStr={dateStr}
        isPaidQuery={isPaidQuery}
        paidPlan={normalizedQueryPlan ?? paidPlan}
        isUnlocked={isUnlocked}
        userRole={user?.role}
        isLoggedIn={!!user}
      />
    </>
  );
}
