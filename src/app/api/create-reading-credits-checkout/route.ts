import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

const CHECKOUT_KIND = "reading_credits";
const USD_CENTS = 900; // US$9.00

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: "Stripe secret key not configured" }, { status: 500 });
    }

    const VISITOR_COOKIE = "arcana_visitor_id";
    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
    if (!visitorId) visitorId = nanoid(18);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arcanapath-two.vercel.app";
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: USD_CENTS,
            product_data: {
              name: "ArcanaPath · 3 次占卜額度",
              description: "額外 3 次塔羅占卜（不影響完整報告解鎖）",
            },
          },
        },
      ],
      metadata: {
        checkoutKind: CHECKOUT_KIND,
        visitorId,
      },
      success_url: `${appUrl}/reading?credits=1`,
      cancel_url: `${appUrl}/reading`,
    });

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "Failed to create checkout URL" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true, url: session.url });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch (error) {
    console.error("[/api/create-reading-credits-checkout]", error);
    return NextResponse.json({ ok: false, error: "Failed to create checkout session" }, { status: 500 });
  }
}
