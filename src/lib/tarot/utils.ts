// src/lib/tarot/utils.ts
import deckData from "./deck.json";
import type { TarotCardData, DrawnCard } from "@/types";

export const deck: TarotCardData[] = deckData as TarotCardData[];

export function getCardById(id: number): TarotCardData | undefined {
  return deck.find((c) => c.id === id);
}

export function getCardImagePath(image: string): string {
  if (!image) return "";
  return `/cards/rws1909/${image}`;
}

export function shuffleDeck(): TarotCardData[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCards(count = 3): DrawnCard[] {
  const shuffled = shuffleDeck();
  const positions = ["過去", "現在", "未來"];
  return shuffled.slice(0, count).map((card, i) => ({
    card,
    position: positions[i] ?? `第${i + 1}張`,
    reversed: Math.random() < 0.3,
  }));
}

export function serializeDrawnCards(
  cards: DrawnCard[]
): { cardId: number; position: string; reversed: boolean }[] {
  return cards.map((dc) => ({
    cardId: dc.card.id,
    position: dc.position,
    reversed: dc.reversed,
  }));
}

export function deserializeDrawnCards(
  serialized: { cardId: number; position: string; reversed: boolean }[]
): DrawnCard[] {
  return serialized.map((s) => {
    const card = getCardById(s.cardId);
    if (!card) throw new Error(`Card ${s.cardId} not found`);
    return { card, position: s.position, reversed: s.reversed };
  });
}
