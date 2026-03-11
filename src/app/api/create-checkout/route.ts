import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_CONFIG: Record<string, { amount: number; label: string }> = {
  "19": { amount: 1900, label: "基本完整解讀" },
  "39": { amount: 3900, label: "深入分析" },
  "88": { amount: 8800, label: "完整 AI 深度解讀" },
};

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: "Stripe secret key not configured" }, { status: 500 });
    }

    const body = (await req.json()) as { readingId?: string; plan?: string | number };
    const readingId = typeof body.readingId === "string" ? body.readingId.trim() : "";
    const plan = String(body.plan ?? "");

    if (!readingId) {
      return NextResponse.json({ ok: false, error: "readingId is required" }, { status: 400 });
    }
    if (!PLAN_CONFIG[plan]) {
      return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
    }

    const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://arcanapath-two.vercel.app";

const stripe = new Stripe(secretKey);

const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      quantity: 1,
      price_data: {
        currency: "hkd",
        unit_amount: PLAN_CONFIG[plan].amount,
        product_data: {
          name: "ArcanaPath Tarot Reading",
        },
      },
    },
  ],
  metadata: {
    readingId,
    plan,
  },
  success_url: `${appUrl}/result/${readingId}?paid=true&plan=${plan}`,
  cancel_url: `${appUrl}/result/${readingId}`,
});

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "Failed to create checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("[/api/create-checkout] error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create checkout session" }, { status: 500 });
  }
}
