"use client";

import { useEffect, useState } from "react";

interface AggRow {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  calls: number;
  sessions: number;
}

interface DailyUsage extends AggRow { day: string; }
interface ModelUsage extends AggRow { model: string; }
interface SourceUsage extends AggRow { source: string; }

interface UsageData {
  source: "hermes-db" | "json-fallback";
  days: number;
  daily: DailyUsage[];
  byModel: ModelUsage[];
  bySource: SourceUsage[];
  totals: {
    total_input: number;
    total_output: number;
    total_cache_read: number;
    total_cache_write: number;
    total_cost: number;
    call_count: number;
    session_count: number;
  };
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const SOURCE_LABEL: Record<string, string> = {
  desktop: "🖥️ 데스크탑",
  tui: "⌨️ TUI",
  cli: "💻 CLI",
  subagent: "🤖 서브에이전트",
  slack: "💬 슬랙",
  cron: "⏰ 크론",
  telegram: "✈️ 텔레그램",
  unknown: "❔ 기타",
};

function Bar({ value, max, color = "#8b5cf6" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-[#1e1e30] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function TokenPanel() {
  const [data, setData] = useState<UsageData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/token-usage?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[#1e1e30] rounded w-1/3" />
          <div className="h-20 bg-[#1e1e30] rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-6 text-center text-[#a1a1aa] text-sm">
        토큰 사용 데이터 없음
      </div>
    );
  }

  const { totals, daily, byModel, bySource } = data;
  const hasCost = totals.total_cost > 0;
  const maxDailyTokens = Math.max(...daily.map((d) => d.input + d.output), 1);
  const maxSourceTokens = Math.max(...bySource.map((s) => s.input + s.output), 1);

  return (
    <div className="space-y-4">
      {/* 헤더 + 기간 선택 */}
      <div className="flex items-center flex-wrap gap-2 justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">💰 토큰 사용량</h2>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              data.source === "hermes-db" ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-[#eab308]/15 text-[#eab308]"
            }`}
            title={data.source === "hermes-db" ? "실제 hermes 세션 DB 기반" : "실제 데이터 없음 — 샘플 JSON"}
          >
            {data.source === "hermes-db" ? "● 실데이터" : "● 샘플"}
          </span>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                days === d ? "bg-[#8b5cf6] text-white" : "bg-[#1e1e30] text-[#a1a1aa] hover:text-white"
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      {/* 총계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold font-[var(--font-mono)] text-[#a78bfa]">
            {totals.session_count}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1">세션</div>
        </div>
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold font-[var(--font-mono)] text-[#22c55e]">
            {totals.call_count.toLocaleString()}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1">API 호출</div>
        </div>
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold font-[var(--font-mono)] text-[#3b82f6]">
            {formatTokens(totals.total_input)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1">입력 토큰</div>
        </div>
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold font-[var(--font-mono)] text-[#eab308]">
            {formatTokens(totals.total_output)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1">출력 토큰</div>
        </div>
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold font-[var(--font-mono)] text-[#f472b6]">
            {formatTokens(totals.total_cache_read + totals.total_cache_write)}
          </div>
          <div className="text-xs text-[#a1a1aa] mt-1">캐시 토큰</div>
        </div>
      </div>

      {/* 비용 (있을 때만) */}
      {hasCost && (
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-[#a1a1aa]">추정 비용 (가격정보 있는 모델만)</span>
          <span className="text-xl font-bold font-[var(--font-mono)] text-[#8b5cf6]">
            ${totals.total_cost.toFixed(2)}
          </span>
        </div>
      )}

      {/* 일별 토큰 */}
      {daily.length > 0 && (
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3">일별 토큰 (입력+출력)</h3>
          <div className="space-y-2">
            {daily.slice(0, days).map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-[#a1a1aa] font-[var(--font-mono)] w-14 shrink-0">
                  {d.day.slice(5)}
                </span>
                <div className="flex-1">
                  <Bar value={d.input + d.output} max={maxDailyTokens} />
                </div>
                <span className="text-xs text-[#f5f5f7] font-[var(--font-mono)] w-16 text-right">
                  {formatTokens(d.input + d.output)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모델별 */}
      {byModel.length > 0 && (
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3">모델별 사용량</h3>
          <div className="space-y-2">
            {byModel.map((m) => (
              <div key={m.model} className="flex items-center justify-between text-sm gap-2">
                <span className="text-[#f5f5f7] font-[var(--font-mono)] text-xs truncate">{m.model}</span>
                <div className="flex gap-3 text-xs text-[#a1a1aa] shrink-0">
                  <span>{m.sessions}세션</span>
                  <span className="text-[#3b82f6]">{formatTokens(m.input + m.output)}</span>
                  {m.cost > 0 && <span className="text-[#8b5cf6] font-semibold">${m.cost.toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 플랫폼(소스)별 */}
      {bySource.length > 0 && (
        <div className="bg-[#13131f] border border-[#1e1e30] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3">플랫폼별 사용량</h3>
          <div className="space-y-2">
            {bySource.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="text-xs text-[#f5f5f7] w-28 shrink-0 truncate">
                  {SOURCE_LABEL[s.source] || s.source}
                </span>
                <div className="flex-1">
                  <Bar value={s.input + s.output} max={maxSourceTokens} color="#22c55e" />
                </div>
                <span className="text-xs text-[#a1a1aa] font-[var(--font-mono)] w-24 text-right">
                  {s.sessions}세션 · {formatTokens(s.input + s.output)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
