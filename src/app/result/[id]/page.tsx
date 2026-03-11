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
import { getReading } from "@/lib/store";
import { getCurrentUser, getRolePolicy } from "@/lib/auth";
import { stripPaidContent } from "@/lib/reading/normalize";
import { TOPIC_LABELS } from "@/types/reading";
import ResultClientPage from "./ResultClientPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; plan?: string; planId?: string }>;
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
  const unlockDeep = fullByPolicy || (isPaidInDb && (paidPlan === "19" || paidPlan === "39" || paidPlan === "88"));
  const unlockTimeline = fullByPolicy || (isPaidInDb && (paidPlan === "39" || paidPlan === "88"));
  const unlockQa = fullByPolicy || (isPaidInDb && paidPlan === "88");
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

  return (
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
  );
}
