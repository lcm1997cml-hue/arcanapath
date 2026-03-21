/**
 * 9:16 share image — dark mystic gradient, framed cards with real RWS faces, reading text.
 */

import { getCardById, getCardImagePath } from "@/lib/tarot/utils";

export type ShareImageCardSlot = {
  position: string;
  name_zh: string;
  reversed: boolean;
  /** Deck image filename (passed to getCardImagePath) */
  imageFile: string;
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

function absolutizeAssetUrl(relativeOrAbsolute: string): string {
  const s = relativeOrAbsolute.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

function loadCardImage(relativePath: string): Promise<HTMLImageElement | null> {
  const url = absolutizeAssetUrl(relativePath);
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

/** Draw face with *contain* fit (full card visible, letterbox) + reversed = 180°. */
function drawCardFace(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  reversed: boolean
) {
  const r = 10;
  ctx.save();
  ctx.beginPath();
  const rr = (ctx as CanvasRenderingContext2D & { roundRect?(a: number, b: number, c: number, d: number, e: number): void })
    .roundRect;
  if (typeof rr === "function") rr.call(ctx, x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = "rgba(8, 4, 22, 0.98)";
  ctx.fillRect(x, y, w, h);

  if (!img || !img.naturalWidth) {
    ctx.fillStyle = "rgba(248, 210, 140, 0.45)";
    ctx.font = "64px ui-serif, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", x + w / 2, y + h / 2);
    ctx.restore();
    drawRoundedFrame(ctx, x, y, w, h, r, "rgba(248, 210, 140, 0.35)", "rgba(0,0,0,0)", 1);
    return;
  }

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  if (reversed) ctx.rotate(Math.PI);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  drawRoundedFrame(ctx, x, y, w, h, r, "rgba(248, 210, 140, 0.45)", "rgba(0,0,0,0)", 1.5);
}

/**
 * Full-quality share PNG with real card art (async — loads /cards/rws1909/*).
 */
export async function renderShareImageToDataUrlAsync(payload: ShareImagePayload): Promise<string> {
  const paths = payload.cards.map((c) => getCardImagePath(c.imageFile));
  const images = await Promise.all(paths.map((p) => (p ? loadCardImage(p) : Promise.resolve(null))));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

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

  const margin = 40;
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

  let y = margin + 44;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(252, 211, 77, 0.95)";
  ctx.font = "600 32px ui-serif, Georgia, serif";
  ctx.fillText("✦ ArcanaPath", W / 2, y);
  y += 40;

  ctx.fillStyle = "rgba(254, 243, 199, 0.88)";
  ctx.font = "600 24px ui-serif, Georgia, serif";
  ctx.fillText("你的問題", W / 2, y);
  y += 32;
  ctx.font = "24px ui-serif, Georgia, serif";
  const qLines = wrapLines(ctx, `「${payload.question}」`, W - margin * 2 - 72, 2);
  qLines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 30;
  });
  y += 14;

  /* —— 三張牌：加高圖區、contain 顯示完整牌面 —— */
  const gap = 18;
  const cardW = Math.floor((W - margin * 2 - 64 - gap * 2) / 3);
  const cardSlotH = 548;
  const labelH = 26;
  const imgH = 410;
  const orientH = 28;
  const imgTop = (cy: number) => cy + labelH + 8;
  const totalW = cardW * 3 + gap * 2;
  const startX = (W - totalW) / 2;
  const cardY = y;

  payload.cards.slice(0, 3).forEach((c, idx) => {
    const x = startX + idx * (cardW + gap);
    drawRoundedFrame(ctx, x, cardY, cardW, cardSlotH, 16, "rgba(212, 175, 55, 0.5)", "rgba(25, 12, 48, 0.92)", 2);

    ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
    ctx.font = "600 18px ui-serif, Georgia, serif";
    ctx.fillText(c.position, x + cardW / 2, cardY + 20);

    const pad = 10;
    const imgX = x + pad;
    const imgY = imgTop(cardY);
    const imgW = cardW - pad * 2;
    drawCardFace(ctx, images[idx] ?? null, imgX, imgY, imgW, imgH, c.reversed);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fde68a";
    ctx.font = "600 20px ui-serif, Georgia, serif";
    const nameLines = wrapLines(ctx, c.name_zh, cardW - 20, 2);
    let ny = imgY + imgH + 14;
    nameLines.forEach((nl) => {
      ctx.fillText(nl, x + cardW / 2, ny);
      ny += 26;
    });

    ctx.fillStyle = "rgba(253, 230, 138, 0.98)";
    ctx.font = "bold 20px ui-serif, Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText(c.reversed ? "逆位" : "正位", x + cardW / 2, cardY + cardSlotH - orientH / 2 - 6);
    ctx.textBaseline = "alphabetic";
  });

  y = cardY + cardSlotH + 32;

  ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
  ctx.font = "600 22px ui-serif, Georgia, serif";
  ctx.fillText("AI 解讀摘錄", W / 2, y);
  y += 30;

  ctx.fillStyle = "rgba(254, 243, 199, 0.82)";
  ctx.font = "20px ui-serif, Georgia, serif";
  const interpLines = wrapLines(ctx, payload.interpretationBrief, W - margin * 2 - 88, 3);
  interpLines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 26;
  });
  y += 14;

  ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
  ctx.font = "600 20px ui-serif, Georgia, serif";
  ctx.fillText("三牌總結", W / 2, y);
  y += 28;
  ctx.fillStyle = "rgba(233, 213, 255, 0.88)";
  ctx.font = "22px ui-serif, Georgia, serif";
  const sumLines = wrapLines(ctx, payload.trioSummary, W - margin * 2 - 88, 2);
  sumLines.forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 26;
  });

  y = H - margin - 52;
  ctx.fillStyle = "rgba(252, 211, 77, 0.55)";
  ctx.font = "20px ui-serif, Georgia, serif";
  ctx.fillText(payload.brandDomain, W / 2, y);

  return canvas.toDataURL("image/png");
}

function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const cut = t.split(/[。！？.!?]/).filter(Boolean)[0]?.trim() ?? t;
  return cut.slice(0, 120);
}

/** Resolve card face file + labels from full DrawnCard or slim { cardId } rows in JSONB. */
function slotFromReadingCardItem(
  item: unknown,
  index: number
): { position: string; name_zh: string; reversed: boolean; imageFile: string } {
  const positions = ["過去", "現在", "未來"];
  const row = item as Record<string, unknown>;
  const position =
    (typeof row.position === "string" && row.position) || positions[index] || `第${index + 1}張`;
  const reversed = !!row.reversed;

  const nested = row.card;
  let cardId: number | undefined;
  let nameFromNested: string | undefined;
  let imageFromNested: string | undefined;

  if (nested && typeof nested === "object" && nested !== null && !Array.isArray(nested)) {
    const c = nested as Record<string, unknown>;
    if (typeof c.id === "number" && Number.isFinite(c.id)) cardId = c.id;
    else if (typeof c.id === "string" && c.id.trim() !== "") {
      const n = Number(c.id);
      if (Number.isFinite(n)) cardId = n;
    }
    if (typeof c.name_zh === "string") nameFromNested = c.name_zh;
    if (typeof c.image === "string") imageFromNested = c.image;
  }

  if (cardId == null) {
    if (typeof row.cardId === "number" && Number.isFinite(row.cardId)) cardId = row.cardId;
    else if (typeof row.cardId === "string" && row.cardId.trim() !== "") {
      const n = Number(row.cardId);
      if (Number.isFinite(n)) cardId = n;
    }
  }

  const fromDeck = cardId != null ? getCardById(cardId) : undefined;
  const name_zh = nameFromNested || fromDeck?.name_zh || "—";
  const imageFile = (imageFromNested || fromDeck?.image || "").trim();

  return { position, name_zh, reversed, imageFile };
}

/** Build payload from a ReadingResult-like object (client or API JSON). */
export function buildShareImagePayloadFromReading(
  result: {
    question: string;
    cards?: unknown[];
    freeReading?: {
      headline?: string;
      mainAxis?: string;
      cardReadings?: Array<{ interpretation?: string }>;
    };
  },
  brandDomain: string
): ShareImagePayload {
  const cardsRaw = Array.isArray(result.cards) ? result.cards.slice(0, 3) : [];
  const positions = ["過去", "現在", "未來"];
  const cards: ShareImageCardSlot[] = cardsRaw.map((item, i) => {
    const s = slotFromReadingCardItem(item, i);
    return {
      position: s.position,
      name_zh: s.name_zh,
      reversed: s.reversed,
      imageFile: s.imageFile,
    };
  });

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
    cards: cards.length ? cards : positions.map((p) => ({ position: p, name_zh: "—", reversed: false, imageFile: "" })),
    interpretationBrief,
    trioSummary: trioSummary.slice(0, 80),
    brandDomain: brandDomain || "ArcanaPath",
  };
}
