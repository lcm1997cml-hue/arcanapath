"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReadingResult, UserRole } from "@/types/reading";
import ReadingSections from "@/components/ReadingSections";
import CheckoutPlanButtons from "@/components/CheckoutPlanButtons";

interface ResultClientPageProps {
  id: string;
  result: ReadingResult;
  topicLabel: string;
  dateStr: string;
  isPaidQuery: boolean;
  paidPlan?: string;
  isUnlocked: boolean;
  userRole?: UserRole;
  isLoggedIn: boolean;
}

export default function ResultClientPage({
  id,
  result,
  topicLabel,
  dateStr,
  isPaidQuery,
  paidPlan,
  isUnlocked,
  userRole,
  isLoggedIn,
}: ResultClientPageProps) {
  const router = useRouter();
  const [showShareTools, setShowShareTools] = useState(false);
  const [shareToast, setShareToast] = useState("");
  const [shareTriggered, setShareTriggered] = useState(false);

  const paidLabelMap: Record<string, string> = {
    "19": "基本完整解讀",
    "39": "深入分析",
    "88": "完整 AI 深度解讀",
    starter: "基本完整解讀",
    insight: "深入分析",
    master: "完整 AI 深度解讀",
  };

  const shareCopyText = "我試咗個AI塔羅\n結果有啲恐怖😂\n你哋覺得準唔準？";
  const shareOrigin = useMemo(() => {
    if (typeof window === "undefined") return process.env.NEXT_PUBLIC_APP_URL ?? "";
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  }, []);
  const shareUrl = useMemo(() => `${shareOrigin}/r/${id}`, [shareOrigin, id]);
  const shareSummary = useMemo(() => {
    const raw =
      result?.freeReading?.headline ??
      result?.freeReading?.nextStep ??
      result?.freeReading?.mainAxis ??
      "你正在進入人生轉折點";
    const cleaned = raw.replace(/\s+/g, " ").trim();
    return cleaned.slice(0, 20);
  }, [result]);
  const shareCards = useMemo(() => (Array.isArray(result?.cards) ? result.cards.slice(0, 3) : []), [result]);
  const platformUrls = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent("我啱啱做咗一次 AI 塔羅占卜")}&url=${encodeURIComponent(
        shareUrl
      )}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`我啱啱做咗一次 AI 塔羅占卜：${shareUrl}`)}`,
      instagram: "https://www.instagram.com/",
      threads: "https://www.threads.net/",
    }),
    [shareUrl]
  );
  const canWebShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleShareCompleted = useCallback(() => {
    if (shareTriggered) return;
    setShareTriggered(true);
    setShareToast("🎉 已解鎖 +3 次占卜");
    try {
      sessionStorage.setItem("arcana_post_share_message", "你已完成分享，快啲抽籤吧！");
    } catch {
      // ignore sessionStorage errors
    }

    void fetch("/api/reading/unlock-share", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.remainingFree === "number") {
          try {
            localStorage.setItem("arcana_remaining_free", String(data.remainingFree));
          } catch {
            // ignore localStorage errors
          }
        }
        if (data?.awarded === false) {
          setShareToast("今日已領取分享獎勵");
        }
      })
      .catch(() => {
        // Fire-and-forget; UX flow should still continue.
      });

    setTimeout(() => router.push("/reading?shared=1"), 1200);
  }, [router, shareTriggered]);

  const drawShareImage = useCallback(() => {
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
    ctx.font = "bold 52px serif";
    ctx.textAlign = "center";
    const questionText = (result?.question ?? "我的塔羅問題").slice(0, 44);
    ctx.fillText(`問題：${questionText}`, 540, 180);

    ctx.fillStyle = "rgba(245, 213, 160, 0.8)";
    ctx.font = "bold 62px serif";
    ctx.fillText("ArcanaPath 塔羅結果", 540, 280);

    const cardY = 500;
    const cardW = 250;
    const cardH = 380;
    const cardX = [120, 415, 710];
    const cardPos = ["過去", "現在", "未來"];
    cardX.forEach((x, idx) => {
      const card = shareCards[idx];
      ctx.fillStyle = "rgba(35, 18, 60, 0.95)";
      ctx.fillRect(x, cardY, cardW, cardH);
      ctx.strokeStyle = "rgba(248, 210, 140, 0.7)";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, cardY, cardW, cardH);

      ctx.fillStyle = "rgba(248, 210, 140, 0.95)";
      ctx.font = "bold 34px serif";
      ctx.fillText(cardPos[idx], x + cardW / 2, cardY - 20);

      ctx.fillStyle = "rgba(248, 210, 140, 0.75)";
      ctx.font = "56px serif";
      ctx.fillText("✦", x + cardW / 2, cardY + cardH / 2 + 18);

      ctx.fillStyle = "#f8d28c";
      ctx.font = "28px serif";
      const cardName = card?.card?.name_zh ?? "神秘牌";
      const orientation = card?.reversed ? "逆位" : "正位";
      ctx.fillText(cardName.slice(0, 8), x + cardW / 2, cardY + cardH + 42);
      ctx.fillStyle = "rgba(248, 210, 140, 0.75)";
      ctx.font = "24px serif";
      ctx.fillText(orientation, x + cardW / 2, cardY + cardH + 78);
    });

    ctx.fillStyle = "#e5c994";
    ctx.font = "42px serif";
    ctx.fillText(shareSummary || "你正在進入人生轉折點", 540, 1210);

    const domain = shareUrl.replace(/^https?:\/\//, "").replace(/\/r\/.+$/, "") || "ArcanaPath";
    ctx.fillStyle = "rgba(245, 210, 150, 0.9)";
    ctx.font = "36px serif";
    ctx.fillText(domain, 540, 1760);

    return canvas.toDataURL("image/png");
  }, [result, shareCards, shareSummary, shareUrl]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "AI塔羅占卜",
          text: "我試咗個AI塔羅，結果有啲恐怖…",
          url: shareUrl || undefined,
        })
        .catch(() => {
          // Ignore cancel; click already counts as share action in this UX.
        });
      handleShareCompleted();
      return;
    }
    window.open(platformUrls.x, "_blank", "noopener,noreferrer");
    handleShareCompleted();
  }, [handleShareCompleted, platformUrls.x, shareUrl]);

  const handlePlatformShare = useCallback(
    (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
      handleShareCompleted();
    },
    [handleShareCompleted]
  );

  const handleDownloadImage = useCallback(() => {
    const dataUrl = drawShareImage();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "arcanapath-result-share.png";
    a.click();
    handleShareCompleted();
  }, [drawShareImage, handleShareCompleted]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareCopyText);
      handleShareCompleted();
    } catch {
      setShareToast("複製失敗，請手動複製");
      setTimeout(() => setShareToast(""), 1600);
    }
  }, [handleShareCompleted]);

  const renderShareSection = useCallback(
    (title: string) => (
      <div className="mt-8 rounded-xl border border-amber-800/30 bg-amber-950/20 p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-amber-200 font-serif text-lg font-semibold">{title}</p>
          <p className="text-amber-500/70 text-xs font-serif">
            分享此結果即可獲得 +3 次占卜（每日一次）
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          disabled={shareTriggered}
          className="w-full bg-amber-700 hover:bg-amber-600 text-white font-serif font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {shareTriggered ? "已分享" : "分享結果"}
        </button>

        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handlePlatformShare(platformUrls.facebook)}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => handlePlatformShare(platformUrls.x)}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            X
          </button>
          <button
            type="button"
            onClick={() => handlePlatformShare(platformUrls.whatsapp)}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => handlePlatformShare(platformUrls.instagram)}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            Instagram
          </button>
          <button
            type="button"
            onClick={() => handlePlatformShare(platformUrls.threads)}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            Threads
          </button>
        </div>

        {(showShareTools || !canWebShare) && (
          <div className="grid grid-cols-2 gap-2 border-t border-amber-900/35 pt-4">
            <button
              type="button"
              onClick={handleDownloadImage}
              className="border border-amber-800/40 text-amber-200 font-serif text-sm py-2 rounded-lg"
            >
              下載分享圖片
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="border border-amber-800/40 text-amber-200 font-serif text-sm py-2 rounded-lg"
            >
              複製分享文案
            </button>
          </div>
        )}
      </div>
    ),
    [
      handleCopyText,
      handleDownloadImage,
      handlePlatformShare,
      handleShare,
      platformUrls.facebook,
      platformUrls.instagram,
      platformUrls.threads,
      platformUrls.whatsapp,
      platformUrls.x,
      canWebShare,
      showShareTools,
      shareTriggered,
    ]
  );

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
          {userRole === "admin" && (
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors">
              後台
            </Link>
          )}
          {isLoggedIn ? (
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

          {userRole === "admin" && (
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
              付款成功 · {paidLabelMap[paidPlan ?? ""]}
            </span>
          )}
        </div>
      </div>

      {/* ── Reading content ──────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <ReadingSections
          result={result as any}
          showPaywall={!isUnlocked}
          readingId={id}
          inlineShareSection={renderShareSection("分享你的結果 🔮")}
        />

        {isUnlocked && renderShareSection("睇完整份解讀後，想分享俾朋友睇？🔮")}
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
              isLoggedIn ? (
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

      {shareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-amber-700 text-white text-sm font-serif px-4 py-2 rounded-lg shadow-lg">
          {shareToast}
        </div>
      )}
    </div>
  );
}
