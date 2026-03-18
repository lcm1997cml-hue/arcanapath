// =============================================================
// src/components/ReadingSections.tsx
//
// Renders free reading + locked paid preview + paywall CTA.
// Changes from previous version:
//  - 「屌醒位」section completely removed
//    (that tone is now embedded in headline/mainAxis/cards/nextStep)
//  - PaywallCTA primary CTA is HK$19 (single unlock)
//  - Secondary upsell row shows HK$39 and HK$88 tiers
//  - wakeUpLine is no longer read from freeReading schema
//  - All rendering remains fully defensive (no field can crash)
// =============================================================
"use client";

import React, { useState } from "react";
import type { ReadingResult, DrawnCard } from "@/types/reading";
import TarotCard from "./TarotCard";
import { PRICING_TIERS, PRIMARY_TIER } from "@/lib/pricing";

// ─── Safe string accessor ─────────────────────────────────────

function s(v: unknown, fb = ""): string {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  if (Array.isArray(v)) return v.map(String).join("；");
  return fb;
}

// ─── Layout atoms ─────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-amber-900/25" />
      <div className="text-amber-800/35 text-xs">✦</div>
      <div className="flex-1 h-px bg-amber-900/25" />
    </div>
  );
}

function SectionBox({
  title, icon, children, accent = false,
}: {
  title: string; icon?: string; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-5 space-y-3",
        accent
          ? "border-amber-600/30 bg-gradient-to-br from-amber-950/40 to-amber-900/15"
          : "border-amber-900/30 bg-amber-950/20",
      ].join(" ")}
    >
      <h3 className="text-amber-400 font-serif font-semibold flex items-center gap-2 text-base">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Card reveal row ──────────────────────────────────────────

function CardRevealRow({ cards }: { cards: DrawnCard[] }) {
  const [revealed, setRevealed] = useState<boolean[]>(cards.map(() => false));
  if (!cards.length) return null;

  return (
    <div className="flex items-end justify-center gap-5 py-2">
      {cards.map((dc, i) => {
        const isRevealed = revealed[i] ?? false;
        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="text-amber-500/55 text-xs font-serif tracking-wider">
              {dc.position}
            </div>
            <TarotCard
              card={dc.card}
              reversed={dc.reversed}
              faceDown={!isRevealed}
              revealed={isRevealed}
              size="lg"
              showLabel={isRevealed}
              glowOnHover={!isRevealed}
              onClick={
                !isRevealed
                  ? () => setRevealed((prev) => {
                      const n = [...prev]; n[i] = true; return n;
                    })
                  : undefined
              }
            />
            {!isRevealed && (
              <div className="text-amber-700/45 text-xs font-serif animate-pulse">
                點擊翻開
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Locked blurred section ───────────────────────────────────

function LockedSection({ title, lines = 4 }: { title: string; lines?: number }) {
  return (
    <div className="rounded-xl border border-amber-900/25 bg-amber-950/10 p-5 relative overflow-hidden">
      <div className="space-y-2 filter blur-[3px] pointer-events-none select-none" aria-hidden>
        <div className="h-4 bg-amber-900/25 rounded w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-3 bg-amber-900/15 rounded ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-amber-950/65 backdrop-blur-[1px]">
        <div className="text-2xl">🔒</div>
        <div className="text-amber-300/80 font-serif text-sm font-medium">{title}</div>
      </div>
    </div>
  );
}

// ─── Paywall CTA — HK$19 primary, secondary upsell ───────────

function PaywallCTA({ readingId }: { readingId?: string }) {
  const primary    = PRIMARY_TIER;
  const secondary  = PRICING_TIERS.filter((t) => !t.highlighted);

  return (
    <div className="space-y-3">

      {/* ── Primary CTA block ─────────────────────────────── */}
      <div
        className="rounded-xl p-6 text-center space-y-4"
        style={{
          border:     "1.5px solid rgba(200,160,40,0.4)",
          background: "linear-gradient(145deg, rgba(60,35,5,0.5) 0%, rgba(30,10,50,0.4) 100%)",
        }}
      >
        {/* Star ornament */}
        <div className="text-amber-500/60 text-2xl">✦</div>

        <div>
          <div className="text-amber-200 font-serif text-xl font-semibold">
            解鎖完整深度報告
          </div>
          <div className="text-amber-400/55 text-xs font-serif mt-1 leading-relaxed">
            心理拆解・局勢真相・時間線・行動建議・核心問題
          </div>
        </div>

        {/* Feature 2-col grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-left max-w-xs mx-auto">
          {primary.features.map((f) => (
            <div key={f} className="flex items-start gap-1.5 text-amber-200/65 text-xs font-serif">
              <span className="text-amber-500 flex-shrink-0 mt-px">✓</span>
              {f}
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="space-y-2.5 pt-1">
          <a
            href={readingId ? `/paywall?readingId=${encodeURIComponent(readingId)}` : "/paywall"}
            className="block text-white font-serif font-bold py-4 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
            style={{
              background:  "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
              boxShadow:   "0 4px 20px rgba(180,83,9,0.4), inset 0 1px 0 rgba(255,200,100,0.15)",
            }}
          >
            {primary.cta}
          </a>
          <a
            href="/register"
            className="block border border-amber-800/40 text-amber-500/65 hover:border-amber-700/60 hover:text-amber-400 font-serif text-sm py-2.5 px-6 rounded-lg transition-colors"
          >
            免費註冊 → 每日 3 次抽牌
          </a>
        </div>

        <p className="text-amber-800/35 text-xs font-serif">
          一次性付款 · 永久保存 · 可隨時查看
        </p>
      </div>

      {/* ── Secondary upsell row ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {secondary.map((tier) => (
          <a
            key={tier.id}
            href={readingId ? `/paywall?readingId=${encodeURIComponent(readingId)}` : "/paywall"}
            className="rounded-xl border border-amber-900/30 bg-amber-950/15 hover:border-amber-800/50 hover:bg-amber-950/30 p-3.5 text-center space-y-1.5 transition-all block"
          >
            {tier.badge && (
              <div className="text-amber-600/55 text-xs font-serif">{tier.badge}</div>
            )}
            <div className="text-amber-200/80 font-serif font-semibold text-sm">{tier.label}</div>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-amber-300 font-serif font-bold text-base">{tier.priceStr}</span>
              {tier.strikeStr && (
                <span className="text-amber-800/50 text-xs font-serif line-through">{tier.strikeStr}</span>
              )}
            </div>
            <div className="text-amber-600/45 text-xs font-serif leading-tight">{tier.tagline}</div>
          </a>
        ))}
      </div>

    </div>
  );
}

// ─── PricingCards — for standalone use (e.g. /paywall) ───────

export function PricingCards() {
  return (
    <div className="space-y-3">
      {PRICING_TIERS.map((tier) => (
        <div
          key={tier.id}
          className="rounded-xl p-5 space-y-3"
          style={{
            border:     tier.highlighted
              ? "1.5px solid rgba(200,160,40,0.45)"
              : "1.5px solid rgba(100,70,15,0.3)",
            background: tier.highlighted
              ? "linear-gradient(145deg,rgba(60,35,5,0.45) 0%,rgba(30,10,50,0.35) 100%)"
              : "rgba(13,5,24,0.4)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-200 font-serif font-semibold">{tier.label}</span>
                {tier.badge && (
                  <span
                    className="text-xs font-serif px-2 py-0.5 rounded-full"
                    style={{
                      background: tier.highlighted ? "rgba(180,83,9,0.5)" : "rgba(100,70,15,0.35)",
                      color:      tier.highlighted ? "#fde68a" : "rgba(200,160,40,0.7)",
                    }}
                  >
                    {tier.badge}
                  </span>
                )}
              </div>
              <div className="text-amber-500/50 text-xs font-serif mt-0.5">{tier.tagline}</div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-amber-200 font-serif font-bold text-xl">{tier.priceStr}</div>
              {tier.strikeStr && (
                <div className="text-amber-800/50 text-xs font-serif line-through">{tier.strikeStr}</div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            {tier.features.map((f) => (
              <div key={f} className="flex items-start gap-2 text-amber-200/65 text-sm font-serif">
                <span className="text-amber-500/70 flex-shrink-0 mt-px">✦</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ReadingSections ─────────────────────────────────────

interface ReadingSectionsProps {
  result:      ReadingResult | null | undefined;
  showPaywall?: boolean;
  readingId?: string;
  inlineShareSection?: React.ReactNode;
}

export default function ReadingSections({
  result,
  showPaywall = true,
  readingId,
  inlineShareSection,
}: ReadingSectionsProps) {

  // ── Guard: null result ────────────────────────────────────
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-amber-600/35 text-5xl animate-pulse">☽</div>
        <div className="text-amber-500/45 font-serif">正在載入解讀…</div>
      </div>
    );
  }

  const { freeReading, deepReading, timelineReport, qaBonus, cards = [] } = result;

  // ── Guard: freeReading missing ────────────────────────────
  if (!freeReading) {
    return (
      <div className="rounded-xl border border-rose-900/35 bg-rose-950/15 p-6 text-center">
        <div className="text-rose-400 font-serif">解讀資料載入失敗，請返回重新占卜。</div>
        <a href="/reading" className="inline-block mt-3 text-amber-400 text-sm font-serif hover:text-amber-300">
          ← 重新占卜
        </a>
      </div>
    );
  }

  // ── Safe field reads ──────────────────────────────────────
  const headline     = s(freeReading.headline,  "牌面已揭示");
  const mainAxis     = s(freeReading.mainAxis,   "請見下方各牌詳細解讀。");
  const nextStep     = s(freeReading.nextStep,   "靜下來，誠實面對你真正想要的結果。");
  const cardReadings = Array.isArray(freeReading.cardReadings) ? freeReading.cardReadings : [];

  const hasDeep     = deepReading     != null;
  const hasTimeline = timelineReport  != null;
  const hasQa       = Array.isArray(qaBonus) && qaBonus.length > 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── Card reveal ─────────────────────────────────────── */}
      <SectionBox title="你的牌陣" icon="🃏" accent>
        <CardRevealRow cards={cards} />
        <p className="text-amber-700/35 text-center text-xs font-serif">
          點擊每張牌翻開 · 三張代表過去、現在、未來
        </p>
      </SectionBox>

      {/* ── Headline ─────────────────────────────────────────── */}
      <div
        className="rounded-xl px-6 py-5 text-center"
        style={{
          border:     "1.5px solid rgba(180,130,30,0.3)",
          background: "linear-gradient(145deg,rgba(40,20,5,0.5) 0%,rgba(20,5,35,0.4) 100%)",
        }}
      >
        <div className="text-amber-600/45 text-xs font-serif uppercase tracking-widest mb-2">
          牌面所說
        </div>
        <div className="text-amber-100 font-serif text-lg sm:text-xl leading-relaxed font-semibold">
          「{headline}」
        </div>
      </div>

      {/* ── Main Axis ────────────────────────────────────────── */}
      <SectionBox title="整體解讀" icon="◈">
        <p className="text-amber-100/80 font-serif text-sm leading-[1.9] whitespace-pre-line">
          {mainAxis}
        </p>
      </SectionBox>

      {/* ── Per-card readings ──────────────────────────────── */}
      <SectionBox title="三牌詳解" icon="✦">
        <div className="space-y-5">
          {cardReadings.length > 0
            ? cardReadings.map((cr, i) => (
                <div key={i} className="border-l-2 border-amber-800/45 pl-4 space-y-1.5">
                  <div className="text-amber-400 font-serif font-medium text-sm">
                    {s(cr?.position, `第${i + 1}張`)}
                    {s(cr?.cardName) ? ` ─ ${s(cr.cardName)}` : ""}
                  </div>
                  <p className="text-amber-100/75 font-serif text-sm leading-[1.85]">
                    {s(cr?.interpretation, "解讀暫時未能載入。")}
                  </p>
                </div>
              ))
            : cards.map((dc, i) => (
                <div key={i} className="border-l-2 border-amber-800/45 pl-4 space-y-1.5">
                  <div className="text-amber-400 font-serif font-medium text-sm">
                    {dc.position} ─ {dc.card.name_zh}
                    {dc.reversed && (
                      <span className="text-rose-400/65 ml-1.5 text-xs">逆位</span>
                    )}
                  </div>
                  <p className="text-amber-100/75 font-serif text-sm leading-[1.85]">
                    {dc.reversed ? dc.card.meaning_reversed : dc.card.meaning_upright}
                  </p>
                </div>
              ))}
        </div>
      </SectionBox>

      {/* ── Next step ────────────────────────────────────────── */}
      <SectionBox title="下一步" icon="→">
        <p className="text-amber-100/80 font-serif text-sm leading-[1.9]">
          {nextStep}
        </p>
      </SectionBox>

      {inlineShareSection}

      <Divider />

      {/* ── Deep reading (unlocked) or blurred preview ─────── */}
      {hasDeep ? (
        <SectionBox title="深度心理解讀" icon="🔮" accent>
          <div className="space-y-5">
            {s(deepReading!.psychologicalBreakdown) && (
              <div className="space-y-1.5">
                <div className="text-amber-500/55 text-xs font-serif uppercase tracking-wider">
                  心理分析
                </div>
                <p className="text-amber-100/80 font-serif text-sm leading-[1.9]">
                  {s(deepReading!.psychologicalBreakdown)}
                </p>
              </div>
            )}
            {s(deepReading!.hiddenTruth) && (
              <div className="space-y-1.5">
                <div className="text-amber-500/55 text-xs font-serif uppercase tracking-wider">
                  局勢真相
                </div>
                <p className="text-amber-100/80 font-serif text-sm leading-[1.9]">
                  {s(deepReading!.hiddenTruth)}
                </p>
              </div>
            )}
            {s(deepReading!.actionAdvice) && (
              <div className="space-y-1.5">
                <div className="text-amber-500/55 text-xs font-serif uppercase tracking-wider">
                  行動建議
                </div>
                <p className="text-amber-100/80 font-serif text-sm leading-[1.9] whitespace-pre-line">
                  {s(deepReading!.actionAdvice)}
                </p>
              </div>
            )}
            {s(deepReading!.hardQuestion) && (
              <div
                className="rounded-lg p-4 mt-1"
                style={{
                  border:     "1px solid rgba(180,130,30,0.3)",
                  background: "rgba(60,35,5,0.25)",
                }}
              >
                <div className="text-amber-500/55 text-xs font-serif uppercase tracking-wider mb-1.5">
                  最應該面對的問題
                </div>
                <p className="text-amber-200 font-serif italic text-sm leading-relaxed">
                  「{s(deepReading!.hardQuestion)}」
                </p>
              </div>
            )}
          </div>
        </SectionBox>
      ) : showPaywall ? (
        <LockedSection title="深度心理解讀" lines={5} />
      ) : null}

      {/* ── Timeline (unlocked) or blurred ─────────────────── */}
      {hasTimeline ? (
        <SectionBox title="時間線預測" icon="◷">
          <div className="space-y-3">
            {(
              [
                { label: "短期 1-4週",    value: s(timelineReport!.shortTerm) },
                { label: "中期 1-3個月",  value: s(timelineReport!.midTerm)   },
                { label: "長期 3個月以上", value: s(timelineReport!.longTerm)  },
              ] as const
            ).map(({ label, value }) =>
              value ? (
                <div
                  key={label}
                  className="rounded-lg p-3 space-y-1"
                  style={{
                    border:     "1px solid rgba(100,70,15,0.3)",
                    background: "rgba(13,5,24,0.35)",
                  }}
                >
                  <div className="text-amber-500/60 text-xs font-serif">{label}</div>
                  <p className="text-amber-100/75 font-serif text-sm leading-[1.85]">{value}</p>
                </div>
              ) : null
            )}
          </div>
        </SectionBox>
      ) : showPaywall ? (
        <LockedSection title="時間線預測" lines={3} />
      ) : null}

      {/* ── Q&A Bonus ─────────────────────────────────────── */}
      {hasQa ? (
        <SectionBox title="延伸問答" icon="💬">
          <div className="space-y-4">
            {qaBonus!.map((qa, i) => (
              <div
                key={i}
                className="rounded-lg p-4 space-y-2"
                style={{
                  border:     "1px solid rgba(100,70,15,0.25)",
                  background: "rgba(13,5,24,0.3)",
                }}
              >
                <div className="text-amber-400 font-serif text-sm font-medium">
                  Q：{s(qa?.question)}
                </div>
                <p className="text-amber-100/70 font-serif text-sm leading-[1.85]">
                  {s(qa?.answer)}
                </p>
              </div>
            ))}
          </div>
        </SectionBox>
      ) : showPaywall ? (
        <LockedSection title="延伸問答" lines={3} />
      ) : null}

      {/* ── Paywall CTA ─────────────────────────────────────── */}
      {showPaywall && (!hasDeep || !hasTimeline || !hasQa) && <PaywallCTA readingId={readingId} />}

    </div>
  );
}
