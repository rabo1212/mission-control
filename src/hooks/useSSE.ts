"use client";

import { useEffect, useRef, useState } from "react";

interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: number;
}

export function useSSE() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryCount = useRef(0);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      // 이전 연결 정리
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }

      const source = new EventSource("/api/sse");
      sourceRef.current = source;

      source.onopen = () => {
        if (!unmounted) {
          setConnected(true);
          retryCount.current = 0;
        }
      };

      source.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as SSEEvent;
          if (!unmounted) setLastEvent(event);
        } catch { /* 무시 */ }
      };

      source.onerror = () => {
        source.close();
        sourceRef.current = null;
        if (!unmounted) {
          setConnected(false);
          // 재시도 간격을 점점 늘림 (최대 60초)
          retryCount.current += 1;
          const delay = Math.min(5000 * retryCount.current, 60000);
          reconnectRef.current = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, []);

  return { connected, lastEvent };
}
