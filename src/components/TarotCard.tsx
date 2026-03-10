// =============================================================
// src/components/TarotCard.tsx
// Tarot card component.
// Card back: deep night sky + scattered stars + gold foil border.
// Card front: real RWS image or text fallback.
// Supports: faceDown, revealed, reversed, selected, sizes.
// =============================================================
"use client";

import React, { useState, useCallback } from "react";
import type { TarotCardData } from "@/types/reading";
import { getCardImagePath } from "@/lib/tarot/utils";

// ─── Size map ─────────────────────────────────────────────────

const SIZES = {
  xs: { w: 48,  h: 80,  title: 8,  symbol: 14 },
  sm: { w: 64,  h: 108, title: 10, symbol: 18 },
  md: { w: 88,  h: 148, title: 11, symbol: 22 },
  lg: { w: 120, h: 200, title: 13, symbol: 28 },
  xl: { w: 160, h: 268, title: 15, symbol: 36 },
} as const;

export type CardSize = keyof typeof SIZES;
type S = (typeof SIZES)[CardSize];

export interface TarotCardProps {
  card?: TarotCardData | null;
  reversed?: boolean;
  faceDown?: boolean;
  revealed?: boolean;
  selected?: boolean;
  size?: CardSize;
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
  glowOnHover?: boolean;
}

// ─── Starry night card back ───────────────────────────────────
// Rendered entirely in CSS/SVG — no external image needed.

function CardBack({ s }: { s: S }) {
  // We generate a deterministic-looking star field using a repeating SVG pattern.
  // Multiple layers at different scales give a sense of depth.
  const starPatternSm = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='3' cy='4' r='0.55' fill='rgba(255,240,180,0.55)'/%3E%3Ccircle cx='14' cy='2' r='0.4' fill='rgba(255,240,180,0.4)'/%3E%3Ccircle cx='20' cy='10' r='0.6' fill='rgba(255,240,180,0.5)'/%3E%3Ccircle cx='7' cy='18' r='0.45' fill='rgba(255,240,180,0.45)'/%3E%3Ccircle cx='18' cy='20' r='0.35' fill='rgba(255,240,180,0.35)'/%3E%3Ccircle cx='11' cy='13' r='0.5' fill='rgba(255,240,180,0.3)'/%3E%3C/svg%3E")`;

  const starPatternLg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='5' cy='8' r='0.9' fill='rgba(255,240,180,0.65)'/%3E%3Ccircle cx='22' cy='3' r='0.7' fill='rgba(255,240,180,0.5)'/%3E%3Ccircle cx='35' cy='18' r='1.0' fill='rgba(255,240,180,0.6)'/%3E%3Ccircle cx='12' cy='30' r='0.75' fill='rgba(255,240,180,0.55)'/%3E%3Ccircle cx='30' cy='33' r='0.85' fill='rgba(255,240,180,0.45)'/%3E%3Ccircle cx='20' cy='22' r='0.5' fill='rgba(255,240,180,0.4)'/%3E%3Ccircle cx='38' cy='7' r='0.6' fill='rgba(255,240,180,0.35)'/%3E%3C/svg%3E")`;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: 6,
        // Deep space gradient — dark indigo at top, near-black at bottom
        background:
          "radial-gradient(ellipse at 40% 25%, #1e0e40 0%, #100826 40%, #06020f 100%)",
      }}
    >
      {/* ── Gold foil outer border ── */}
      <div
        className="absolute"
        style={{
          inset: 0,
          borderRadius: 6,
          // Two-tone gold border: brighter top-left, dimmer bottom-right (foil effect)
          border: "0px solid transparent",
          boxShadow:
            "inset 0 0 0 2px rgba(200,160,40,0.75), inset 0 0 0 3px rgba(100,70,15,0.35)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

      {/* ── Inner thin gold rule ── */}
      <div
        className="absolute"
        style={{
          inset: 5,
          borderRadius: 3,
          border: "1px solid rgba(180,140,30,0.3)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

      {/* ── Star layer 1: small dense stars ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: starPatternSm,
          backgroundSize: "24px 24px",
          opacity: 0.85,
        }}
      />

      {/* ── Star layer 2: larger, brighter accent stars ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: starPatternLg,
          backgroundSize: "40px 40px",
          backgroundPosition: "7px 11px",
          opacity: 0.7,
        }}
      />

      {/* ── Nebula / glow cloud ── */}
      <div
        className="absolute"
        style={{
          inset: "15%",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(80,40,160,0.18) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />

      {/* ── Center geometric emblem ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2px]"
        style={{ zIndex: 5 }}
      >
        {/* Outer ring of dots */}
        <div
          style={{
            position: "relative",
            width:  s.symbol * 2.2,
            height: s.symbol * 2.2,
          }}
        >
          {/* Octagram / two overlapping squares */}
          <svg
            width={s.symbol * 2.2}
            height={s.symbol * 2.2}
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", inset: 0, opacity: 0.55 }}
          >
            {/* Outer circle */}
            <circle cx="22" cy="22" r="19" stroke="rgba(200,160,40,0.45)" strokeWidth="0.8" />
            {/* Square 1 */}
            <rect x="9" y="9" width="26" height="26" stroke="rgba(200,160,40,0.35)" strokeWidth="0.7" transform="rotate(0 22 22)" />
            {/* Square 2 rotated 45° */}
            <rect x="9" y="9" width="26" height="26" stroke="rgba(200,160,40,0.3)" strokeWidth="0.7" transform="rotate(45 22 22)" />
            {/* Inner circle */}
            <circle cx="22" cy="22" r="6" stroke="rgba(200,160,40,0.4)" strokeWidth="0.7" />
          </svg>

          {/* Central ✦ glyph */}
          <div
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{
              fontSize: s.symbol * 0.75,
              color: "rgba(220,175,50,0.8)",
              textShadow: "0 0 8px rgba(220,175,50,0.5), 0 0 16px rgba(220,175,50,0.2)",
              lineHeight: 1,
            }}
          >
            ✦
          </div>
        </div>

        {/* Moon phase row */}
        <div
          className="select-none"
          style={{
            fontSize: s.symbol * 0.38,
            color: "rgba(200,160,40,0.5)",
            letterSpacing: "0.25em",
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          ☽ ✦ ☾
        </div>
      </div>

      {/* ── Corner flourishes ── */}
      {(["top-[4px] left-[4px]", "top-[4px] right-[4px]", "bottom-[4px] left-[4px]", "bottom-[4px] right-[4px]"] as const).map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} select-none`}
          style={{
            fontSize: s.symbol * 0.28,
            color: "rgba(200,160,40,0.5)",
            lineHeight: 1,
            zIndex: 5,
          }}
        >
          ◆
        </div>
      ))}

      {/* ── Subtle shimmer on top ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(220,175,50,0.05) 0%, transparent 40%, rgba(220,175,50,0.03) 100%)",
          borderRadius: 6,
        }}
      />
    </div>
  );
}

// ─── Card front ───────────────────────────────────────────────

function CardFront({
  card, reversed, s, imgError, onImgError,
}: {
  card: TarotCardData; reversed: boolean; s: S;
  imgError: boolean; onImgError: () => void;
}) {
  const src = getCardImagePath(card.image);
  const orientationTransform = reversed ? "rotate(180deg)" : "none";
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: 6,
        background: "linear-gradient(160deg,#1c0a36 0%,#2a1050 100%)",
      }}
    >
      {/* Gold border frames */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 6,
          boxShadow:
            "inset 0 0 0 2px rgba(200,160,40,0.7), inset 0 0 0 4px rgba(100,70,15,0.25)",
          zIndex: 10,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 4,
          borderRadius: 3,
          border: "1px solid rgba(180,140,30,0.2)",
          zIndex: 10,
        }}
      />

      {/* Image or text fallback */}
      {src && !imgError ? (
        <img
          src={src}
          alt={card.name_zh}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: orientationTransform, transformOrigin: "center" }}
          onError={onImgError}
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-between py-[10%] px-[8%]"
          style={{ transform: orientationTransform, transformOrigin: "center" }}
        >
          <div className="text-amber-500/60 font-serif text-center" style={{ fontSize: s.title * 0.78 }}>
            {card.arcana === "major" ? "大阿卡納" : (card.suit ?? "小阿卡納")}
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-amber-300 select-none" style={{ fontSize: s.symbol * 1.15 }}>
              {card.arcana === "major" ? "☽" : "◆"}
            </div>
            <div className="text-amber-200 font-serif font-semibold text-center" style={{ fontSize: s.title, lineHeight: 1.25 }}>
              {card.name_zh}
            </div>
            <div className="text-amber-600/55 font-serif text-center" style={{ fontSize: s.title * 0.72 }}>
              {card.name}
            </div>
          </div>
          <div className="text-amber-500/50 font-serif text-center" style={{ fontSize: s.title * 0.68, lineHeight: 1.4 }}>
            {(reversed ? card.keywords_reversed : card.keywords).slice(0, 2).join(" · ")}
          </div>
        </div>
      )}

      {/* Reversed badge — counter-rotated so it reads correctly */}
      {reversed && (
        <div
          className="absolute z-20 bg-rose-950/90 border border-rose-700/60 text-rose-300 font-serif rounded"
          style={{
            top: 4, right: 4,
            fontSize: s.title * 0.72,
            padding: "1px 4px",
          }}
        >
          逆
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────

export default function TarotCard({
  card = null,
  reversed = false,
  faceDown = false,
  revealed = false,
  selected = false,
  size = "md",
  onClick,
  className = "",
  showLabel = false,
  glowOnHover = true,
}: TarotCardProps) {
  const [imgError, setImgError] = useState(false);
  const [pressing, setPressing] = useState(false);
  const s = SIZES[size];
  const showFront = !faceDown && (revealed || card !== null);
  const clickable  = !!onClick;

  const handleClick = useCallback(() => {
    if (!onClick) return;
    setPressing(true);
    setTimeout(() => { setPressing(false); onClick(); }, 175);
  }, [onClick]);

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 select-none ${className}`}
      style={{ cursor: clickable ? "pointer" : "default" }}
      onClick={handleClick}
    >
      <div
        className="relative flex-shrink-0 transition-all duration-200"
        style={{
          width:  s.w,
          height: s.h,
          borderRadius: 6,
          transform: pressing
            ? "scale(0.93)"
            : selected
            ? "scale(1.07) translateY(-5px)"
            : "scale(1)",
          boxShadow: selected
            ? "0 0 0 2px rgba(200,160,40,0.8), 0 10px 28px rgba(0,0,0,0.7)"
            : "0 4px 18px rgba(0,0,0,0.55)",
          filter: selected
            ? "drop-shadow(0 0 10px rgba(200,160,40,0.5))"
            : undefined,
        }}
        onMouseEnter={(e) => {
          if (!clickable || !glowOnHover || selected) return;
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.04) translateY(-3px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 0 0 1.5px rgba(180,140,30,0.55), 0 14px 30px rgba(0,0,0,0.65)";
        }}
        onMouseLeave={(e) => {
          if (!clickable || !glowOnHover || selected) return;
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 18px rgba(0,0,0,0.55)";
        }}
      >
        {faceDown || !showFront ? (
          <CardBack s={s} />
        ) : card ? (
          <CardFront
            card={card}
            reversed={reversed}
            s={s}
            imgError={imgError}
            onImgError={() => setImgError(true)}
          />
        ) : (
          /* Empty slot */
          <div
            className="absolute inset-0"
            style={{
              borderRadius: 6,
              border: "2px dashed rgba(100,70,15,0.3)",
              background: "rgba(13,5,24,0.5)",
            }}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && card && showFront && (
        <div className="text-center">
          <div className="text-amber-300 font-serif font-medium" style={{ fontSize: s.title }}>
            {card.name_zh}
          </div>
          {reversed && (
            <div className="text-rose-400/70 font-serif" style={{ fontSize: s.title * 0.84 }}>
              逆位
            </div>
          )}
        </div>
      )}
    </div>
  );
}
