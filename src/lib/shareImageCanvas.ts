/**
 * 9:16 share image — dark mystic gradient, framed cards, real reading text only.
 */

export type ShareImageCardSlot = {
  position: string;
  name_zh: string;
  reversed: boolean;
};

export type ShareImagePayload = {
  question: string;
  cards: ShareImageCardSlot[];
  /** 1–2 short sentences from AI free reading */
  interpretationBrief: string;
  /** Very short summary of the three-card spread */
  trioSummary: string;
  /** e.g. arcanapath.com */
  brandDomain: string;
};

const W = 1080;
const H = 1920;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const words = cleaned.split("");
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i];
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines.slice(0, maxLines);
}

function drawRoundedFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  fill: string,
  lineWidth: number
) {
  ctx.beginPath();
  const rr = (ctx as CanvasRenderingContext2D & { roundRect?(x: number, y: number, w: number, h: number, r: number): void })
    .roundRect;
  if (typeof rr === "function") rr.call(ctx, x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function renderShareImageToDataUrl(payload: ShareImagePayload): string {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background — deep purple / black mystic
  const g0 = ctx.createRadialGradient(W * 0.5, H * 0.15, 80, W * 0.5, H * 0.5, H * 0.85);
  g0.addColorStop(0, "#3d2a6b");
  g0.addColorStop(0.35, "#1a0d32");
  g0.addColorStop(0.7, "#0a0518");
  g0.addColorStop(1, "#020008");
  ctx.fillStyle = g0;
  ctx.fillRect(0, 0, W, H);

  const g1 = ctx.createLinearGradient(0, 0, W, H);
  g1.addColorStop(0, "rgba(120, 60, 180, 0.12)");
  g1.addColorStop(0.5, "rgba(0,0,0,0)");
  g1.addColorStop(1, "rgba(180, 130, 60, 0.08)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Outer ornate frame
  const margin = 48;
  drawRoundedFrame(
    ctx,
    margin,
    margin,
    W - margin * 2,
    H - margin * 2,
    28,
    "rgba(212, 175, 55, 0.55)",
    "rgba(8, 4, 20, 0.35)",
    3
  );
  drawRoundedFrame(
    ctx,
    margin + 10,
    margin + 10,
    W - (margin + 10) * 2,
    H - (margin + 10) * 2,
    22,
    "rgba(248, 210, 140, 0.25)",
    "rgba(0,0,0,0)",
    1.5
  );

  let y = margin + 56;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(252, 211, 77, 0.95)";
  ctx.font = "600 38px ui-serif, Georgia, serif";
  ctx.fillText("✦ ArcanaPath", W / 2, y);
  y += 52;

  ctx.fillStyle = "rgba(254, 243, 199, 0.88)";
  ctx.font = "600 30px ui-serif, Georgia, serif";
  const qPrefix = "你的問題";
  ctx.fillText(qPrefix, W / 2, y);
  y += 44;
  ctx.font = "28px ui-serif, Georgia, serif";
  const qLines = wrapLines(ctx, `「${payload.question}」`, W - margin * 2 - 80, 3);
  qLines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 36;
  });
  y += 28;

  // Three cards
  const cardW = 290;
  const cardH = 400;
  const gap = 36;
  const totalW = cardW * 3 + gap * 2;
  const startX = (W - totalW) / 2;
  const cardY = y;

  payload.cards.slice(0, 3).forEach((c, idx) => {
    const x = startX + idx * (cardW + gap);
    // Card chrome
    drawRoundedFrame(ctx, x, cardY, cardW, cardH, 16, "rgba(212, 175, 55, 0.5)", "rgba(25, 12, 48, 0.92)", 2);
    drawRoundedFrame(ctx, x + 8, cardY + 8, cardW - 16, cardH - 16, 12, "rgba(248, 210, 140, 0.2)", "rgba(10, 5, 22, 0.6)", 1);

    ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
    ctx.font = "600 22px ui-serif, Georgia, serif";
    ctx.fillText(c.position, x + cardW / 2, cardY + 44);

    ctx.fillStyle = "#fde68a";
    ctx.font = "600 26px ui-serif, Georgia, serif";
    const nameLines = wrapLines(ctx, c.name_zh, cardW - 36, 2);
    let ny = cardY + 120;
    nameLines.forEach((nl) => {
      ctx.fillText(nl, x + cardW / 2, ny);
      ny += 32;
    });

    ctx.fillStyle = "rgba(252, 211, 77, 0.65)";
    ctx.font = "22px ui-serif, Georgia, serif";
    ctx.fillText(c.reversed ? "逆位" : "正位", x + cardW / 2, cardY + cardH - 36);
  });

  y = cardY + cardH + 56;

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
  ctx.font = "600 26px ui-serif, Georgia, serif";
  ctx.fillText("AI 解讀摘錄", W / 2, y);
  y += 40;

  ctx.fillStyle = "rgba(254, 243, 199, 0.82)";
  ctx.font = "24px ui-serif, Georgia, serif";
  const interpLines = wrapLines(ctx, payload.interpretationBrief, W - margin * 2 - 100, 5);
  interpLines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 34;
  });
  y += 28;

  ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
  ctx.font = "600 24px ui-serif, Georgia, serif";
  ctx.fillText("三牌總結", W / 2, y);
  y += 36;
  ctx.fillStyle = "rgba(233, 213, 255, 0.88)";
  ctx.font = "26px ui-serif, Georgia, serif";
  const sumLines = wrapLines(ctx, payload.trioSummary, W - margin * 2 - 100, 2);
  sumLines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 34;
  });

  y = H - margin - 72;
  ctx.fillStyle = "rgba(252, 211, 77, 0.55)";
  ctx.font = "22px ui-serif, Georgia, serif";
  ctx.fillText(payload.brandDomain, W / 2, y);

  return canvas.toDataURL("image/png");
}

function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const cut = t.split(/[。！？.!?]/).filter(Boolean)[0]?.trim() ?? t;
  return cut.slice(0, 120);
}

/** Build payload from a ReadingResult-like object (client or API JSON). */
export function buildShareImagePayloadFromReading(result: {
  question: string;
  cards?: Array<{ card?: { name_zh?: string }; reversed?: boolean; position?: string }>;
  freeReading?: {
    headline?: string;
    mainAxis?: string;
    cardReadings?: Array<{ interpretation?: string }>;
  };
}, brandDomain: string): ShareImagePayload {
  const cardsRaw = Array.isArray(result.cards) ? result.cards.slice(0, 3) : [];
  const positions = ["過去", "現在", "未來"];
  const cards: ShareImageCardSlot[] = cardsRaw.map((item, i) => ({
    position: (item.position as string) || positions[i] || `第${i + 1}張`,
    name_zh: item.card?.name_zh ?? "—",
    reversed: !!item.reversed,
  }));

  const fr = result.freeReading ?? {};
  const headline = (fr.headline ?? "").replace(/\s+/g, " ").trim();
  const mainAxis = (fr.mainAxis ?? "").replace(/\s+/g, " ").trim();
  const cr0 = fr.cardReadings?.[0]?.interpretation?.replace(/\s+/g, " ").trim() ?? "";
  const cr1 = fr.cardReadings?.[1]?.interpretation?.replace(/\s+/g, " ").trim() ?? "";

  let interpretationBrief = "";
  if (headline && firstSentence(mainAxis)) {
    interpretationBrief = `${headline} ${firstSentence(mainAxis)}`.trim();
  } else if (headline && cr0) {
    interpretationBrief = `${headline} ${firstSentence(cr0)}`.trim();
  } else if (cr0 && cr1) {
    interpretationBrief = `${firstSentence(cr0)} ${firstSentence(cr1)}`.trim();
  } else {
    interpretationBrief = headline || firstSentence(mainAxis) || firstSentence(cr0) || "牌面訊息已為你展開。";
  }
  if (interpretationBrief.length > 160) interpretationBrief = `${interpretationBrief.slice(0, 157)}…`;

  const trioSummary =
    headline ||
    firstSentence(mainAxis).slice(0, 36) ||
    (cards.length ? `${cards.map((c) => c.name_zh).join(" · ")}` : "").slice(0, 40) ||
    "三張牌為你點出此刻的能量走向。";

  return {
    question: result.question || "—",
    cards: cards.length ? cards : positions.map((p, i) => ({ position: p, name_zh: "—", reversed: false })),
    interpretationBrief,
    trioSummary: trioSummary.slice(0, 80),
    brandDomain: brandDomain || "ArcanaPath",
  };
}
