// =============================================================
// src/lib/reading/generate.ts
// Delegates to upgraded AI engine in src/lib/ai/reading.ts
// to ensure all live flows use the new non-generic prompts.
// =============================================================

import type { DrawnCard, Topic, ReadingResult } from "@/types/reading";
import { generateReading as generateReadingWithPersona } from "@/lib/ai/reading";

export async function generateReading(opts: {
  id:       string;
  question: string;
  topic:    Topic;
  cards:    DrawnCard[];
  userId:   string | null;
}): Promise<ReadingResult> {
  return generateReadingWithPersona(opts);
}
