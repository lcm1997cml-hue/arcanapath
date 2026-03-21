import { NextRequest, NextResponse } from "next/server";
import { getReading } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Public-safe JSON for share image / copy (same surface as /r/[id]). */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }

  try {
    const result = await getReading(id);
    if (!result) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      id: result.id,
      question: result.question,
      cards: result.cards,
      freeReading: result.freeReading,
    });
  } catch (e) {
    console.error("[/api/share-reading-preview]", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
