// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI塔羅牌占卜｜免費塔羅解讀｜ArcanaPath",
  description: "ArcanaPath AI塔羅占卜，免費三張牌解讀，深入分析愛情、事業與未來方向。輸入問題，即時獲得專業塔羅牌解讀。",
  keywords: "塔羅牌,塔羅占卜,AI塔羅,塔羅解讀,免費塔羅,愛情塔羅",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Noto+Serif+TC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
