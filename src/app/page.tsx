// src/app/page.tsx
import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: "linear-gradient(160deg, #0d0518 0%, #1a0a2e 50%, #0d0518 100%)" }}
    >
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-amber-900/20">
        <div className="text-amber-400 font-serif text-xl font-semibold tracking-wider">
          ✦ ArcanaPath
        </div>
        <div className="flex gap-4 text-sm font-serif">
          <Link href="/login" className="text-amber-500/70 hover:text-amber-400 transition-colors">
            登入
          </Link>
          <Link
            href="/register"
            className="bg-amber-800/50 hover:bg-amber-700/50 border border-amber-700/50 text-amber-300 px-4 py-1.5 rounded-lg transition-colors"
          >
            免費註冊
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Decorative */}
        <div className="text-amber-600/30 text-8xl mb-8 select-none">☽</div>

        <h1 className="text-5xl sm:text-6xl font-serif text-amber-200 font-semibold leading-tight mb-4">
          ArcanaPath
        </h1>
        <p className="text-amber-500/70 font-serif text-lg mb-2">
          AI 塔羅解讀 · 香港繁體中文
        </p>
        <p className="text-amber-600/50 text-sm font-serif max-w-md mb-10">
          直接、真實、唔說廢話。讓塔羅幫你看清楚現在的局面。
        </p>

        <Link
          href="/reading"
          className="bg-amber-700 hover:bg-amber-600 text-white font-serif font-semibold py-4 px-12 rounded-xl text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-700/30"
        >
          開始占卜 →
        </Link>

        <p className="text-amber-700/40 text-xs font-serif mt-4">
          訪客每日1次免費 · 註冊會員每日3次
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 px-6 pb-16 max-w-2xl mx-auto w-full">
        {[
          { icon: "♥", title: "感情", desc: "感情走向・對方內心・關係真相" },
          { icon: "◆", title: "事業", desc: "職場局勢・轉機時機・行動方向" },
          { icon: "✦", title: "財運", desc: "財運週期・機遇風險・決策建議" },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 text-center"
          >
            <div className="text-amber-500 text-2xl mb-2">{f.icon}</div>
            <div className="text-amber-300 font-serif font-medium text-sm mb-1">{f.title}</div>
            <div className="text-amber-600/60 text-xs font-serif leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-amber-800/40 text-xs font-serif">
        © ArcanaPath · 僅供娛樂參考
      </div>
    </div>
  );
}
