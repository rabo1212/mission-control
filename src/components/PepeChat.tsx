"use client";

/**
 * PepeChat — 대시보드 안에 사는 페페(총괄비서) 플로팅 챗 위젯
 * 우하단 캐릭터 클릭 → 챗창. /api/chat 으로 진짜 페페 호출(스킬·메모리 살아있음).
 * sessionId를 유지해 대화를 이어간다.
 */
import { useState, useRef, useEffect, useCallback } from "react";

interface Msg {
  role: "user" | "pepe";
  text: string;
}

type Mode = "chat" | "work";

const GREETING: Record<Mode, string> = {
  chat: "대장! 페페야 ㅎㅎ 오늘 어땠어? 그냥 수다 떨자~",
  work: "대장! 총괄비서 페페 대기 중. 프로젝트·재무·봇함대·잡무 뭐든 시켜.",
};

export default function PepeChat() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "pepe", text: GREETING.chat }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      localStorage.setItem("pepe_last_chat", String(Date.now()));
    } catch {}
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsgs((m) => [...m, { role: "pepe", text: data.reply }]);
        if (data.sessionId) setSessionId(data.sessionId);
      } else {
        setMsgs((m) => [...m, { role: "pepe", text: `⚠️ ${data.error || "응답 실패"}` }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "pepe", text: "⚠️ 페페 연결 실패 (서버 확인)" }]);
    } finally {
      setBusy(false);
    }
  }, [input, busy, sessionId, mode]);

  // 모드 전환 → 세션 리셋 + 인삿말 교체
  const switchMode = (next: Mode) => {
    if (next === mode || busy) return;
    setMode(next);
    setSessionId(null);
    setMsgs([{ role: "pepe", text: GREETING[next] }]);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{`
        @keyframes pepeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pepePop { from{opacity:0;transform:translateY(20px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pepeThink { 0%,100%{opacity:.3} 50%{opacity:1} }
      `}</style>

      {/* 챗창 */}
      {open && (
        <div
          className="fixed bottom-28 right-6 z-50 flex flex-col w-[380px] max-w-[92vw] h-[560px] max-h-[75vh] rounded-2xl border border-[#2a2a45] bg-[#0f0f1a] shadow-2xl overflow-hidden"
          style={{ animation: "pepePop .22s ease-out" }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e30] bg-[#13131f]">
            <div className="text-2xl">🐸</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">페페 <span className="text-[#6ee7b7] text-xs font-normal">· {mode === "chat" ? "수다친구" : "총괄비서"}</span></div>
              <div className="text-[10px] text-[#71717a]">
                {busy ? "생각 중…" : sessionId ? "대화 이어짐" : "온라인"}
              </div>
            </div>
            {/* 수다 / 일 토글 */}
            <div className="flex rounded-lg bg-[#0f0f1a] border border-[#2a2a45] overflow-hidden text-[11px] mr-1">
              <button
                onClick={() => switchMode("chat")}
                className={`px-2.5 py-1 transition ${mode === "chat" ? "bg-[#16a34a] text-white" : "text-[#71717a] hover:text-white"}`}
              >
                🐾 수다
              </button>
              <button
                onClick={() => switchMode("work")}
                className={`px-2.5 py-1 transition ${mode === "work" ? "bg-[#16a34a] text-white" : "text-[#71717a] hover:text-white"}`}
              >
                💼 일
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#71717a] hover:text-white text-lg leading-none px-1"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* 메시지 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#2563eb] text-white rounded-br-sm"
                      : "bg-[#1c1c2b] text-[#e4e4e7] rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-[#1c1c2b] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]"
                      style={{ animation: `pepeThink 1s ${d * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 입력 */}
          <div className="border-t border-[#1e1e30] p-2.5 bg-[#13131f]">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder={mode === "chat" ? "페페랑 수다 떨기… (Enter 전송)" : "페페한테 시키기… (Enter 전송)"}
                className="flex-1 resize-none bg-[#0f0f1a] border border-[#2a2a45] rounded-xl px-3 py-2 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3b82f6] max-h-24"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="shrink-0 h-9 px-3.5 rounded-xl bg-[#2563eb] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#1d4ed8] transition"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 캐릭터 버튼 */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#16a34a] to-[#065f46] shadow-xl border-2 border-[#34d399]/40 hover:scale-105 transition"
        style={{ animation: open ? "none" : "pepeFloat 3s ease-in-out infinite" }}
        aria-label="페페 열기"
      >
        <span className="text-3xl">🐸</span>
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#34d399] border-2 border-[#0a0a12]" />
        )}
      </button>
    </>
  );
}
