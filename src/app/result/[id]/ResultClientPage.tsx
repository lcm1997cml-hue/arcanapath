"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { ReadingResult, UserRole } from "@/types/reading";
import ReadingSections from "@/components/ReadingSections";
import CheckoutPlanButtons from "@/components/CheckoutPlanButtons";
import { buildShareImagePayloadFromReading, renderShareImageToDataUrlAsync } from "@/lib/shareImageCanvas";

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
  const [shareToast, setShareToast] = useState("");
  const [downloadBusy, setDownloadBusy] = useState(false);

  const paidLabelMap: Record<string, string> = {
    "19": "基本完整解讀",
    "39": "深入分析",
    "88": "完整 AI 深度解讀",
    starter: "基本完整解讀",
    insight: "深入分析",
    master: "完整 AI 深度解讀",
  };

  const shareOrigin = useMemo(() => {
    if (typeof window === "undefined") return process.env.NEXT_PUBLIC_APP_URL ?? "";
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  }, []);
  const shareUrl = useMemo(() => `${shareOrigin}/r/${id}`, [shareOrigin, id]);
  const brandDomain = useMemo(
    () => shareUrl.replace(/^https?:\/\//, "").split("/")[0] || "ArcanaPath",
    [shareUrl]
  );
  const shareCopyRich = useMemo(() => {
    const h = (result.freeReading?.headline ?? "").trim();
    return h ? `${h}\n${shareUrl}` : `ArcanaPath 塔羅 · 我的抽牌結果\n${shareUrl}`;
  }, [result, shareUrl]);
  const platformUrls = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCopyRich)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareCopyRich)}`,
      instagram: "https://www.instagram.com/",
      threads: "https://www.threads.net/",
    }),
    [shareUrl, shareCopyRich]
  );
  const notifyShared = useCallback(() => {
    setShareToast("已開啟分享");
    setTimeout(() => setShareToast(""), 2200);
  }, []);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "ArcanaPath 塔羅",
          text: shareCopyRich,
          url: shareUrl || undefined,
        })
        .catch(() => {});
      notifyShared();
      return;
    }
    window.open(platformUrls.x, "_blank", "noopener,noreferrer");
    notifyShared();
  }, [notifyShared, platformUrls.x, shareCopyRich, shareUrl]);

  const handlePlatformShare = useCallback(
    (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
      notifyShared();
    },
    [notifyShared]
  );

  const handleDownloadImage = useCallback(async () => {
    setDownloadBusy(true);
    try {
      const payload = buildShareImagePayloadFromReading(result, brandDomain);
      const dataUrl = await renderShareImageToDataUrlAsync(payload);
      if (!dataUrl) {
        setShareToast("無法產生圖片");
        setTimeout(() => setShareToast(""), 2200);
        return;
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "arcanapath-result-share.png";
      a.click();
      setShareToast("圖片已下載");
      setTimeout(() => setShareToast(""), 2200);
    } catch {
      setShareToast("下載失敗，請重試");
      setTimeout(() => setShareToast(""), 2200);
    } finally {
      setDownloadBusy(false);
    }
  }, [result, brandDomain]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast("連結已複製");
      setTimeout(() => setShareToast(""), 2200);
    } catch {
      setShareToast("複製失敗，請手動複製");
      setTimeout(() => setShareToast(""), 1600);
    }
  }, [shareUrl]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareCopyRich);
      setShareToast("文案已複製");
      setTimeout(() => setShareToast(""), 2200);
    } catch {
      setShareToast("複製失敗，請手動複製");
      setTimeout(() => setShareToast(""), 1600);
    }
  }, [shareCopyRich]);

  const renderShareSection = useCallback(
    (title: string) => (
      <div className="mt-8 rounded-xl border border-amber-800/30 bg-amber-950/20 p-5 space-y-4">
        <p className="text-amber-200 font-serif text-lg font-semibold">{title}</p>

        <button
          type="button"
          onClick={handleShare}
          className="w-full bg-amber-700 hover:bg-amber-600 text-white font-serif font-semibold py-3 rounded-xl transition-colors"
        >
          分享結果
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

        <div className="grid grid-cols-3 gap-2 border-t border-amber-900/35 pt-4">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            複製連結
          </button>
          <button
            type="button"
            onClick={() => void handleCopyText()}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg"
          >
            複製文案
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadImage()}
            disabled={downloadBusy}
            className="border border-amber-800/40 text-amber-200 font-serif text-xs py-2 rounded-lg disabled:opacity-50"
          >
            {downloadBusy ? "產生中…" : "下載結果圖片"}
          </button>
        </div>
      </div>
    ),
    [
      handleCopyLink,
      handleCopyText,
      downloadBusy,
      handleDownloadImage,
      handlePlatformShare,
      handleShare,
      platformUrls.facebook,
      platformUrls.instagram,
      platformUrls.threads,
      platformUrls.whatsapp,
      platformUrls.x,
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
