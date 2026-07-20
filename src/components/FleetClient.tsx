"use client";

import { useState, useEffect } from "react";

interface Bot {
  id: string;
  name: string;
  emoji: string;
  role: string;
  profile: string;
  alive: boolean;
  home: "mac" | "vps";
}

export default function FleetClient() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/fleet").then((x) => x.json());
      setBots(r.bots || []);
      setErr(r.ok ? null : r.error || "조회 실패");
      setRefreshedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      setErr("연결 실패");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const pepe = bots.find((b) => b.id === "pepe");
  const others = bots.filter((b) => b.id !== "pepe");
  const aliveCount = bots.filter((b) => b.alive).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🛰️ <span>봇 함대</span>
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            진짜 봇 {bots.length}마리 · 활동중 <span className="text-[#34d399]">{aliveCount}</span>마리
            {refreshedAt && <span className="text-[#52525b] ml-2">· {refreshedAt} 갱신</span>}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#1e1e30] text-[#a1a1aa] hover:text-white disabled:opacity-50"
        >
          {loading ? "확인 중…" : "↻ 새로고침"}
        </button>
      </div>

      {err && (
        <div className="mb-4 text-xs text-[#fca5a5] bg-[#2a1520] border border-[#4a2530] rounded-lg px-3 py-2">
          ⚠️ VPS 조회 문제: {err} (표시가 부정확할 수 있음)
        </div>
      )}

      {/* 페페 = 함대장 (크게) */}
      {pepe && (
        <div className="mb-4 rounded-2xl border border-[#34d399]/30 bg-gradient-to-br from-[#0f2a1e] to-[#13131f] p-5">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{pepe.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{pepe.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34d399]/20 text-[#6ee7b7] font-medium">
                  함대장
                </span>
                <StatusDot alive={pepe.alive} />
              </div>
              <p className="text-sm text-[#a1a1aa] mt-0.5">{pepe.role}</p>
              <p className="text-xs text-[#52525b] mt-1">
                이 대시보드 안에서도 활동 중 · 우하단 🐸 클릭하면 대화
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1e2a24] text-xs text-[#71717a]">
            페페가 아래 3봇을 지휘 — 대장 요청을 적합한 봇에 위임하고 결과를 취합해 보고
          </div>
        </div>
      )}

      {/* 나머지 3봇 (거느리는 대상) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {others.map((b) => (
          <div
            key={b.id}
            className={`rounded-xl border p-4 transition-colors ${
              b.alive
                ? "border-[#1e1e30] bg-[#13131f] hover:border-[#34d399]/30"
                : "border-[#3a2530] bg-[#1a1015] opacity-80"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">{b.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{b.name}</h3>
                  <StatusDot alive={b.alive} />
                </div>
                <p className="text-[11px] text-[#52525b]">VPS · {b.profile}</p>
              </div>
            </div>
            <p className="text-sm text-[#a1a1aa]">{b.role}</p>
            <div className="mt-2 text-xs">
              {b.alive ? (
                <span className="text-[#34d399]">● 활동 중</span>
              ) : (
                <span className="text-[#fca5a5]">○ 응답 없음 — 점검 필요</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#52525b] mt-6">
        💡 &quot;가재군단&quot; 탭은 프로젝트별 <b>역할 배정</b>(프론트/백엔드/디자인 등) 시각화이고,
        이 <b>봇 함대</b>가 실제로 돌아가는 진짜 봇(페페·레이·비르·조니)이야.
      </p>
    </div>
  );
}

function StatusDot({ alive }: { alive: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${alive ? "bg-[#34d399]" : "bg-[#71717a]"}`}
      style={alive ? { animation: "pulse 2s infinite" } : undefined}
    />
  );
}
