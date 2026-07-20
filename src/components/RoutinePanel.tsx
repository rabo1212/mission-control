"use client";

import { useState, useEffect } from "react";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleHuman: string;
  nextRun: string | null;
  lastRun: string | null;
  lastStatus: string | null;
  active: boolean;
}

function fmtWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countdown(iso: string | null): string {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (isNaN(diff) || diff < 0) return "곧";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}일 후`;
  if (h > 0) return `${h}시간 후`;
  return `${m}분 후`;
}

export default function RoutinePanel() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cron").then((x) => x.json());
        if (r.ok) setJobs(r.jobs);
        else setErr(r.error || "조회 실패");
      } catch {
        setErr("연결 실패");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          ⏰ <span>자동 루틴</span>
        </h2>
        <p className="text-sm text-[#a1a1aa] mt-1">
          페페가 자동으로 돌리는 스케줄 작업 {jobs.length}개 (레딧 수요분석 · 주간취합 · 브리핑 등)
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-[#a1a1aa]">불러오는 중…</div>
      ) : err ? (
        <div className="text-xs text-[#fca5a5] bg-[#2a1520] border border-[#4a2530] rounded-lg px-3 py-2">
          ⚠️ {err}
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-3 bg-[#13131f] border border-[#1e1e30] rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{j.name}</span>
                  {j.active ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#34d399]/15 text-[#6ee7b7] shrink-0">
                      ON
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3a3a4a] text-[#a1a1aa] shrink-0">
                      OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#71717a] mt-0.5">
                  🔁 {j.scheduleHuman}
                  {j.lastRun && (
                    <span className="ml-2">
                      · 마지막:{" "}
                      <span className={j.lastStatus === "ok" ? "text-[#6ee7b7]" : "text-[#fca5a5]"}>
                        {fmtWhen(j.lastRun)} {j.lastStatus === "ok" ? "✓" : j.lastStatus || ""}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-[#a1a1aa]">{fmtWhen(j.nextRun)}</div>
                <div className="text-[11px] text-[#8b5cf6]">{countdown(j.nextRun)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
