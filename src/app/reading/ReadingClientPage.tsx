"use client";

// =============================================================
// src/app/reading/page.tsx
// 4-phase flow: input → shuffle → fan-select → preview → submit
// Changes vs previous:
//  - Fan area is horizontally scrollable on mobile
//  - Selected card preview uses size="lg" (was "md")
//  - Phase layout is tighter / more centred
//  - Shuffle animation has more steps and better visual weight
// =============================================================

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Topic, DrawnCard } from "@/types/reading";
import { TOPIC_LABELS } from "@/types/reading";
import { deck, serializeDrawnCards } from "@/lib/tarot/utils";
import TarotCard from "@/components/TarotCard";
import ReadingFan from "@/components/ReadingFan";

// ─── Types ────────────────────────────────────────────────────

type Phase = "input" | "shuffle" | "select" | "preview" | "submitting";

const TOPICS: { value: Topic; label: string; icon: string; sub: string }[] = [
  { value: "love",   label: "感情", icon: "♥", sub: "關係・情感・連結" },
  { value: "career", label: "事業", icon: "◆", sub: "工作・方向・突破" },
  { value: "wealth", label: "財運", icon: "✦", sub: "金錢・機遇・資源" },
  { value: "life",   label: "人生", icon: "☽", sub: "方向・意義・成長" },
];

const FAN_COUNT  = 26;
const POSITIONS  = ["過去", "現在", "未來"];

// ─── Shuffle animation ────────────────────────────────────────

function ShuffleAnimation({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const TOTAL = 9;

  useEffect(() => {
    if (step >= TOTAL) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 280);
    return () => clearTimeout(t);
  }, [step, onDone, TOTAL]);

  const done = step >= TOTAL;

  return (
    <div className="flex flex-col items-center gap-10 py-8">
      <p className="text-amber-300/70 font-serif text-lg tracking-wide">
        {done ? "洗牌完成" : "正在洗牌，請保持專注…"}
      </p>

      {/* Card pile */}
      <div className="relative" style={{ width: 140, height: 110 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const offset  = i - 2.5;
          const rot     = offset * (step % 2 === 0 ? 10 : -8) + step * 3.5;
          const tx      = offset * 6 + (step % 3 === 0 ? offset * 2 : 0);
          const ty      = Math.abs(offset) * 1.5;
          return (
            <div
              key={i}
              className="absolute rounded-[5px]"
              style={{
                width: 54,
                height: 90,
                left: "50%",
                top: "50%",
                transformOrigin: "center 110%",
                transform: `translateX(calc(-50% + ${tx}px)) translateY(calc(-50% + ${ty}px)) rotate(${rot}deg)`,
                transition: "transform 0.22s ease",
                background: `radial-gradient(ellipse at 35% 30%, #2e1565 0%, #1a0a2e 100%)`,
                border: "1.5px solid rgba(130,90,25,0.55)",
                boxShadow: "0 3px 12px rgba(0,0,0,0.6)",
                zIndex: i,
              }}
            >
              <div className="absolute inset-[3px] border border-amber-700/25 rounded-[3px]" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='2' cy='2' r='0.6' fill='rgba(255,220,100,0.5)'/%3E%3Ccircle cx='8' cy='9' r='0.4' fill='rgba(255,220,100,0.35)'/%3E%3Ccircle cx='13' cy='5' r='0.5' fill='rgba(255,220,100,0.4)'/%3E%3C/svg%3E")`,
                  backgroundSize: "16px 16px",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 items-center">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width:  i < step ? 8 : 5,
              height: i < step ? 8 : 5,
              background: i < step
                ? "rgba(251,191,36,0.85)"
                : "rgba(100,70,20,0.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Selected cards preview ───────────────────────────────────

function SelectedPreview({
  cards,
  onConfirm,
  onReset,
  submitting,
  error,
}: {
  cards: DrawnCard[];
  onConfirm: () => void;
  onReset: () => void;
  submitting: boolean;
  error: string;
}) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="text-amber-300/80 font-serif text-lg">你選擇了三張牌</p>
        <p className="text-amber-600/45 font-serif text-xs mt-1">
          翻開後會顯示解讀
        </p>
      </div>

      {/* Cards — size lg, wider gap */}
      <div className="flex items-end gap-8 justify-center">
        {cards.map((dc, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="text-amber-500/55 text-xs font-serif tracking-widest uppercase">
              {POSITIONS[i]}
            </div>
            {/* Show face-down with the new starry back */}
            <TarotCard
              card={dc.card}
              faceDown
              selected
              size="lg"
              showLabel={false}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-800/45 bg-rose-950/25 px-4 py-2.5 text-rose-400 text-sm font-serif text-center max-w-xs">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="w-full bg-amber-700 hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-serif font-semibold py-4 rounded-xl transition-all text-lg"
          style={{ boxShadow: "0 4px 20px rgba(180,100,20,0.35)" }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin" style={{ animationDuration: "1.5s" }}>☽</span>
              解讀中…
            </span>
          ) : (
            "開始解讀 →"
          )}
        </button>
        <button
          onClick={onReset}
          disabled={submitting}
          className="text-amber-700/50 hover:text-amber-500 font-serif text-sm transition-colors"
        >
          重新選牌
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function ReadingClientPage() {
  const router = useRouter();
  const shareText = "我試咗個AI塔羅\n結果有啲恐怖😂\n你哋覺得準唔準？";

  const [phase,     setPhase]     = useState<Phase>("input");
  const [question,  setQuestion]  = useState("");
  const [topic,     setTopic]     = useState<Topic>("love");
  const [error,     setError]     = useState("");
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [toast, setToast] = useState("");
  const [unlockingShare, setUnlockingShare] = useState(false);
  const [remainingFreeHint, setRemainingFreeHint] = useState<number | null>(null);

  useEffect(() => {
    try {
      const savedRemaining = localStorage.getItem("arcana_remaining_free");
      if (savedRemaining !== null) {
        const parsed = Number(savedRemaining);
        if (!Number.isNaN(parsed)) setRemainingFreeHint(parsed);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fan state
  const [fanOrder, setFanOrder]   = useState<{ cardIndex: number; reversed: boolean }[]>([]);
  const [selected, setSelected]   = useState<number[]>([]);   // indices into fanOrder

  // Derived: DrawnCard[]
  const drawnCards: DrawnCard[] = selected.map((fi, pos) => {
    const entry = fanOrder[fi] ?? { cardIndex: 0, reversed: false };
    return {
      card:     deck[entry.cardIndex],
      position: POSITIONS[pos] ?? `第${pos + 1}張`,
      reversed: entry.reversed,
    };
  });

  // ── Start shuffle ──────────────────────────────────────────
  const startShuffle = useCallback(() => {
    if (question.trim().length < 3) {
      setError("請輸入至少3個字的問題");
      return;
    }
    setError("");
    setShowUnlockModal(false);
    // Fisher-Yates on deck indices
    const indices = Array.from({ length: deck.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setFanOrder(
      indices.slice(0, FAN_COUNT).map((ci) => ({
        cardIndex: ci,
        reversed:  Math.random() < 0.28,
      }))
    );
    setSelected([]);
    setPhase("shuffle");
  }, [question]);

  // ── Fan select ─────────────────────────────────────────────
  const handleFanSelect = useCallback((index: number) => {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 3) return prev;
      const next = [...prev, index];
      if (next.length === 3) setTimeout(() => setPhase("preview"), 380);
      return next;
    });
  }, []);

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (drawnCards.length !== 3) return;
    setPhase("submitting");
    setError("");
    try {
      const res = await fetch("/api/reading", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          question: question.trim(),
          topic,
          cards: serializeDrawnCards(drawnCards),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.unlockRequired) {
          setShowUnlockModal(true);
          setPhase("input");
        }
        if (typeof data.remainingFree === "number") {
          setRemainingFreeHint(data.remainingFree);
          try {
            localStorage.setItem("arcana_remaining_free", String(data.remainingFree));
          } catch {
            // ignore localStorage errors
          }
        }
        setError(data.error ?? "發生錯誤，請重試");
        if (!data.unlockRequired) setPhase("preview");
        return;
      }
      if (typeof data.remainingFree === "number") {
        setRemainingFreeHint(data.remainingFree);
        try {
          localStorage.setItem("arcana_remaining_free", String(data.remainingFree));
        } catch {
          // ignore localStorage errors
        }
      }
      const readingId = data?.id ?? data?.data?.id;
      if (!readingId) {
        setError("回傳資料格式錯誤，請重試");
        setPhase("preview");
        return;
      }
      router.push(`/result/${readingId}`);
    } catch {
      setError("網絡錯誤，請重試");
      setPhase("preview");
    }
  }, [drawnCards, question, topic, router]);

  const shareUrls = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent("我試咗個AI塔羅，結果有啲恐怖…")}&url=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.origin : ""
    )}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.origin : ""
    )}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      `我試咗個AI塔羅，結果有啲恐怖… ${typeof window !== "undefined" ? window.location.origin : ""}`
    )}`,
  };

  const drawShareImage = useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, "#0b0616");
    bg.addColorStop(0.5, "#1b0b2f");
    bg.addColorStop(1, "#07040f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "#f8d28c";
    ctx.font = "bold 72px serif";
    ctx.textAlign = "center";
    ctx.fillText("呢個結果有啲恐怖", 540, 260);

    const cardY = 540;
    const cardW = 220;
    const cardH = 360;
    const cardX = [190, 430, 670];
    cardX.forEach((x) => {
      ctx.fillStyle = "rgba(35, 18, 60, 0.95)";
      ctx.fillRect(x, cardY, cardW, cardH);
      ctx.strokeStyle = "rgba(248, 210, 140, 0.7)";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, cardY, cardW, cardH);
      ctx.fillStyle = "rgba(248, 210, 140, 0.75)";
      ctx.font = "56px serif";
      ctx.fillText("✦", x + cardW / 2, cardY + cardH / 2 + 18);
    });

    ctx.fillStyle = "#e5c994";
    ctx.font = "48px serif";
    ctx.fillText("你正在進入人生轉折點", 540, 1060);

    const domain = typeof window !== "undefined" ? window.location.origin.replace(/^https?:\/\//, "") : "ArcanaPath";
    ctx.fillStyle = "rgba(245, 210, 150, 0.9)";
    ctx.font = "36px serif";
    ctx.fillText(domain, 540, 1760);

    return canvas.toDataURL("image/png");
  }, []);

  const downloadShareImage = useCallback(() => {
    const dataUrl = drawShareImage();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "arcanapath-share.png";
    a.click();
  }, [drawShareImage]);

  const copyShareText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setToast("文案已複製");
    } catch {
      setToast("複製失敗，請手動複製");
    }
  }, [shareText]);

  const handleShareUnlock = useCallback(async () => {
    setUnlockingShare(true);
    try {
      const res = await fetch("/api/reading/unlock-share", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "解鎖失敗，請重試");
        return;
      }
      if (typeof data.remainingFree === "number") {
        setRemainingFreeHint(data.remainingFree);
        try {
          localStorage.setItem("arcana_remaining_free", String(data.remainingFree));
        } catch {
          // ignore localStorage errors
        }
      }
      setToast("🎉 已解鎖 +3 次占卜");
      setShowUnlockModal(false);

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "AI塔羅占卜",
            text: "我試咗個AI塔羅，結果有啲恐怖…",
            url: window.location.origin,
          });
        } catch {
          // user cancelled or unsupported payload
        }
      }
    } catch {
      setError("網絡錯誤，請重試");
    } finally {
      setUnlockingShare(false);
    }
  }, []);

  // ── Phase step indicator ───────────────────────────────────
  const phaseOrder: Phase[] = ["input", "shuffle", "select", "preview"];
  const stepIndex = phaseOrder.indexOf(phase as Phase);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(ellipse at 50% -10%, #2e1565 0%, #1a0a2e 45%, #0d0518 100%)",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-amber-900/20">
        <a href="/" className="text-amber-500 font-serif text-lg font-semibold tracking-wide">
          ✦ ArcanaPath
        </a>
        <a href="/login" className="text-amber-700/55 hover:text-amber-500 text-sm font-serif transition-colors">
          登入
        </a>
      </nav>

      {/* Title */}
      <div className="text-center pt-7 pb-3 px-4">
        <h1 className="text-xl font-serif text-amber-300 font-semibold tracking-wide">
          塔羅占卜
        </h1>
        {phase === "select" && (
          <p className="text-amber-500/50 text-xs font-serif mt-1">
            憑感覺，選出三張牌
          </p>
        )}
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 pb-5">
        {phaseOrder.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-400"
            style={{
              width:      i <= stepIndex ? 28 : 8,
              height:     6,
              background: i <= stepIndex
                ? "rgba(251,191,36,0.75)"
                : "rgba(100,70,20,0.3)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="pb-20">

        {/* ── INPUT ────────────────────────────────────────── */}
        {phase === "input" && (
          <div className="max-w-md mx-auto px-5 space-y-6">
            {/* Question */}
            <div className="space-y-2">
              <label className="text-amber-400 font-serif text-sm block">你的問題</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例：我同佢嘅關係仲有未來嗎？我係咪應該轉行？"
                rows={3}
                maxLength={200}
                className="w-full bg-black/25 border border-amber-800/45 rounded-xl px-4 py-3 text-amber-100 placeholder:text-amber-900/60 font-serif text-sm resize-none focus:outline-none focus:border-amber-600/65 transition-colors leading-relaxed"
              />
              <p className="text-amber-600/60 text-xs font-serif leading-relaxed">
                💡 問得越具體，結果會越準
                <br />
                例如：講清楚對象、時間或你在意的細節
              </p>
              {error && <p className="text-rose-400 text-xs font-serif">{error}</p>}
              <div className="text-right text-amber-900/45 text-xs font-serif">{question.length}/200</div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="text-amber-400 font-serif text-sm block">主題</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TOPICS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTopic(t.value)}
                    className="py-3 px-2 rounded-xl border text-center font-serif transition-all"
                    style={{
                      border: topic === t.value
                        ? "1.5px solid rgba(251,191,36,0.6)"
                        : "1.5px solid rgba(100,65,15,0.35)",
                      background: topic === t.value
                        ? "rgba(100,65,10,0.35)"
                        : "rgba(13,5,24,0.4)",
                      color: topic === t.value ? "#fde68a" : "rgba(180,130,40,0.6)",
                    }}
                  >
                    <div className="text-xl mb-0.5">{t.icon}</div>
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs mt-0.5 opacity-65">{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startShuffle}
              className="w-full bg-amber-700 hover:bg-amber-600 active:scale-[0.98] text-white font-serif font-semibold py-4 rounded-xl transition-all text-lg"
              style={{ boxShadow: "0 4px 20px rgba(180,100,20,0.3)" }}
            >
              開始洗牌 →
            </button>

            <p className="text-center text-amber-900/40 text-xs font-serif">
              訪客可先免費試用，次數用完可透過分享解鎖更多占卜
            </p>
            {remainingFreeHint !== null && (
              <p className="text-center text-amber-400/70 text-xs font-serif">
                剩餘免費次數：{remainingFreeHint}
              </p>
            )}
          </div>
        )}

        {/* ── SHUFFLE ──────────────────────────────────────── */}
        {phase === "shuffle" && (
          <div className="max-w-md mx-auto px-5">
            <ShuffleAnimation onDone={() => setPhase("select")} />
          </div>
        )}

        {/* ── SELECT ───────────────────────────────────────── */}
        {phase === "select" && (
          <div className="flex flex-col items-center gap-4">
            {/* Selection counter */}
            <div className="flex gap-3 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:      selected.length > i ? 32 : 20,
                    height:     10,
                    background: selected.length > i
                      ? "rgba(251,191,36,0.8)"
                      : "rgba(100,70,20,0.3)",
                  }}
                />
              ))}
              <span className="text-amber-500/55 font-serif text-xs ml-1">
                {selected.length}/3
              </span>
            </div>

            {/* Fan — allow horizontal scroll on very small screens */}
            <div
              className="w-full overflow-x-auto pt-6 pb-2"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <ReadingFan
                totalCards={FAN_COUNT}
                selectedIndices={selected}
                onSelect={handleFanSelect}
                maxSelect={3}
              />
            </div>

            <p className="text-amber-800/50 text-xs font-serif">
              點擊牌面選擇・再點取消
            </p>
          </div>
        )}

        {/* ── PREVIEW ──────────────────────────────────────── */}
        {phase === "preview" && drawnCards.length === 3 && (
          <div className="max-w-md mx-auto px-5">
            <SelectedPreview
              cards={drawnCards}
              onConfirm={handleSubmit}
              onReset={() => {
                setSelected([]);
                setPhase("select");
              }}
              submitting={false}
              error={error}
            />
          </div>
        )}

        {/* ── SUBMITTING ────────────────────────────────────── */}
        {phase === "submitting" && (
          <div className="flex flex-col items-center gap-6 py-20">
            <div
              className="text-6xl animate-spin"
              style={{ animationDuration: "2.2s" }}
            >
              ☽
            </div>
            <p className="text-amber-300/65 font-serif text-lg">塔羅正在解讀…</p>
            <p className="text-amber-700/40 text-sm font-serif">通常需要 10–20 秒</p>
          </div>
        )}
      </div>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-800/40 bg-[#120a22] p-5 space-y-4">
            <h3 className="text-amber-200 font-serif text-xl font-semibold">你已用完免費次數 🔮</h3>
            <p className="text-amber-400/80 text-sm font-serif">解鎖更多占卜方式：</p>

            <button
              onClick={handleShareUnlock}
              disabled={unlockingShare}
              className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-serif font-semibold py-3 rounded-xl transition-colors"
            >
              {unlockingShare ? "處理中…" : "分享你的結果 → +3 次占卜"}
            </button>

            <a
              href="/paywall"
              className="block w-full border border-amber-700/40 text-amber-300 text-center font-serif font-semibold py-3 rounded-xl hover:border-amber-600/60 transition-colors"
            >
              解鎖完整報告
            </a>

            <div className="border-t border-amber-900/40 pt-4 space-y-2">
              <p className="text-amber-500/70 text-xs font-serif">分享到社交平台</p>
              <div className="grid grid-cols-3 gap-2">
                <a href={shareUrls.x} target="_blank" rel="noreferrer" className="text-center text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">X</a>
                <a href={shareUrls.facebook} target="_blank" rel="noreferrer" className="text-center text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">Facebook</a>
                <a href={shareUrls.whatsapp} target="_blank" rel="noreferrer" className="text-center text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">WhatsApp</a>
              </div>
            </div>

            <div className="border-t border-amber-900/40 pt-4 space-y-2">
              <p className="text-amber-500/70 text-xs font-serif">Instagram / Threads</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={downloadShareImage} className="text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">下載分享圖片</button>
                <button onClick={copyShareText} className="text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">複製文案</button>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="text-center text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">開啟 Instagram</a>
                <a href="https://www.threads.net/" target="_blank" rel="noreferrer" className="text-center text-xs font-serif text-amber-200 border border-amber-800/40 rounded-lg py-2">開啟 Threads</a>
              </div>
            </div>

            <button
              onClick={() => setShowUnlockModal(false)}
              className="w-full text-amber-600/70 text-sm font-serif py-1"
            >
              稍後再說
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-amber-700 text-white text-sm font-serif px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
