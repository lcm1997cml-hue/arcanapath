import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateReadingPaid } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook env missing" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(secret);

  try {
    const payload = await req.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const readingId = session.metadata?.readingId;
      const paidPlan = session.metadata?.plan;
      if (readingId) {
        const normalizedPlan =
          paidPlan === "19" || paidPlan === "39" || paidPlan === "88" ? paidPlan : undefined;
        await updateReadingPaid(readingId, true, normalizedPlan);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/stripe/webhook] error:", error);
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }
}
