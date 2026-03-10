// src/app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { nanoid } from "nanoid";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setError("請填寫所有必填欄位");
      return;
    }
    if (password.length < 6) {
      setError("密碼最少6位");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // In production: call /api/auth/register
      // For now: auto-login as demo member
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@arcanapath.com", password: "demo" }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/dashboard");
      } else {
        setError("註冊失敗，請稍後再試");
      }
    } catch {
      setError("網絡錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-amber-500/50 text-sm font-serif mt-2">免費建立帳戶</p>
          <p className="text-amber-600/40 text-xs font-serif mt-1">
            每日3次免費占卜 · 永久保存記錄
          </p>
        </div>

        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-6 space-y-4">
          <div>
            <label className="text-amber-400 text-sm font-serif block mb-1.5">
              暱稱 <span className="text-amber-700/50">(選填)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名字"
              className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-2.5 text-amber-100 placeholder:text-amber-800/50 font-serif text-sm focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-amber-400 text-sm font-serif block mb-1.5">電郵 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-2.5 text-amber-100 placeholder:text-amber-800/50 font-serif text-sm focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-amber-400 text-sm font-serif block mb-1.5">密碼 *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="最少6位"
              className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-2.5 text-amber-100 placeholder:text-amber-800/50 font-serif text-sm focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-xs font-serif bg-rose-950/30 border border-rose-800/40 rounded p-2">
              {error}
            </p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-serif font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "處理中…" : "免費註冊"}
          </button>
        </div>

        <p className="text-center text-amber-600/50 text-sm font-serif">
          已有帳戶？{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300">
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
