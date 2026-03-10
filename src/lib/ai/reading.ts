// =============================================================
// src/lib/ai/reading.ts
// Legacy-compatible AI reading engine with upgraded persona.
// =============================================================

import { nanoid } from "nanoid";
import type { DrawnCard, Topic, ReadingResult } from "@/types/reading";
import { normalizeResult } from "@/lib/reading/normalize";

export type QuestionType = "love" | "career" | "money" | "life";

const LOVE_KEYWORDS = [
  "出軌", "偷食", "忠誠", "感情", "關係", "男朋友", "女朋友", "伴侶", "第三者", "曖昧", "分手",
  "復合", "結婚", "拍拖", "真心", "鍾意我", "喜歡我", "愛情",
];

const CAREER_KEYWORDS = [
  "工作", "轉工", "升職", "事業", "老闆", "公司", "創業", "見工", "面試", "前途", "職場",
  "發展", "辭職", "合作",
];

const MONEY_KEYWORDS = [
  "財運", "金錢", "收入", "賺錢", "投資", "生意", "偏財", "正財", "回報", "資產", "股票",
  "crypto", "加密貨幣", "錢途", "財務",
];

const TAROT_MASTER_PERSONA = `你是一名有15年經驗的塔羅占卜師，長期為客人解讀感情、事業、財運與人生問題。
你說話自然、像真人，不像機械式AI。你會根據客人的問題核心來解牌，不會只做抽象牌義說明。

你的風格：
- 有洞察力
- 直接但不粗俗
- 會指出盲點
- 重視問題本身
- 用繁體中文
- 帶少少香港口語感，但不要俗氣
- 不空泛、不官腔、不講放諸四海皆準的廢話

最重要規則：
- 每段都要連回客人的問題
- 不可以只解釋牌義
- 不可以只講 generic 正能量
- 要有「真人塔羅師傅在解牌」的感覺
- 不要講以下空泛句式：你有資源要相信自己、你要保持正面、宇宙會帶領你、順其自然就好
- 必須先直接回答問題，再做分析
- 回覆必須是純 JSON，不要 markdown。`;

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w.toLowerCase()));
}

// 新增函數：detectQuestionType
export function detectQuestionType(question: string): QuestionType {
  const q = question.toLowerCase();
  if (includesAny(q, LOVE_KEYWORDS)) return "love";
  if (includesAny(q, CAREER_KEYWORDS)) return "career";
  if (includesAny(q, MONEY_KEYWORDS)) return "money";
  return "life";
}

function cardLines(cards: DrawnCard[]): string {
  return cards
    .map((dc, i) => {
      const orientation = dc.reversed ? "逆位" : "正位";
      const meaning = dc.reversed ? dc.card.meaning_reversed : dc.card.meaning_upright;
      const keywords = (dc.reversed ? dc.card.keywords_reversed : dc.card.keywords).join("、");
      return `第${i + 1}張（${dc.position}）：${dc.card.name_zh}（${orientation}）
- 牌義：${meaning}
- 關鍵詞：${keywords}`;
    })
    .join("\n");
}

function baseOutputSchema() {
  return `請嚴格按以下 JSON 格式回覆（所有欄位必填）：
{
  "directAnswer": "【塔羅結論】先直接回答問題，1-2句，明確有判斷",
  "freeReading": {
    "headline": "【牌面所說】先一句直接答問題，再補1-2句原因或背景（總長建議2-3句）",
    "mainAxis": "【整體解讀】完整分析，建議6-9句；必須緊扣問題、交代關鍵矛盾、盲點與目前局勢",
    "cardReadings": [
      { "position": "過去", "cardName": "牌名", "interpretation": "4-6句；講清楚這張牌在『過去位』如何形成現在問題根源" },
      { "position": "現在", "cardName": "牌名", "interpretation": "4-6句；講清楚當下核心拉扯、對方/環境狀態與風險" },
      { "position": "未來", "cardName": "牌名", "interpretation": "4-6句；講清楚若維持現況與若作出改變的兩種走向" }
    ],
    "nextStep": "【下一步】2-4句，具體、可執行、有次序，避免口號"
  },
  "coreReminder": "【核心提醒】1-2句，尖銳但不粗俗，點出最應面對的真相",
  "deepReading": {
    "psychologicalBreakdown": "深層心理或局勢拆解（建議10-14句，付費重點，需有層次）",
    "hiddenTruth": "牌面背後真相（建議8-12句，包含對方視角與外在因素）",
    "actionAdvice": "具體行動建議（建議5步，每步1-2句，包含先後次序與風險提示）",
    "hardQuestion": "最應該面對的核心問題"
  },
  "timelineReport": {
    "shortTerm": "1-4週（建議4-6句）",
    "midTerm": "1-3個月（建議4-6句）",
    "longTerm": "3個月以上（建議4-6句）"
  },
  "qaBonus": [
    { "question": "延伸問題1", "answer": "回答1（3-5句）" },
    { "question": "延伸問題2", "answer": "回答2（3-5句）" },
    { "question": "延伸問題3", "answer": "回答3（3-5句）" }
  ]
}

加長規則（務必遵守）：
1) 免費可見內容（freeReading）要比一般短答完整，但仍保持可快速閱讀。
2) 付費區內容（deepReading + timelineReport + qaBonus）必須比免費區明顯更深入，至少達到3-5倍資訊量與分析層次。
3) 每段都必須連回客人原問題，不可只講牌義翻譯。
4) 避免與前一次完全相同句式，保持師傅風格下的自然變化。`;
}

// 新增函數：loveReadingPrompt
export function loveReadingPrompt(question: string, cards: DrawnCard[]): string {
  return `${TAROT_MASTER_PERSONA}

主題：感情
客人問題：${question}
三張牌：
${cardLines(cards)}

請重點分析：
- 對方是否有隱瞞
- 是否有誘惑或第三者跡象
- 信任程度
- 對方真實想法
- 這段關係最核心問題
- 未來走向
- 應該繼續投入、觀察、攤牌，還是抽身

如果問題是「佢有冇出軌」或同類，唔好逃避回答。即使唔能100%斷言，都要按牌面直說：
- 暫時未見明顯背叛牌象，或
- 關係中有隱瞞與不透明，或
- 誘惑很重，需要提高警覺。

寫作深度要求：
- 免費可見部分要夠完整，不可只得幾句空話。
- 深度區請詳細分析「隱瞞來源、互動證據、信任裂痕如何累積、未來分岔」。
- 第一段必須是【塔羅結論】，直接回答問題（例如忠誠、隱瞞、誘惑風險高低）。

${baseOutputSchema()}`;
}

// 新增函數：careerReadingPrompt
export function careerReadingPrompt(question: string, cards: DrawnCard[]): string {
  return `${TAROT_MASTER_PERSONA}

主題：事業
客人問題：${question}
三張牌：
${cardLines(cards)}

請重點分析：
- 現在工作狀況是否值得繼續
- 轉工/升職/出手時機
- 有沒有新機會正在成形
- 目前阻力是什麼
- 應主動還是觀望
- 未來1-3個月走勢
- 這次決定對長遠發展是否有利

語氣像師傅幫客人睇前路，不是HR顧問口吻。

寫作深度要求：
- 免費可見部分要清晰交代核心判斷與當下重點。
- 深度區要具體寫清楚：時機、阻力來源、若不行動的成本、若行動的代價與回報。
- 第一段必須是【塔羅結論】，直接回答工作/機會/發展判斷。

${baseOutputSchema()}`;
}

// 新增函數：moneyReadingPrompt
export function moneyReadingPrompt(question: string, cards: DrawnCard[]): string {
  return `${TAROT_MASTER_PERSONA}

主題：財運
客人問題：${question}
三張牌：
${cardLines(cards)}

請重點分析：
- 財運整體走勢
- 現在是否適合投資/冒險
- 有沒有眼前機會
- 有否風險、過度樂觀或資金漏洞
- 屬偏財、正財，還是保守累積型
- 短期財務壓力
- 長線是否值得投入

涉及投資時，要回答時機是否成熟、是否值得出手、是否應保守。

寫作深度要求：
- 免費可見部分要講清短線判斷。
- 深度區要完整拆解風險結構：資金漏洞、錯判來源、節奏控制、短中長線策略差異。
- 第一段必須是【塔羅結論】，直接回答投資/風險/財運判斷。

${baseOutputSchema()}`;
}

// 新增函數：lifeReadingPrompt
export function lifeReadingPrompt(question: string, cards: DrawnCard[]): string {
  return `${TAROT_MASTER_PERSONA}

主題：人生方向
客人問題：${question}
三張牌：
${cardLines(cards)}

請重點分析：
- 客人目前人生卡在哪裡
- 最需要看清的核心課題
- 是否該做出改變
- 真正盲點在哪裡
- 現階段應向內整理還是向外推進
- 下一步最重要行動方向

回答要有深度，像師傅真的看見客人當下狀態。

寫作深度要求：
- 免費可見部分要指出核心卡點與方向。
- 深度區要講透：卡點成因、盲點、改變門檻、具體過渡步驟。
- 第一段必須是【塔羅結論】，直接回答是否應改變、向內整理或向外推進。

${baseOutputSchema()}`;
}

const STYLE_VARIATIONS = [
  "開場先俾一句判斷，再拆解原因。",
  "先點出客人最容易忽略的盲點，再講牌面脈絡。",
  "先交代結論，再說明過去-現在-未來的推進邏輯。",
  "先回應問題核心，再提出一個可執行的轉向。",
];

function selectPrompt(
  question: string,
  cards: DrawnCard[]
): { type: QuestionType; prompt: string; templateName: string } {
  const type = detectQuestionType(question);
  const variation = STYLE_VARIATIONS[Math.floor(Math.random() * STYLE_VARIATIONS.length)];
  if (type === "love") {
    return { type, templateName: "loveReadingPrompt", prompt: `${loveReadingPrompt(question, cards)}\n\n風格變化要求：${variation}` };
  }
  if (type === "career") {
    return { type, templateName: "careerReadingPrompt", prompt: `${careerReadingPrompt(question, cards)}\n\n風格變化要求：${variation}` };
  }
  if (type === "money") {
    return { type, templateName: "moneyReadingPrompt", prompt: `${moneyReadingPrompt(question, cards)}\n\n風格變化要求：${variation}` };
  }
  return { type, templateName: "lifeReadingPrompt", prompt: `${lifeReadingPrompt(question, cards)}\n\n風格變化要求：${variation}` };
}

function mockByType(question: string, cards: DrawnCard[], type: QuestionType): Record<string, unknown> {
  const [c0, c1, c2] = cards;
  const q = question.toLowerCase();
  const directAnswerMap: Record<QuestionType, string> = {
    love: "以這組牌看，關係裡有不透明位，現階段要先查清忠誠與邊界，再決定是否繼續投入。",
    career: "以這組牌看，你宜主動調整工作策略，短期內有機會，但唔適合繼續被動等。",
    money: "以這組牌看，現階段可布局但不宜重倉，投資要先控風險再追回報。",
    life: "以這組牌看，你需要做方向性改變，先停止內耗，再用小步行動打開新路。",
  };
  if (type === "love" && (q.includes("出軌") || q.includes("偷食") || q.includes("第三者"))) {
    directAnswerMap.love = "以這組牌看，暫未到可斷言出軌的程度，但關係中有隱瞞與誘惑訊號，需要提高警覺並盡快釐清。";
  }
  const headlineMap: Record<QuestionType, string> = {
    love: "你真正要面對的，是信任裂痕，不是表面互動。",
    career: "你卡住唔係冇機會，而係未肯落決定。",
    money: "眼前有機會，但唔適合情緒化重注。",
    life: "你知道方向，只係一直用猶豫拖延行動。",
  };
  const mainAxisMap: Record<QuestionType, string> = {
    love: `你問「${question}」，牌面唔係叫你猜對方，而係叫你看清關係透明度。${c1?.card.name_zh}喺現在位，重點係你哋而家互信係升緊定跌緊。`,
    career: `你問「${question}」，牌面顯示真正阻力在於決策遲緩。${c0?.card.name_zh}到${c2?.card.name_zh}的走向，代表短期內會有窗口，但你要主動先捉到。`,
    money: `你問「${question}」，牌面指向「可做但要控風險」。依家唔係盲衝位，係策略位；先守本金，再逐步放大。`,
    life: `你問「${question}」，三張牌都指向同一點：你唔係冇方向，而係未肯承擔轉變帶來的不確定。`,
  };
  const coreReminderMap: Record<QuestionType, string> = {
    love: "你而家最需要的不是安全感幻想，而是真相。",
    career: "你再拖，代價會比你想像中大。",
    money: "賺錢靠紀律，不靠一口氣。",
    life: "你一直等的訊號，其實就係你自己。",
  };

  return {
    directAnswer: directAnswerMap[type],
    freeReading: {
      headline: headlineMap[type],
      mainAxis: `${mainAxisMap[type]} 你而家最需要的不是再收集更多感覺，而是把焦點放回你真正想要的結果。牌面已經指出重點：你要面對的是一個決定，而不是一個想像。再拖下去，局面只會按舊模式重複。`,
      cardReadings: [
        {
          position: c0?.position ?? "過去",
          cardName: c0?.card.name_zh ?? "未知",
          interpretation: `${c0?.reversed ? c0.card.meaning_reversed : c0?.card.meaning_upright ?? "過去訊息不足"} 這張牌放在過去位，重點不是回顧歷史，而是指出你一直沿用的反應模式。這個模式如果不調整，會把你再次帶回同樣的問題現場。`,
        },
        {
          position: c1?.position ?? "現在",
          cardName: c1?.card.name_zh ?? "未知",
          interpretation: `${c1?.reversed ? c1.card.meaning_reversed : c1?.card.meaning_upright ?? "現在訊息不足"} 現在位代表你此刻最真實的處境：你需要先承認當下正在發生什麼，再決定下一步。若你仍以舊方法處理，局勢會繼續停在消耗而非推進。`,
        },
        {
          position: c2?.position ?? "未來",
          cardName: c2?.card.name_zh ?? "未知",
          interpretation: `${c2?.reversed ? c2.card.meaning_reversed : c2?.card.meaning_upright ?? "未來訊息不足"} 未來位不是定案，而是趨勢。你如果保持現有節奏，會走向一條較被動的路；若你改變處理方式，走勢會出現明顯分岔。`,
        },
      ],
      nextStep: `核心提醒：${coreReminderMap[type]} 下一步：先寫低你最不能接受的底線，再於72小時內做一個具體行動去驗證現實（例如對話、提交、調整資金、或停止一個無效投入）。完成後用結果而非情緒評估下一步。`,
    },
    deepReading: {
      psychologicalBreakdown:
        "你而家最核心的心理機制，是用「再想清楚一點」去延後承擔決定成本。這不是你不聰明，而是你對失敗後果估算過高，對行動後可修正性估算過低。牌面顯示你已經連續幾次走進同一個循環：先觀望、再內耗、再自我說服、最後回到原點。你表面上在等待更好時機，實際上是在等待一個能保證不出錯的局面。問題是這種局面幾乎不會出現，所以你只會愈等愈重。真正要改的不是目標，而是你處理不確定性的方式。當你願意先行一小步，你會發現風險沒有你想像咁不可控。這就是牌面一直要你面對的課題：用行動換清晰，不要用猜測換安心。",
      hiddenTruth:
        "牌面背後的真相，是局勢並非完全卡死，而是資訊不對稱。你手上其實有足夠線索，但你一直希望先得到「完整答案」才行動，結果反而讓自己更被動。對方或外在環境的狀態，未必如你表面理解那麼單一；更可能是多股力量同時存在：一部分推進、一部分拖慢。你目前最容易誤判的位置，在於把短期波動當成長期結論。牌面提醒你：現在最重要不是追求一次看透全部，而是先釐清最關鍵的20%訊號。當你抓到這20%，你後續70%-80%的決策會自然清楚。簡單講，真相不是不存在，而是你要改用更務實的方式去讀它。",
      actionAdvice:
        "第一步：界線先行。今日內寫下三條不可退讓底線，分別對應關係/工作/金錢/生活（按你問題主題）。第二步：在48-72小時內做一次低成本驗證行動，目的不是求完美，而是拿真實回饋。第三步：把回饋分成「可控」與「不可控」，只對可控部分設下一輪行動。第四步：設定一個一週檢視點，按結果調整，不再憑情緒加碼。第五步：若同一阻力連續出現三次，視為結構性問題，改策略而非硬撐。",
      hardQuestion: "你係真係未準備好，定其實只係唔想承擔改變嘅代價？",
    },
    timelineReport: {
      shortTerm:
        "1-4週：你會遇到一個迫你表態的情境，通常不是大事件，而是連續幾個小訊號疊加。若你保持觀望，壓力會慢慢上升；若你主動釐清，局勢會開始分流。這段時間重點是收集高價值訊號，而不是追求一次定生死。",
      midTerm:
        "1-3個月：這段是轉向期。你前面做的第一輪行動，會在此時顯示真實效果。若你有按節奏修正，方向會逐步變清楚；若你回到舊模式，困局會再固化。中期勝負不在運氣，而在你是否持續執行。",
      longTerm:
        "3個月以上：長線結果主要取決於你是否建立新習慣，而非一次爆發。若你能穩定執行「驗證—調整—再行動」循環，局勢會由被動轉主動。相反，如果你只在焦慮高峰時短衝，最終仍會回到原位。",
    },
    qaBonus: [
      {
        question: "我而家最應該做咩？",
        answer: "先做一件可在72小時內完成的實際動作，重點是拿回饋而非求完美。你缺的不是更多想法，而是第一手結果。只要第一步落地，後面判斷會清楚得多。",
      },
      {
        question: "要觀望定出手？",
        answer: "可以出手，但要先定邊界再行動。你應該用小步測試，而不是一次押注。觀望太久會令你喪失窗口；盲衝則會放大錯判，兩者都不可取。",
      },
      {
        question: "點樣知道自己係咪行錯？",
        answer: "看三件事：投入後是否更清晰、是否更可控、是否更接近你底線要求。若三項持續惡化，就不是短期波動，而是方向錯配。那時候要調整策略，而非只加大努力。",
      },
    ],
  };
}

async function callOpenAI(prompt: string): Promise<Record<string, unknown>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.78,
      max_tokens: 2400,
      messages: [
        { role: "system", content: TAROT_MASTER_PERSONA },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as Record<string, unknown>;
}

type GenerateReadingOpts = {
  id?: string;
  question: string;
  topic?: Topic;
  cards: DrawnCard[];
  userId?: string | null;
};

function normalizeArgs(
  questionOrOpts: string | GenerateReadingOpts,
  topicArg?: Topic,
  cardsArg?: DrawnCard[],
  userIdArg?: string | null
): Required<GenerateReadingOpts> {
  if (typeof questionOrOpts === "string") {
    return {
      id: nanoid(12),
      question: questionOrOpts,
      topic: topicArg ?? "life",
      cards: cardsArg ?? [],
      userId: userIdArg ?? null,
    };
  }
  return {
    id: questionOrOpts.id ?? nanoid(12),
    question: questionOrOpts.question,
    topic: questionOrOpts.topic ?? "life",
    cards: questionOrOpts.cards,
    userId: questionOrOpts.userId ?? null,
  };
}

// Legacy + current compatible signature
export async function generateReading(
  questionOrOpts: string | GenerateReadingOpts,
  topicArg?: Topic,
  cardsArg?: DrawnCard[],
  userIdArg?: string | null
): Promise<ReadingResult> {
  const { id, question, topic, cards, userId } = normalizeArgs(
    questionOrOpts,
    topicArg,
    cardsArg,
    userIdArg
  );

  const useMock = !process.env.OPENAI_API_KEY || process.env.USE_MOCK_AI === "true";
  const { type, prompt, templateName } = selectPrompt(question, cards);
  console.log("QUESTION TYPE:", type);
  console.log("PROMPT TEMPLATE:", templateName);

  let raw: Record<string, unknown>;
  try {
    raw = useMock ? mockByType(question, cards, type) : await callOpenAI(prompt);
  } catch (err) {
    console.error("[ai/reading] falling back to mock:", err);
    raw = mockByType(question, cards, type);
  }

  // coreReminder is intentionally merged into nextStep for current UI schema compatibility.
  const coreReminder =
    typeof raw.coreReminder === "string" && raw.coreReminder.trim().length > 0
      ? raw.coreReminder.trim()
      : "";
  if (coreReminder && raw.freeReading && typeof raw.freeReading === "object") {
    const fr = raw.freeReading as Record<string, unknown>;
    const existingNext = typeof fr.nextStep === "string" ? fr.nextStep : "";
    fr.nextStep = existingNext
      ? `核心提醒：${coreReminder}\n${existingNext}`
      : `核心提醒：${coreReminder}`;
  }

  if (raw.freeReading && typeof raw.freeReading === "object") {
    const fr = raw.freeReading as Record<string, unknown>;
    const directAnswer =
      typeof raw.directAnswer === "string" && raw.directAnswer.trim().length > 0
        ? raw.directAnswer.trim()
        : "";
    const existingHeadline =
      typeof fr.headline === "string" && fr.headline.trim().length > 0 ? fr.headline.trim() : "";

    if (directAnswer) {
      fr.headline = existingHeadline
        ? `塔羅結論：${directAnswer}\n牌面所說：${existingHeadline}`
        : `塔羅結論：${directAnswer}`;
    } else if (existingHeadline && !existingHeadline.startsWith("塔羅結論：")) {
      fr.headline = `塔羅結論：${existingHeadline}`;
    }
  }

  return normalizeResult(raw, cards, {
    id,
    question,
    topic,
    userId,
  });
}
