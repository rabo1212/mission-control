/**
 * 텔레그램 알림 API
 * POST /api/telegram/alert → 알림 전송
 */
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramAlert, type TelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const msg: TelegramMessage = {
      level: body.level || "info",
      source: body.source || "Mission Control",
      message: body.message || "",
      details: body.details,
    };

    if (!msg.message) {
      return NextResponse.json({ error: "message 필수" }, { status: 400 });
    }

    const sent = await sendTelegramAlert(msg);

    // SSE로 알림 이벤트 전파
    try {
      const { eventBus } = await import("@/lib/sse");
      eventBus.emit("alert:new", { ...msg, sent });
    } catch { /* SSE 없어도 동작 */ }

    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: "전송 실패" }, { status: 500 });
  }
}
