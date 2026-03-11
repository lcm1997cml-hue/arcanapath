// src/app/register/page.tsx
"use client";

import React from "react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-white px-4"
      style={{ background: "linear-gradient(160deg, #0d0518 0%, #1a0a2e 50%, #0d0518 100%)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-amber-500 font-serif text-2xl font-semibold">
            ✦ ArcanaPath
          </Link>
          <p className="text-amber-500/50 text-sm font-serif mt-2">會員系統稍後推出</p>
          <p className="text-amber-600/40 text-xs font-serif mt-1">
            目前只需留下 email，即可獲得 3 次免費占卜
          </p>
        </div>

        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-6 space-y-4">
          <p className="text-amber-300/80 text-sm font-serif leading-relaxed">
            現階段無需建立會員帳戶。你可以直接前往占卜頁，輸入電郵後立即開始占卜，系統會為該電郵提供 3 次免費占卜額度。
          </p>
          <Link
            href="/reading"
            className="block w-full bg-amber-700 hover:bg-amber-600 text-white text-center font-serif font-semibold py-3 rounded-lg transition-colors"
          >
            前往占卜頁
          </Link>
        </div>

        <p className="text-center text-amber-600/50 text-sm font-serif">
          管理員請前往{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300">
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
