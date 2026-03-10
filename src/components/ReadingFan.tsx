// =============================================================
// src/components/ReadingFan.tsx
// Fan-shaped card selection.
// Cards are noticeably larger for easier selection.
// Selected cards rise dramatically with a gold glow.
// =============================================================
"use client";

import React, { useMemo, useState } from "react";

interface ReadingFanProps {
  totalCards: number;
  selectedIndices: number[];
  onSelect: (index: number) => void;
  maxSelect?: number;
}

// ─── Layout constants ─────────────────────────────────────────
const FAN_SPREAD_DEG = 116;   // slightly wider for 26 cards
const FAN_RADIUS     = 340;   // larger radius to avoid crowding
const CARD_W         = 52;
const CARD_H         = 88;
const PIVOT_OFFSET   = 390;   // keeps upper cards in clickable area
const RISE_PX        = 32;

// ─── Mini star pattern (SVG data URI) ─────────────────────────
// Used as the card-back texture inside the fan
const STAR_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='2' cy='2' r='0.6' fill='rgba(255,220,100,0.35)'/%3E%3Ccircle cx='10' cy='7' r='0.4' fill='rgba(255,220,100,0.25)'/%3E%3Ccircle cx='16' cy='14' r='0.7' fill='rgba(255,220,100,0.3)'/%3E%3Ccircle cx='5' cy='16' r='0.45' fill='rgba(255,220,100,0.2)'/%3E%3Ccircle cx='18' cy='3' r='0.5' fill='rgba(255,220,100,0.28)'/%3E%3C/svg%3E")`;

export default function ReadingFan({
  totalCards,
  selectedIndices,
  onSelect,
  maxSelect = 3,
}: ReadingFanProps) {
  const count = Math.min(totalCards, 26);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cards = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const fraction  = count === 1 ? 0.5 : i / (count - 1);
      const angleDeg  = -FAN_SPREAD_DEG / 2 + fraction * FAN_SPREAD_DEG;
      const angleRad  = (angleDeg * Math.PI) / 180;
      const x = Math.sin(angleRad) * FAN_RADIUS;
      const y = -Math.cos(angleRad) * FAN_RADIUS + PIVOT_OFFSET;
      return { i, angleDeg, x, y };
    });
  }, [count]);

  const containerW = FAN_RADIUS * 2 + CARD_W + 24;
  const containerH = PIVOT_OFFSET + CARD_H * 0.6 + 24;
  const canSelectMore = selectedIndices.length < maxSelect;

  return (
    <div
      className="relative mx-auto touch-none"
      style={{ width: containerW, height: containerH }}
    >
      {cards.map(({ i, angleDeg, x, y }) => {
        const isSelected  = selectedIndices.includes(i);
        const isDisabled  = !isSelected && !canSelectMore;
        const isHovered   = hoveredIndex === i && !isDisabled;

        // Rise amount: selected > hovered > none
        const riseAmount  = isSelected ? RISE_PX : isHovered ? RISE_PX * 0.55 : 0;

        return (
          <div
            key={i}
            onClick={() => !isDisabled && onSelect(i)}
            onMouseEnter={() => !isDisabled && setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="absolute transition-all"
            style={{
              width:  CARD_W,
              height: CARD_H,
              left:   containerW / 2 + x - CARD_W / 2,
              top:    y - CARD_H / 2,
              transformOrigin: `50% ${PIVOT_OFFSET + CARD_H / 2}px`,
              transform: `rotate(${angleDeg}deg) translateY(${-riseAmount}px)`,
              transitionDuration: isSelected ? "320ms" : "180ms",
              transitionTimingFunction: isSelected ? "cubic-bezier(0.34,1.56,0.64,1)" : "ease-out",
              zIndex: isSelected ? 60 + i : isHovered ? 40 + i : i,
              cursor: isDisabled ? "default" : "pointer",
            }}
          >
            <div
              className="w-full h-full relative overflow-hidden"
              style={{
                borderRadius: 6,
                border: isSelected
                  ? "2px solid rgba(251,191,36,0.9)"
                  : isHovered
                  ? "1.5px solid rgba(200,155,40,0.65)"
                  : isDisabled
                  ? "1.5px solid rgba(80,50,15,0.25)"
                  : "1.5px solid rgba(130,90,25,0.5)",
                background: isSelected
                  ? "radial-gradient(ellipse at 40% 30%, #3d1f6e 0%, #1a0a2e 100%)"
                  : isDisabled
                  ? "linear-gradient(160deg,#0b0418,#150830)"
                  : "radial-gradient(ellipse at 40% 30%, #2e1565 0%, #1a0a2e 100%)",
                boxShadow: isSelected
                  ? "0 0 18px rgba(251,191,36,0.55), 0 6px 18px rgba(0,0,0,0.7)"
                  : isHovered
                  ? "0 0 10px rgba(200,155,40,0.3), 0 5px 14px rgba(0,0,0,0.65)"
                  : "0 2px 8px rgba(0,0,0,0.55)",
                opacity: isDisabled ? 0.28 : 1,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: STAR_BG,
                  backgroundSize: "20px 20px",
                  opacity: isSelected ? 0.9 : isHovered ? 0.7 : 0.45,
                }}
              />
              <div
                className="absolute"
                style={{
                  inset: 3,
                  borderRadius: 3,
                  border: isSelected
                    ? "1px solid rgba(251,191,36,0.35)"
                    : "1px solid rgba(130,90,25,0.2)",
                }}
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span
                    className="text-amber-300 font-serif select-none"
                    style={{
                      fontSize: CARD_W * 0.42,
                      textShadow: "0 0 12px rgba(251,191,36,0.9), 0 0 24px rgba(251,191,36,0.4)",
                      lineHeight: 1,
                    }}
                  >
                    ✦
                  </span>
                </div>
              )}
              {isHovered && !isSelected && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(125deg,transparent 25%,rgba(251,191,36,0.06) 50%,transparent 75%)",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
