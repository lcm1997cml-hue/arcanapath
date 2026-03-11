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
    console.log("[stripe webhook] event received", { type: event.type });

    if (event.type === "checkout.session.completed") {
      console.log("[stripe webhook] checkout.session.completed");
      const session = event.data.object as Stripe.Checkout.Session;
      const readingId = session.metadata?.readingId;
      const plan = session.metadata?.plan;
      console.log("[stripe webhook] readingId", readingId ?? null);
      console.log("[stripe webhook] plan", plan ?? null);

      if (!readingId) {
        console.error("[stripe webhook] update failed", { reason: "missing readingId" });
        return NextResponse.json({ ok: false, error: "missing readingId in metadata" }, { status: 400 });
      }

      if (plan !== "19" && plan !== "39" && plan !== "88") {
        console.error("[stripe webhook] update failed", { reason: "invalid plan", plan });
        return NextResponse.json({ ok: false, error: "invalid plan in metadata" }, { status: 400 });
      }

      try {
        await updateReadingPaid(readingId, plan);
        console.log("[stripe webhook] update success", { readingId, plan });
      } catch (updateErr) {
        console.error("[stripe webhook] update failed", updateErr);
        return NextResponse.json({ ok: false, error: "failed to update reading payment status" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/stripe/webhook] error:", error);
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }
}
