// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { AppUser, UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理員",
  member: "會員",
  visitor: "訪客",
};

export default function AdminPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [adding, setAdding] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.ok) setUsers(data.data);
      else setError(data.error);
    } catch {
      setError("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "toggleActive" }),
    });
    await fetchUsers();
  };

  const handleSetRole = async (userId: string, role: UserRole) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "setRole", role }),
    });
    await fetchUsers();
  };

  const handleAddUser = async () => {
    if (!newEmail) return;
    setAdding(true);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });
    setNewEmail("");
    setAdding(false);
    await fetchUsers();
  };

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
        <div className="text-amber-500/60 text-sm font-serif">後台管理</div>
        <Link href="/dashboard" className="text-amber-600/60 hover:text-amber-500 text-sm font-serif">
          返回
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "用戶總數", value: users.length },
            { label: "管理員", value: users.filter((u) => u.role === "admin").length },
            { label: "會員", value: users.filter((u) => u.role === "member").length },
            { label: "停用帳號", value: users.filter((u) => !u.isActive).length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-4 text-center"
            >
              <div className="text-amber-200 font-serif text-2xl font-semibold">{value}</div>
              <div className="text-amber-600/50 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Add user */}
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-5">
          <h3 className="text-amber-400 font-serif font-semibold mb-3">新增用戶</h3>
          <div className="flex gap-3 flex-wrap">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="電郵地址"
              className="flex-1 min-w-40 bg-black/30 border border-amber-800/40 rounded-lg px-3 py-2 text-amber-100 placeholder:text-amber-800/50 font-serif text-sm focus:outline-none focus:border-amber-600 transition-colors"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="bg-black/30 border border-amber-800/40 rounded-lg px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-600"
            >
              <option value="member">會員</option>
              <option value="admin">管理員</option>
              <option value="visitor">訪客</option>
            </select>
            <button
              onClick={handleAddUser}
              disabled={adding || !newEmail}
              className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-serif font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {adding ? "新增中…" : "新增"}
            </button>
          </div>
        </div>

        {/* User list */}
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 overflow-hidden">
          <div className="p-5 border-b border-amber-900/20">
            <h3 className="text-amber-400 font-serif font-semibold">用戶列表</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-amber-600/50 font-serif">載入中…</div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 font-serif">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-serif">
                <thead>
                  <tr className="border-b border-amber-900/20 text-amber-500/60 text-xs">
                    <th className="text-left p-3">用戶</th>
                    <th className="text-left p-3">角色</th>
                    <th className="text-center p-3">今日</th>
                    <th className="text-center p-3">總次數</th>
                    <th className="text-center p-3">狀態</th>
                    <th className="text-left p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors"
                    >
                      <td className="p-3">
                        <div className="text-amber-200">{u.name ?? "—"}</div>
                        <div className="text-amber-600/50 text-xs">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleSetRole(u.id, e.target.value as UserRole)}
                          className="bg-black/30 border border-amber-800/30 rounded px-2 py-1 text-amber-300 text-xs focus:outline-none"
                        >
                          <option value="admin">管理員</option>
                          <option value="member">會員</option>
                          <option value="visitor">訪客</option>
                        </select>
                      </td>
                      <td className="p-3 text-center text-amber-300">{u.dailyUsage}</td>
                      <td className="p-3 text-center text-amber-300">{u.totalUsage}</td>
                      <td className="p-3 text-center">
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded-full",
                            u.isActive
                              ? "bg-green-900/40 text-green-400"
                              : "bg-red-900/40 text-red-400",
                          ].join(" ")}
                        >
                          {u.isActive ? "啟用" : "停用"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className="text-amber-600/60 hover:text-amber-400 text-xs transition-colors"
                        >
                          {u.isActive ? "停用" : "啟用"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Prompt settings (mock) */}
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-5">
          <h3 className="text-amber-400 font-serif font-semibold mb-2">Prompt 設定</h3>
          <p className="text-amber-600/50 text-sm font-serif mb-3">
            調整 AI 解讀語氣與風格（即將推出）
          </p>
          <div className="space-y-2">
            {[
              { label: "語氣", value: "直接、帶少少狠、唔雞湯" },
              { label: "語言", value: "香港繁體中文" },
              { label: "免費版長度", value: "中等（400-600字）" },
              { label: "付費版長度", value: "完整（800-1200字）" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3 items-center">
                <span className="text-amber-500/60 text-xs w-24">{label}：</span>
                <span className="text-amber-300/70 text-xs bg-black/20 rounded px-2 py-1">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
