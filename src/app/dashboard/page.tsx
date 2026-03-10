// src/app/dashboard/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getReadingsByUser } from "@/lib/store";
import type { ReadingResult } from "@/types";

const TOPIC_LABELS: Record<string, string> = {
  love: "感情",
  career: "事業",
  wealth: "財運",
  life: "人生",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const history: ReadingResult[] = user.role !== "visitor"
    ? getReadingsByUser(user.id)
    : [];

  const dailyLimit = user.role === "admin" ? "∞" : user.role === "member" ? "3" : "1";
  const remaining = user.role === "admin"
    ? "∞"
    : String(Math.max(0, parseInt(dailyLimit) - user.dailyUsage));

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(160deg, #0d0518 0%, #1a0a2e 50%, #0d0518 100%)" }}
    >
      {/* Header */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-amber-900/20">
        <Link href="/" className="text-amber-400 font-serif text-xl font-semibold">
          ✦ ArcanaPath
        </Link>
        <div className="flex gap-4 items-center text-sm font-serif">
          {user.role === "admin" && (
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors">
              後台管理
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button className="text-amber-600/60 hover:text-amber-500 transition-colors">
              登出
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* User stats */}
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-amber-200 font-serif font-semibold text-lg">
                {user.name ?? user.email}
              </div>
              <div className="text-amber-600/60 text-xs font-serif capitalize mt-0.5">
                {user.role === "admin" ? "管理員" : user.role === "member" ? "會員" : "訪客"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-amber-400 font-serif text-2xl font-semibold">{remaining}</div>
              <div className="text-amber-600/50 text-xs">今日剩餘</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-amber-900/30 bg-black/20 p-3">
              <div className="text-amber-300 font-serif font-semibold">{user.totalUsage}</div>
              <div className="text-amber-600/50 text-xs">總占卜次數</div>
            </div>
            <div className="rounded-lg border border-amber-900/30 bg-black/20 p-3">
              <div className="text-amber-300 font-serif font-semibold">{user.dailyUsage}</div>
              <div className="text-amber-600/50 text-xs">今日占卜</div>
            </div>
            <div className="rounded-lg border border-amber-900/30 bg-black/20 p-3">
              <div className="text-amber-300 font-serif font-semibold">{dailyLimit}</div>
              <div className="text-amber-600/50 text-xs">每日上限</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/reading"
          className="block w-full text-center bg-amber-700 hover:bg-amber-600 text-white font-serif font-semibold py-4 rounded-xl transition-colors mb-6 text-lg"
        >
          開始占卜 →
        </Link>

        {/* History */}
        <div>
          <h2 className="text-amber-400 font-serif font-semibold mb-4">占卜歷史</h2>
          {history.length === 0 ? (
            <div className="text-center text-amber-600/40 font-serif py-12 border border-amber-900/20 rounded-xl">
              尚未有占卜記錄
            </div>
          ) : (
            <div className="space-y-3">
              {history
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((r) => (
                  <Link
                    key={r.id}
                    href={`/result/${r.id}`}
                    className="block rounded-xl border border-amber-800/30 bg-amber-950/20 p-4 hover:border-amber-700/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-amber-200 font-serif text-sm truncate">
                          {r.question}
                        </div>
                        <div className="text-amber-600/50 text-xs mt-1">
                          {TOPIC_LABELS[r.topic]} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString("zh-HK")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.isPaid && (
                          <span className="text-xs bg-amber-800/50 text-amber-300 px-2 py-0.5 rounded font-serif">
                            完整版
                          </span>
                        )}
                        <span className="text-amber-500/40 text-sm">→</span>
                      </div>
                    </div>
                    {r.freeReading?.headline && (
                      <div className="text-amber-500/50 text-xs font-serif mt-2 italic truncate">
                        "{r.freeReading.headline}"
                      </div>
                    )}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
