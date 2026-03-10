# ArcanaPath – 完整架構文件

> AI 塔羅解讀 SaaS · Next.js App Router · TypeScript · Tailwind CSS

---

## 1. 整體架構設計

### 系統概覽

```
用戶 → 首頁(/) → 占卜(/reading) → API(/api/reading) → 結果(/result/[id])
                                          ↓
                                    付費牆(/paywall) → 解鎖深度報告
```

### 頁面架構

| 路由 | 權限 | 功能 |
|------|------|------|
| `/` | 全部 | 首頁、導引 |
| `/reading` | 全部 | 完整抽牌流程 |
| `/result/[id]` | 全部 | 結果展示、paywall |
| `/paywall` | 全部 | 付費解鎖頁面 |
| `/login` | 未登入 | 登入 |
| `/register` | 未登入 | 註冊 |
| `/dashboard` | Member/Admin | 歷史記錄、使用統計 |
| `/admin` | Admin only | 用戶管理後台 |

### API 架構

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/reading` | POST | 生成占卜解讀 |
| `/api/result/[id]` | GET | 獲取結果（按權限過濾） |
| `/api/admin/users` | GET/POST/PATCH | 用戶管理 |
| `/api/auth/login` | POST | 登入 |
| `/api/auth/logout` | POST | 登出 |

### Component 架構

```
components/
├── TarotCard.tsx          # 塔羅牌視覺元件（支援翻牌、逆位、image fallback）
└── ReadingSections.tsx    # 結果展示（免費 + 付費 + paywall CTA）

app/
├── layout.tsx             # Root layout
├── page.tsx               # 首頁
├── reading/page.tsx       # 占卜流程（input → shuffle → select → preview → API）
├── result/[id]/page.tsx   # 結果展示
├── paywall/page.tsx       # 付費解鎖
├── login/page.tsx         # 登入
├── register/page.tsx      # 註冊
├── dashboard/page.tsx     # 會員後台
└── admin/page.tsx         # 管理員後台
```

---

## 2. TypeScript 資料 Schema

### 核心類型

```typescript
// 塔羅牌數據
interface TarotCardData {
  id: number;
  name: string;          // 英文名
  name_zh: string;       // 中文名
  arcana: "major" | "minor";
  suit?: string;
  number: number;
  image: string;         // 檔案名，如 "RWS1909_-_00_Fool.jpeg"
  keywords: string[];
  keywords_reversed: string[];
  meaning_upright: string;
  meaning_reversed: string;
  description: string;
}

// 抽到的牌（含位置和正逆）
interface DrawnCard {
  card: TarotCardData;
  position: string;      // "過去" / "現在" / "未來"
  reversed: boolean;
}

// 占卜請求
interface ReadingRequest {
  question: string;
  topic: "love" | "career" | "wealth" | "life";
  cards: DrawnCard[];    // 3張
  userId?: string;
}

// 免費解讀（永遠展示）
interface FreeReading {
  headline: string;          // 一句直接結論
  mainAxis: string;          // 整體主軸
  cardReadings: {
    position: string;
    cardName: string;
    interpretation: string;
  }[];
  wakeUpLine: string;        // 屌醒位
  nextStep: string;          // 下一步建議
}

// 深度解讀（付費解鎖）
interface DeepReading {
  psychologicalBreakdown: string;
  hiddenTruth: string;
  actionAdvice: string;
  hardQuestion: string;
}

// 時間線（付費解鎖）
interface TimelineReport {
  shortTerm: string;    // 1-4週
  midTerm: string;      // 1-3個月
  longTerm: string;     // 3個月以上
}

// 完整結果
interface ReadingResult {
  id: string;
  createdAt: string;
  question: string;
  topic: Topic;
  cards: DrawnCard[];
  freeReading: FreeReading;
  deepReading?: DeepReading;       // 付費解鎖
  timelineReport?: TimelineReport; // 付費解鎖
  qaBonus?: QaBonus[];             // 付費解鎖
  isPaid: boolean;
  userId?: string;
}

// 用戶角色與限制
type UserRole = "visitor" | "member" | "admin";

const ROLE_LIMITS = {
  visitor: { daily: 1,  canSeeHistory: false, showPaywall: true },
  member:  { daily: 3,  canSeeHistory: true,  showPaywall: true },
  admin:   { daily: -1, canSeeHistory: true,  showPaywall: false }, // -1 = unlimited
};
```

---

## 3. 完整檔案結構

```
arcanapath/
├── .env.local                          # 環境變數（不上傳 git）
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   └── cards/
│       └── rws1909/
│           ├── RWS1909_-_00_Fool.jpeg
│           ├── RWS1909_-_01_Magician.jpeg
│           └── ... (78 cards)
│
└── src/
    ├── types/
    │   └── index.ts                    # 所有 TypeScript 類型定義
    │
    ├── lib/
    │   ├── tarot/
    │   │   ├── deck.json               # 78張牌數據
    │   │   └── utils.ts                # shuffle / draw / serialize
    │   ├── ai/
    │   │   └── reading.ts              # AI prompt + mock + live OpenAI
    │   ├── store.ts                    # In-memory store（mock DB）
    │   └── auth.ts                     # Session / 權限工具
    │
    ├── components/
    │   ├── TarotCard.tsx               # 塔羅牌元件
    │   └── ReadingSections.tsx         # 結果展示元件
    │
    └── app/
        ├── globals.css
        ├── layout.tsx
        ├── not-found.tsx
        ├── page.tsx                    # 首頁
        │
        ├── reading/
        │   └── page.tsx                # 完整占卜流程
        │
        ├── result/
        │   └── [id]/
        │       └── page.tsx            # 結果展示
        │
        ├── paywall/
        │   └── page.tsx
        │
        ├── login/
        │   └── page.tsx
        │
        ├── register/
        │   └── page.tsx
        │
        ├── dashboard/
        │   └── page.tsx
        │
        ├── admin/
        │   └── page.tsx
        │
        └── api/
            ├── reading/
            │   └── route.ts
            ├── result/
            │   └── [id]/
            │       └── route.ts
            ├── admin/
            │   └── users/
            │       └── route.ts
            └── auth/
                ├── login/
                │   └── route.ts
                └── logout/
                    └── route.ts
```

---

## 4. Auth 架構建議

### 目前（MVP / Mock）
- Cookie-based session（base64 encoded userId）
- 用戶存在 in-memory store
- 足夠本地開發和展示

### 生產推薦：**Clerk**

**選擇原因：**
1. Next.js App Router 原生支援（`@clerk/nextjs`）
2. Middleware 一行搞定路由保護
3. 內建登入/註冊 UI，唔使自己寫
4. `publicMetadata.role` 存儲角色
5. 支援社交登入（Google / Apple）
6. Free tier 足夠 MVP
7. Webhook 支援用戶生命週期

**遷移方式：**
```typescript
// 只需替換 src/lib/auth.ts 裡的 getCurrentUser()
import { currentUser } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.emailAddresses[0].emailAddress,
    role: (user.publicMetadata?.role as UserRole) ?? "member",
    // ...
  };
}
```

---

## 5. 接 Live OpenAI API

1. 在 `.env.local` 設置：
   ```
   OPENAI_API_KEY=sk-proj-xxxx
   USE_MOCK_AI=false
   ```

2. `src/lib/ai/reading.ts` 已包含完整 OpenAI 呼叫邏輯。

3. 使用 `gpt-4o` 模型，temperature 0.85，max_tokens 2000。

4. Prompt 已設計成：
   - 系統 prompt：設定語氣（直接、帶狠、香港繁體中文）
   - 用戶 prompt：包含問題、主題、三張牌
   - 回覆格式：純 JSON，包含 freeReading / deepReading / timelineReport / qaBonus

5. 如需更換模型：
   ```typescript
   // 在 src/lib/ai/reading.ts 修改：
   model: "gpt-4o",        // 最佳效果
   // model: "gpt-4o-mini", // 更快更便宜
   ```

---

## 6. 生產部署 Checklist

### 必須完成才能上線：

- [ ] 替換 in-memory store 為真實 DB（Supabase / PlanetScale / Neon）
- [ ] 整合 Clerk 做正式 Auth
- [ ] 整合 Stripe 做付款
- [ ] 設置 Vercel / Railway 部署
- [ ] 設置環境變數（OPENAI_API_KEY, DATABASE_URL, etc.）
- [ ] 加入 rate limiting（Upstash Redis）
- [ ] 加入錯誤監控（Sentry）

---

## 7. Cursor 覆蓋順序 Checklist

**按此順序覆蓋/創建檔案，確保依賴順序正確：**

### 第一批：基礎設定
- [ ] 1. `package.json` — 確認 dependencies
- [ ] 2. `tsconfig.json` — TypeScript 配置
- [ ] 3. `tailwind.config.ts` — Tailwind 設定
- [ ] 4. `postcss.config.mjs` — PostCSS
- [ ] 5. `next.config.ts` — Next.js 設定
- [ ] 6. `.env.local` — 環境變數（新建，不覆蓋 git）

### 第二批：類型定義
- [ ] 7. `src/types/index.ts` — 所有 TypeScript 類型

### 第三批：核心 lib
- [ ] 8. `src/lib/tarot/deck.json` — 牌組數據
- [ ] 9. `src/lib/tarot/utils.ts` — 洗牌/抽牌工具
- [ ] 10. `src/lib/store.ts` — In-memory store
- [ ] 11. `src/lib/auth.ts` — Auth 工具
- [ ] 12. `src/lib/ai/reading.ts` — AI 解讀生成器

### 第四批：API Routes
- [ ] 13. `src/app/api/auth/login/route.ts`
- [ ] 14. `src/app/api/auth/logout/route.ts`
- [ ] 15. `src/app/api/reading/route.ts`
- [ ] 16. `src/app/api/result/[id]/route.ts`
- [ ] 17. `src/app/api/admin/users/route.ts`

### 第五批：共用 Components
- [ ] 18. `src/components/TarotCard.tsx`
- [ ] 19. `src/components/ReadingSections.tsx`

### 第六批：頁面（按流程順序）
- [ ] 20. `src/app/globals.css`
- [ ] 21. `src/app/layout.tsx`
- [ ] 22. `src/app/not-found.tsx`
- [ ] 23. `src/app/page.tsx` — 首頁
- [ ] 24. `src/app/reading/page.tsx` — 占卜流程 ⭐ 最重要
- [ ] 25. `src/app/result/[id]/page.tsx` — 結果展示 ⭐ 最重要
- [ ] 26. `src/app/paywall/page.tsx`
- [ ] 27. `src/app/login/page.tsx`
- [ ] 28. `src/app/register/page.tsx`
- [ ] 29. `src/app/dashboard/page.tsx`
- [ ] 30. `src/app/admin/page.tsx`

### 第七批：安裝依賴並測試
- [ ] 31. `npm install`
- [ ] 32. `npm run dev`
- [ ] 33. 測試流程：`/` → `/reading` → 完成抽牌 → `/result/[id]`
- [ ] 34. 測試登入：`admin@arcanapath.com` / 任何密碼 → `/admin`
- [ ] 35. 確認 Admin 睇 result 沒有 paywall
- [ ] 36. 確認 Visitor 睇 result 有 paywall

---

## 8. 常見問題排查

### Q: result 頁面白屏
**A:** 確認 `src/lib/store.ts` 的 `getReading()` 返回值，
    以及 `ReadingSections` 組件收到 result 非 null。
    `freeReading` 缺失會觸發 fallback 而非白屏。

### Q: 圖片載入失敗
**A:** `TarotCard` 已有 `onError` fallback 到文字展示。
    確認圖片放在 `public/cards/rws1909/` 且檔名與 deck.json 一致。

### Q: 抽牌後沒有 push 到 result
**A:** 確認 `/api/reading` POST 返回 `{ ok: true, data: { id: "..." } }`。
    可在 network tab 查看 response。

### Q: Admin 看不到後台
**A:** 先登入 `admin@arcanapath.com`，登入後 cookie 會有 `arcana_session`，
    `/admin` 頁面會 fetch `/api/admin/users`。

### Q: 如何切換到 live OpenAI
**A:** 在 `.env.local` 設 `OPENAI_API_KEY=sk-...` 並移除或設
    `USE_MOCK_AI=false`，然後重啟 dev server。
