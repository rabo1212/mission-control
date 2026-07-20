"use client";

import { useState, useEffect, useCallback } from "react";

/* ---------- 타입 ---------- */
interface Idea {
  title?: string;
  subreddit?: string;
  url?: string;
  problem?: string;
  solution?: string;
  revenue_model?: string;
  difficulty?: string;
  score?: number;
  notes?: string;
}
interface DailyEntry {
  date: string;
  total_collected: number | null;
  filter_passed: number | null;
  new_item_count: number | null;
  idea_count: number;
  top_ideas: Idea[];
  verdict?: string | null;
}
interface Top5 {
  rank: number;
  title: string;
  source_date?: string;
  core_problem?: string;
  solution?: string;
  tag?: string;
  revenue_model?: string;
  difficulty?: string;
  score?: number;
  has_prototype?: boolean;
  prototype_path?: string | null;
}
interface Weekly {
  week: string;
  period_start?: string;
  period_end?: string;
  top5?: Top5[];
  next_steps?: string[];
  prototypes_built?: string[];
}
interface Proto {
  week: string;
  name: string;
  path: string;
  mtime: string;
}
interface Feedback {
  id: number;
  created_at: string;
  status: string;
  target: string;
  message: string;
  resolved_at?: string;
  resolution_note?: string;
}
interface Payload {
  ok: boolean;
  error?: string;
  daily: DailyEntry[];
  weekly: Weekly[];
  prototypes: Proto[];
  feedback: Feedback[];
}

/* ---------- 유틸 ---------- */
function diffColor(d?: string) {
  if (d === "하") return "text-[#6ee7b7] bg-[#34d399]/15";
  if (d === "중") return "text-[#fcd34d] bg-[#f59e0b]/15";
  if (d === "상") return "text-[#fca5a5] bg-[#ef4444]/15";
  return "text-[#a1a1aa] bg-[#3a3a4a]";
}
function scoreColor(s?: number) {
  if (s == null) return "text-[#a1a1aa]";
  if (s >= 80) return "text-[#6ee7b7]";
  if (s >= 65) return "text-[#fcd34d]";
  return "text-[#a1a1aa]";
}
function fmtDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

type TabKey = "daily" | "weekly" | "prototypes" | "feedback";

/* ---------- 메인 ---------- */
export default function RedditClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("weekly");
  const [refreshedAt, setRefreshedAt] = useState("");
  const [preview, setPreview] = useState<Proto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r: Payload = await fetch("/api/reddit").then((x) => x.json());
      setData(r);
      setRefreshedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      setData({ ok: false, error: "연결 실패", daily: [], weekly: [], prototypes: [], feedback: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const daily = data?.daily ?? [];
  const weekly = data?.weekly ?? [];
  const prototypes = data?.prototypes ?? [];
  const feedback = data?.feedback ?? [];
  const openFeedback = feedback.filter((f) => f.status === "open").length;

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "weekly", label: "주간 TOP 5" },
    { key: "daily", label: "일별 로그", badge: daily.length },
    { key: "prototypes", label: "프로토타입", badge: prototypes.length },
    { key: "feedback", label: "피드백", badge: openFeedback || undefined },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🎯 <span>레딧 수요 스나이퍼</span>
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            매일 09:30 레딧 15개 서브 수집 → Haiku 분석 → 사업 아이디어 랭킹 → 프로토타입
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

      {data && !data.ok && (
        <div className="mb-4 text-xs text-[#fca5a5] bg-[#2a1520] border border-[#4a2530] rounded-lg px-3 py-2">
          ⚠️ 데이터 조회 문제: {data.error} — ~/reddit-demand-sniper 경로 확인 필요
        </div>
      )}

      {/* 서브탭 */}
      <div className="flex gap-1 bg-[#13131f] rounded-lg p-1 border border-[#1e1e30] mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.key ? "bg-[#8b5cf6] text-white" : "text-[#a1a1aa] hover:text-white hover:bg-[#1e1e30]"
            }`}
          >
            {t.label}
            {t.badge != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-[#1e1e30]"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="text-sm text-[#a1a1aa]">불러오는 중…</div>
      ) : (
        <>
          {tab === "weekly" && <WeeklyView weekly={weekly} onPreview={(p) => setPreview(p)} prototypes={prototypes} />}
          {tab === "daily" && <DailyView daily={daily} />}
          {tab === "prototypes" && <PrototypeView prototypes={prototypes} onPreview={setPreview} />}
          {tab === "feedback" && <FeedbackView feedback={feedback} onChange={load} />}
        </>
      )}

      {preview && <PrototypeModal proto={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ---------- 주간 TOP5 ---------- */
function WeeklyView({
  weekly,
  prototypes,
  onPreview,
}: {
  weekly: Weekly[];
  prototypes: Proto[];
  onPreview: (p: Proto) => void;
}) {
  const [idx, setIdx] = useState(0);
  const w = weekly[idx];
  if (!w) return <Empty msg="주간 리포트가 아직 없어요." />;

  const findProto = (protoPath?: string | null): Proto | undefined => {
    if (!protoPath) return undefined;
    const norm = protoPath.replace(/^prototypes\//, "");
    return prototypes.find((p) => p.path.startsWith(norm) || `${p.week}/${p.name}` === norm);
  };

  return (
    <div>
      {weekly.length > 1 && (
        <div className="flex gap-2 mb-4">
          {weekly.map((ww, i) => (
            <button
              key={ww.week}
              onClick={() => setIdx(i)}
              className={`text-xs px-3 py-1 rounded-lg ${
                i === idx ? "bg-[#8b5cf6] text-white" : "bg-[#1e1e30] text-[#a1a1aa] hover:text-white"
              }`}
            >
              {ww.week}
            </button>
          ))}
        </div>
      )}
      <div className="text-sm text-[#71717a] mb-4">
        {w.week} · {w.period_start} ~ {w.period_end}
      </div>

      <div className="space-y-3">
        {(w.top5 ?? []).map((it) => {
          const proto = findProto(it.prototype_path);
          return (
            <div key={it.rank} className="rounded-xl border border-[#1e1e30] bg-[#13131f] p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl font-black text-[#8b5cf6] w-8 shrink-0">#{it.rank}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="font-bold text-white">{it.title}</h3>
                    {it.difficulty && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${diffColor(it.difficulty)}`}>
                        난이도 {it.difficulty}
                      </span>
                    )}
                    {it.tag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e30] text-[#a1a1aa]">{it.tag}</span>
                    )}
                    <span className={`text-sm font-bold ml-auto ${scoreColor(it.score)}`}>{it.score ?? "-"}점</span>
                  </div>
                  {it.core_problem && <p className="text-sm text-[#d4d4d8] mt-2">🔴 {it.core_problem}</p>}
                  {it.solution && <p className="text-sm text-[#a1a1aa] mt-1">💡 {it.solution}</p>}
                  {it.revenue_model && <p className="text-xs text-[#71717a] mt-1">💰 {it.revenue_model}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    {proto ? (
                      <button
                        onClick={() => onPreview(proto)}
                        className="text-xs px-3 py-1 rounded-lg bg-[#8b5cf6]/20 text-[#c4b5fd] hover:bg-[#8b5cf6]/30"
                      >
                        ▶ 프로토타입 보기
                      </button>
                    ) : it.has_prototype ? (
                      <span className="text-xs text-[#71717a]">프로토타입 있음 (파일 못 찾음)</span>
                    ) : (
                      <span className="text-xs text-[#52525b]">프로토타입 미제작</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {w.next_steps && w.next_steps.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#1e2a24] bg-[#0f1a15] p-4">
          <h4 className="text-sm font-bold text-[#6ee7b7] mb-2">📌 다음 단계</h4>
          <ul className="space-y-1.5">
            {w.next_steps.map((s, i) => (
              <li key={i} className="text-sm text-[#a1a1aa] flex gap-2">
                <span className="text-[#34d399]">›</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- 일별 로그 ---------- */
function DailyView({ daily }: { daily: DailyEntry[] }) {
  const [open, setOpen] = useState<string | null>(daily[0]?.date ?? null);
  if (daily.length === 0) return <Empty msg="일별 데이터가 아직 없어요." />;

  return (
    <div className="space-y-2">
      {daily.map((d) => {
        const isOpen = open === d.date;
        const hasIdeas = d.top_ideas.length > 0;
        return (
          <div key={d.date} className="rounded-xl border border-[#1e1e30] bg-[#13131f] overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : d.date)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#1a1a28] text-left"
            >
              <span className="font-bold text-white w-24 shrink-0">{d.date}</span>
              <div className="flex gap-4 text-xs flex-1">
                <Stat n={d.total_collected} label="수집" />
                <Stat n={d.filter_passed} label="필터통과" />
                <Stat n={d.new_item_count} label="신규" />
                <Stat n={d.idea_count} label="분석완료" accent />
              </div>
              {hasIdeas && (
                <span className="text-xs text-[#8b5cf6] shrink-0">
                  {isOpen ? "▾" : "▸"} 아이디어 {d.idea_count}개
                </span>
              )}
            </button>
            {isOpen && hasIdeas && (
              <div className="border-t border-[#1e1e30] px-4 py-3 space-y-3">
                {d.verdict && <p className="text-xs text-[#71717a] italic">🗒️ {d.verdict}</p>}
                {d.top_ideas.map((idea, i) => (
                  <div key={i} className="rounded-lg bg-[#0d0d16] border border-[#1e1e30] p-3">
                    <div className="flex items-center flex-wrap gap-2">
                      <a
                        href={idea.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-white hover:text-[#c4b5fd]"
                      >
                        {idea.title}
                      </a>
                      {idea.subreddit && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e30] text-[#a1a1aa]">
                          r/{idea.subreddit}
                        </span>
                      )}
                      {idea.difficulty && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${diffColor(idea.difficulty)}`}>
                          {idea.difficulty}
                        </span>
                      )}
                      <span className={`text-sm font-bold ml-auto ${scoreColor(idea.score)}`}>{idea.score ?? "-"}</span>
                    </div>
                    {idea.problem && <p className="text-xs text-[#d4d4d8] mt-1.5">🔴 {idea.problem}</p>}
                    {idea.solution && <p className="text-xs text-[#a1a1aa] mt-1">💡 {idea.solution}</p>}
                    {idea.revenue_model && <p className="text-[11px] text-[#71717a] mt-1">💰 {idea.revenue_model}</p>}
                    {idea.notes && <p className="text-[11px] text-[#52525b] mt-1">📝 {idea.notes}</p>}
                  </div>
                ))}
              </div>
            )}
            {isOpen && !hasIdeas && (
              <div className="border-t border-[#1e1e30] px-4 py-3 text-xs text-[#52525b]">
                이 날짜는 분석 데이터가 없어요 (수집 실패했거나 분석 전).
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ n, label, accent }: { n: number | null; label: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-bold ${accent ? "text-[#8b5cf6]" : "text-white"}`}>{n ?? "-"}</span>
      <span className="text-[#52525b]">{label}</span>
    </div>
  );
}

/* ---------- 프로토타입 ---------- */
function PrototypeView({ prototypes, onPreview }: { prototypes: Proto[]; onPreview: (p: Proto) => void }) {
  if (prototypes.length === 0) return <Empty msg="제작된 프로토타입이 아직 없어요." />;
  const byWeek = prototypes.reduce<Record<string, Proto[]>>((acc, p) => {
    (acc[p.week] ??= []).push(p);
    return acc;
  }, {});
  return (
    <div className="space-y-6">
      {Object.entries(byWeek).map(([week, protos]) => (
        <div key={week}>
          <h3 className="text-sm font-bold text-[#a1a1aa] mb-3">{week}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {protos.map((p) => (
              <button
                key={p.path}
                onClick={() => onPreview(p)}
                className="text-left rounded-xl border border-[#1e1e30] bg-[#13131f] p-4 hover:border-[#8b5cf6]/40 transition-colors group"
              >
                <div className="text-2xl mb-2">🧪</div>
                <div className="font-medium text-white group-hover:text-[#c4b5fd] break-words">{p.name}</div>
                <div className="text-[11px] text-[#52525b] mt-1">{fmtDate(p.mtime)}</div>
                <div className="text-xs text-[#8b5cf6] mt-2">▶ 열기</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrototypeModal({ proto, onClose }: { proto: Proto; onClose: () => void }) {
  const src = `/api/reddit/prototype?path=${encodeURIComponent(proto.path)}`;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0d0d16] border border-[#1e1e30] rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e30]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">🧪</span>
            <span className="font-medium text-white truncate">{proto.name}</span>
            <span className="text-xs text-[#52525b] shrink-0">· {proto.week}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1 rounded-lg bg-[#1e1e30] text-[#a1a1aa] hover:text-white"
            >
              새 탭 ↗
            </a>
            <button onClick={onClose} className="text-xs px-3 py-1 rounded-lg bg-[#1e1e30] text-[#a1a1aa] hover:text-white">
              닫기 ✕
            </button>
          </div>
        </div>
        <iframe src={src} className="flex-1 w-full bg-white" title={proto.name} sandbox="allow-scripts allow-forms" />
      </div>
    </div>
  );
}

/* ---------- 피드백 ---------- */
function FeedbackView({ feedback, onChange }: { feedback: Feedback[]; onChange: () => void }) {
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!msg.trim()) return;
    setSending(true);
    await fetch("/api/reddit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, target: target || "general" }),
    });
    setMsg("");
    setTarget("");
    setSending(false);
    onChange();
  };

  const toggle = async (f: Feedback) => {
    await fetch("/api/reddit?action=status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, status: f.status === "done" ? "open" : "done" }),
    });
    onChange();
  };

  return (
    <div>
      <div className="rounded-xl border border-[#1e1e30] bg-[#13131f] p-4 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">💬 피드백 남기기</h3>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="대상 (프로토타입 이름 or 비우면 general)"
          className="w-full mb-2 bg-[#0d0d16] border border-[#1e1e30] rounded-lg px-3 py-2 text-sm text-white placeholder-[#52525b] outline-none focus:border-[#8b5cf6]/50"
        />
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="개선 아이디어, 버그, 방향 제안…"
          rows={3}
          className="w-full bg-[#0d0d16] border border-[#1e1e30] rounded-lg px-3 py-2 text-sm text-white placeholder-[#52525b] outline-none focus:border-[#8b5cf6]/50 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={submit}
            disabled={sending || !msg.trim()}
            className="text-xs px-4 py-1.5 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c4ff0] disabled:opacity-40"
          >
            {sending ? "저장 중…" : "남기기"}
          </button>
        </div>
      </div>

      {feedback.length === 0 ? (
        <Empty msg="아직 피드백이 없어요." />
      ) : (
        <div className="space-y-2">
          {feedback.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border p-4 ${
                f.status === "done" ? "border-[#1e2a24] bg-[#0f1a15] opacity-70" : "border-[#1e1e30] bg-[#13131f]"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggle(f)}
                  className={`mt-0.5 w-5 h-5 rounded border shrink-0 flex items-center justify-center text-xs ${
                    f.status === "done"
                      ? "bg-[#34d399]/20 border-[#34d399]/40 text-[#6ee7b7]"
                      : "border-[#3a3a4a] text-transparent hover:border-[#8b5cf6]"
                  }`}
                >
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e30] text-[#a1a1aa]">{f.target}</span>
                    <span className="text-[11px] text-[#52525b]">{fmtDate(f.created_at)}</span>
                  </div>
                  <p className={`text-sm mt-1 ${f.status === "done" ? "text-[#71717a] line-through" : "text-[#d4d4d8]"}`}>
                    {f.message}
                  </p>
                  {f.resolution_note && (
                    <p className="text-xs text-[#6ee7b7] mt-1.5">✅ {f.resolution_note}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-sm text-[#52525b] py-8 text-center">{msg}</div>;
}
