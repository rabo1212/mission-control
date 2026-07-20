/**
 * SSE 실시간 스트리밍 엔드포인트
 * GET /api/sse → 이벤트 스트림 연결
 */
import { eventBus, type SSEEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  function cleanup() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      // 초기 연결 메시지
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`)
      );

      // 이벤트 버스 구독
      unsubscribe = eventBus.subscribe((event: SSEEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      // 30초마다 하트비트로 연결 유지 (SSE 주석 형식)
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 30000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
