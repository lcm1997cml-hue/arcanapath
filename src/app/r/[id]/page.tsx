import Link from "next/link";
import { notFound } from "next/navigation";
import { getReading } from "@/lib/store";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicSharePage({ params }: Props) {
  const { id } = await params;
  const result = await getReading(id);
  if (!result) notFound();

  const cards = Array.isArray(result.cards) ? result.cards.slice(0, 3) : [];
  const summaryRaw =
    result.freeReading?.headline ??
    result.freeReading?.nextStep ??
    result.freeReading?.mainAxis ??
    "牌面顯示你正踏入新的轉變階段。";
  const summary = String(summaryRaw).replace(/\s+/g, " ").trim().slice(0, 42);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #2e1565 0%, #1a0a2e 40%, #0d0518 100%)",
      }}
    >
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="text-amber-500 font-serif text-xl font-semibold">✦ ArcanaPath</div>
          <h1 className="text-amber-100 font-serif text-base leading-relaxed">「{result.question}」</h1>
        </div>

        <div className="rounded-xl border border-amber-800/30 bg-amber-950/25 p-4 space-y-3">
          <div className="text-amber-400 text-sm font-serif">三張牌</div>
          <div className="grid grid-cols-3 gap-2">
            {cards.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-amber-800/35 bg-black/30 p-2 text-center"
              >
                <div className="text-amber-500/70 text-[11px] font-serif">
                  {idx === 0 ? "過去" : idx === 1 ? "現在" : "未來"}
                </div>
                <div className="text-amber-200 text-xs font-serif mt-1 leading-snug">
                  {item.card.name_zh}
                </div>
                <div className="text-amber-600/70 text-[11px] font-serif mt-1">
                  {item.reversed ? "逆位" : "正位"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-700/35 bg-amber-950/20 p-4">
          <div className="text-amber-500/65 text-xs font-serif mb-2">簡短結論</div>
          <p className="text-amber-100/85 text-sm font-serif leading-relaxed">{summary}</p>
        </div>

        <div className="rounded-xl border border-amber-900/25 bg-amber-950/10 p-4 relative overflow-hidden">
          <div className="space-y-2 filter blur-[3px] pointer-events-none select-none" aria-hidden>
            <div className="h-4 bg-amber-900/25 rounded w-3/4" />
            <div className="h-3 bg-amber-900/15 rounded w-full" />
            <div className="h-3 bg-amber-900/15 rounded w-5/6" />
            <div className="h-3 bg-amber-900/15 rounded w-2/3" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-amber-950/65">
            <div className="text-2xl">🔒</div>
            <div className="text-amber-300/80 font-serif text-sm">深度心理解讀（已模糊）</div>
          </div>
        </div>

        <Link
          href="/reading"
          className="block w-full text-center bg-amber-700 hover:bg-amber-600 text-white font-serif font-semibold py-3 rounded-xl transition-colors"
        >
          去占卜 →
        </Link>
      </div>
    </div>
  );
}
