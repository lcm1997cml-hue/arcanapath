"use client";

import React, { useState } from "react";

const PLANS: Array<{ plan: "19" | "39" | "88"; label: string }> = [
  { plan: "19", label: "HK$19 即可查看完整答案" },
  { plan: "39", label: "HK$39 三次完整解讀" },
  { plan: "88", label: "HK$88 人生深度版" },
];

export default function CheckoutPlanButtons({ readingId }: { readingId: string }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  const startCheckout = async (plan: "19" | "39" | "88") => {
    setLoadingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingId, plan }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "建立付款失敗，請重試");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("網絡錯誤，請稍後再試");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {PLANS.map(({ plan, label }) => (
        <button
          key={plan}
          onClick={() => startCheckout(plan)}
          disabled={loadingPlan !== null}
          className="flex-shrink-0 font-serif font-bold text-white text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-lg transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
            boxShadow: "0 3px 14px rgba(180,83,9,0.4), inset 0 1px 0 rgba(255,200,100,0.12)",
          }}
        >
          {loadingPlan === plan ? "處理中…" : `🔓 ${label}`}
        </button>
      ))}
      {error && <div className="w-full text-right text-rose-400 text-xs font-serif">{error}</div>}
    </div>
  );
}
