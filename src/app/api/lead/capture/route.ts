import { NextRequest, NextResponse } from "next/server";
import { getOrCreateLeadByEmail, isValidLeadEmail, normalizeLeadEmail } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !isValidLeadEmail(email)) {
      return NextResponse.json({ ok: false, error: "請輸入有效電郵" }, { status: 400 });
    }

    const normalizedEmail = normalizeLeadEmail(email);
    const lead = await getOrCreateLeadByEmail(normalizedEmail);
    const freeLimit = Number(lead.free_limit ?? 3);
    const used = Number(lead.usage_count ?? 0);
    const remaining = Math.max(0, freeLimit - used);

    return NextResponse.json({
      ok: true,
      data: {
        email: normalizedEmail,
        remaining,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "伺服器錯誤" }, { status: 500 });
  }
}
