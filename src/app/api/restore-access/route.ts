import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isValidLeadEmail, normalizeLeadEmail, restoreAccessByEmailForVisitor } from "@/lib/store";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "arcana_visitor_id";
const LEAD_EMAIL_COOKIE = "arcana_lead_email";

export async function POST(req: NextRequest) {
  let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
  if (!visitorId) visitorId = nanoid(18);
  const resOk = NextResponse.json({ ok: true });
  resOk.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const raw = typeof body.email === "string" ? body.email.trim() : "";
    if (!raw || !isValidLeadEmail(raw)) {
      return resOk;
    }

    const normalizedEmail = normalizeLeadEmail(raw);
    const result = await restoreAccessByEmailForVisitor(visitorId, normalizedEmail);
    const res = NextResponse.json({
      ok: true,
      restored: result.restored,
      remainingFreeCount: result.remainingFreeCount,
      planAccess: result.planAccess,
      message: result.message,
    });
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    res.cookies.set(LEAD_EMAIL_COOKIE, normalizedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[/api/restore-access] full error:", err);
    return resOk;
  }
}
