// =============================================================
// src/app/paywall/page.tsx
// Three-tier pricing page.
// Primary: HK$19 single unlock (most prominent)
// Secondary: HK$39 triple pack, HK$88 deep life version
// =============================================================
export const dynamic = "force-dynamic";
"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PRICING_TIERS, PRIMARY_TIER, type PricingTier } from "@/lib/pricing";
import CheckoutPlanButtons from "@/components/CheckoutPlanButtons";

// ─── Tier card ────────────────────────────────────────────────

function TierCard({
  tier,
}: {
  tier: PricingTier;
}) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5 transition-all"
      style={{
        border: tier.highlighted
          ? "2px solid rgba(200,160,40,0.55)"
          : "1.5px solid rgba(100,70,15,0.3)",
        background: tier.highlighted
          ? "linear-gradient(145deg,rgba(70,40,5,0.55) 0%,rgba(30,10,50,0.45) 100%)"
          : "rgba(13,5,24,0.55)",
        boxShadow: tier.highlighted
          ? "0 0 32px rgba(180,100,10,0.15), 0 8px 32px rgba(0,0,0,0.5)"
          : "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-amber-200 font-serif font-semibold text-lg">
              {tier.label}
            </span>
            {tier.badge && (
              <span
                className="text-xs font-serif px-2.5 py-0.5 rounded-full"
                style={{
                  background: tier.highlighted
                    ? "rgba(180,83,9,0.55)"
                    : "rgba(100,70,15,0.4)",
                  color: tier.highlighted ? "#fde68a" : "rgba(200,160,40,0.75)",
                  border: "1px solid " + (tier.highlighted ? "rgba(200,140,30,0.3)" : "rgba(100,70,15,0.3)"),
                }}
              >
                {tier.badge}
              </span>
            )}
          </div>
          <p className="text-amber-500/50 text-xs font-serif">{tier.tagline}</p>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0 ml-4">
          {tier.strikeStr && (
            <div className="text-amber-800/50 text-xs font-serif line-through mb-0.5">
              {tier.strikeStr}
            </div>
          )}
          <div
            className="font-serif font-bold"
            style={{
              fontSize:   tier.highlighted ? 28 : 22,
              color:      tier.highlighted ? "#fde68a" : "#d4b04a",
              lineHeight: 1,
            }}
          >
            {tier.priceStr}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        {tier.features.map((f) => (
          <div
            key={f}
            className="flex items-start gap-2.5 font-serif text-sm"
            style={{ color: tier.highlighted ? "rgba(253,230,138,0.8)" : "rgba(200,160,40,0.65)" }}
          >
            <span
              className="flex-shrink-0 mt-px"
              style={{ color: tier.highlighted ? "rgba(253,230,138,0.9)" : "rgba(180,130,30,0.65)" }}
            >
              ✦
            </span>
            {f}
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function PaywallPage() {
  const searchParams = useSearchParams();
  const readingId = searchParams.get("readingId") ?? "";

  // Primary tier first, then secondary
  const primary   = PRICING_TIERS.filter((t) =>  t.highlighted);
  const secondary = PRICING_TIERS.filter((t) => !t.highlighted);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #2e1565 0%, #1a0a2e 45%, #0d0518 100%)",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-amber-900/20">
        <Link href="/" className="text-amber-500 font-serif text-lg font-semibold">
          ✦ ArcanaPath
        </Link>
        <Link
          href="/reading"
          className="text-amber-700/50 hover:text-amber-500 text-sm font-serif transition-colors"
        >
          ← 返回占卜
        </Link>
      </nav>

      <div className="max-w-md mx-auto px-4 py-10 space-y-8">

        {/* Heading */}
        <div className="text-center space-y-3">
          <div className="text-4xl">🔮</div>
          <h1 className="text-amber-200 font-serif text-2xl font-semibold">
            你剛看到的，只是牌面的一部分
          </h1>
          <p className="text-amber-500/55 font-serif text-sm leading-relaxed">
            真正影響結果的訊號，其實藏在完整深度解讀裡。
          </p>
        </div>

        {/* What you get — teaser preview */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            border:     "1px solid rgba(100,70,15,0.3)",
            background: "rgba(13,5,24,0.4)",
          }}
        >
          <div className="text-amber-500/55 text-xs font-serif uppercase tracking-wider mb-3">
            解鎖後你會知道
          </div>
          {[
            "為什麼事情會走到現在這一步",
            "對方或局勢背後真正的動機",
            "未來 1-3 個月的走向",
            "你最容易忽略的一個關鍵訊號",
            "最應該採取的下一步行動",
            "塔羅師給你的核心提醒與延伸問答",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-amber-200/65 text-sm font-serif">
              <span className="text-amber-600/60 flex-shrink-0">✦</span>
              {item}
            </div>
          ))}
        </div>

        {/* Primary tier */}
        <div className="space-y-3">
          <div className="text-amber-600/40 text-xs font-serif uppercase tracking-wider text-center">
            現在解鎖完整答案
          </div>
          {primary.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-amber-900/25" />
          <span className="text-amber-800/40 text-xs font-serif">更多選擇</span>
          <div className="flex-1 h-px bg-amber-900/25" />
        </div>

        {/* Secondary tiers */}
        <div className="space-y-3">
          {secondary.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>

        <div className="rounded-xl border border-amber-700/30 bg-amber-950/25 p-4 space-y-3">
          <div className="text-amber-400/75 text-sm font-serif text-center">立即解鎖完整報告</div>
          <CheckoutPlanButtons readingId={readingId} />
          {!readingId && (
            <div className="text-amber-700/65 text-xs font-serif text-center">
              未提供 readingId，請由結果頁進入付款
            </div>
          )}
        </div>

        {/* Trust line */}
        <div className="text-center space-y-1.5 pb-4">
          <div className="flex items-center justify-center gap-4 text-amber-800/40 text-xs font-serif">
            <span>🔐 付款安全</span>
            <span>·</span>
            <span>⚡ 即時解鎖</span>
            <span>·</span>
            <span>💾 永久保存</span>
          </div>
          <div className="text-amber-900/35 text-xs font-serif">
            付款後立即解鎖，隨時可以重新查看
          </div>
        </div>

      </div>
    </div>
  );
}
