import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addVisitorFreeCredits, updateReadingPaid } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook env missing" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed", error);
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    console.log("[stripe webhook] event received", { type: event.type });

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.checkoutKind === "reading_credits") {
      const visitorId = typeof meta.visitorId === "string" ? meta.visitorId.trim() : "";
      if (!visitorId) {
        console.error("[stripe webhook] reading credits failed", { reason: "missing visitorId" });
        return NextResponse.json({ ok: false, error: "missing visitorId" }, { status: 400 });
      }
      await addVisitorFreeCredits(visitorId, 3);
      console.log("[stripe webhook] reading credits +3 success", { visitorId: visitorId.slice(0, 6) + "…" });
      return NextResponse.json({ ok: true });
    }

    const readingId = meta.readingId;
    const plan = meta.plan;

    if (!readingId) {
      console.error("[stripe webhook] update failed", { reason: "missing readingId" });
      return NextResponse.json({ ok: false, error: "missing readingId in metadata" }, { status: 400 });
    }
    if (plan !== "19" && plan !== "39" && plan !== "88") {
      console.error("[stripe webhook] update failed", { reason: "invalid plan", plan });
      return NextResponse.json({ ok: false, error: "invalid plan in metadata" }, { status: 400 });
    }

    await updateReadingPaid(readingId, plan as "19" | "39" | "88");
    console.log("[stripe webhook] premium update success");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[stripe webhook] update failed", error);
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
