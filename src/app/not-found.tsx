// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white px-4 text-center"
      style={{ background: "linear-gradient(160deg, #0d0518 0%, #1a0a2e 50%, #0d0518 100%)" }}
    >
      <div className="text-amber-600/30 text-8xl mb-6">☽</div>
      <h1 className="text-amber-300 font-serif text-3xl font-semibold mb-3">
        找不到此頁面
      </h1>
      <p className="text-amber-600/50 font-serif text-sm mb-8">
        可能是占卜結果已過期，或連結有誤。
      </p>
      <Link
        href="/reading"
        className="bg-amber-700 hover:bg-amber-600 text-white font-serif font-semibold py-3 px-8 rounded-lg transition-colors"
      >
        重新占卜
      </Link>
    </div>
  );
}
