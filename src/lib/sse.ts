/**
 * SSE (Server-Sent Events) 이벤트 버스
 * - 서버 → 클라이언트 실시간 푸시
 * - 프로젝트 상태 변경, 에이전트 상태, 토큰 사용량 등
 */

export type SSEEventType =
  | "project:updated"
  | "project:status"
  | "agent:state"
  | "token:usage"
  | "alert:new"
  | "heartbeat";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: number;
}

type Listener = (event: SSEEvent) => void;

class EventBus {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type: SSEEventType, data: unknown) {
    const event: SSEEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[SSE] 리스너 에러:", err);
      }
    }
  }

  get listenerCount() {
    return this.listeners.size;
  }
}

// 싱글턴 인스턴스
export const eventBus = new EventBus();
