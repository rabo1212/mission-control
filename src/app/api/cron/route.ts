/**
 * 크론/루틴 API — 맥 페페의 스케줄 잡(레딧 매일·주간취합·프로토타입 등)
 * GET /api/cron → hermes cron list 파싱해서 구조화
 */
import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

export const runtime = "nodejs";
const execFileP = promisify(execFile);

const HERMES_BIN = process.env.HERMES_BIN || "hermes";

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

// cron 표현식 → 사람 말
function humanizeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, , , dow] = parts;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const time = `${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  if (dow !== "*") {
    const d = days[parseInt(dow) % 7] ?? dow;
    return `매주 ${d} ${time}`;
  }
  if (min !== "*" && hour !== "*") return `매일 ${time}`;
  return expr;
}

export async function GET() {
  try {
    const { stdout } = await execFileP(HERMES_BIN, ["cron", "list"], {
      timeout: 15000,
      maxBuffer: 2 * 1024 * 1024,
      cwd: os.homedir(),
      env: { ...process.env },
    });

    const jobs: CronJob[] = [];
    // 블록 단위 파싱: "id [active]" 로 시작
    const blocks = stdout.split(/\n(?=\s*[0-9a-f]{12}\s+\[)/);
    for (const block of blocks) {
      const idm = block.match(/([0-9a-f]{12})\s+\[(\w+)\]/);
      if (!idm) continue;
      const name = block.match(/Name:\s*(.+)/)?.[1]?.trim() ?? "(이름없음)";
      const schedule = block.match(/Schedule:\s*(.+)/)?.[1]?.trim() ?? "";
      const nextRun = block.match(/Next run:\s*(.+)/)?.[1]?.trim() ?? null;
      const lastRunLine = block.match(/Last run:\s*(.+)/)?.[1]?.trim() ?? null;
      let lastRun: string | null = null;
      let lastStatus: string | null = null;
      if (lastRunLine) {
        const m = lastRunLine.match(/^(\S+)\s+(\w+)$/);
        if (m) {
          lastRun = m[1];
          lastStatus = m[2];
        } else {
          lastRun = lastRunLine;
        }
      }
      jobs.push({
        id: idm[1],
        name,
        schedule,
        scheduleHuman: humanizeCron(schedule),
        nextRun,
        lastRun,
        lastStatus,
        active: idm[2] === "active",
      });
    }

    // 다음 실행 시각순 정렬
    jobs.sort((a, b) => {
      const ta = a.nextRun ? new Date(a.nextRun).getTime() : Infinity;
      const tb = b.nextRun ? new Date(b.nextRun).getTime() : Infinity;
      return ta - tb;
    });

    return NextResponse.json({ ok: true, count: jobs.length, jobs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "크론 조회 실패";
    return NextResponse.json({ ok: false, error: msg, jobs: [] }, { status: 500 });
  }
}
