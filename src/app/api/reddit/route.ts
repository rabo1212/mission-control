/**
 * 레딧 수요 스나이퍼 API — ~/reddit-demand-sniper/data/ 파일을 직접 읽는다.
 * 8420 대시보드 서버에 의존하지 않음 (그게 죽어도 여기선 계속 보임).
 * GET  /api/reddit           → { ok, daily, weekly, prototypes, feedback }
 * POST /api/reddit           → 피드백 추가       { message, target? }
 * POST /api/reddit?action=status → 피드백 상태변경 { id, status }
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const BASE =
  process.env.REDDIT_SNIPER_PATH ||
  path.join(os.homedir(), "reddit-demand-sniper");
const DAILY_DIR = path.join(BASE, "data", "daily_analysis");
const COLLECTED_DIR = path.join(BASE, "data", "collected");
const WEEKLY_DIR = path.join(BASE, "data", "weekly_reports");
const PROTOTYPES_DIR = path.join(BASE, "prototypes");
const FEEDBACK_PATH = path.join(BASE, "data", "feedback.json");

function loadJson<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function listJson(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5));
  } catch {
    return [];
  }
}

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

function getDaily(): DailyEntry[] {
  const map = new Map<string, DailyEntry>();

  for (const date of listJson(COLLECTED_DIR)) {
    const d = loadJson<unknown[]>(path.join(COLLECTED_DIR, `${date}.json`), []);
    const e = map.get(date) ?? blankDaily(date);
    e.new_item_count = Array.isArray(d) ? d.length : e.new_item_count;
    map.set(date, e);
  }

  for (const date of listJson(DAILY_DIR)) {
    const d = loadJson<Record<string, unknown>>(
      path.join(DAILY_DIR, `${date}.json`),
      {}
    );
    const e = map.get(date) ?? blankDaily(date);
    e.total_collected = (d.total_collected as number) ?? e.total_collected;
    e.filter_passed =
      (d.filter_passed as number) ?? (d.filtered as number) ?? e.filter_passed;
    e.new_item_count =
      (d.new_item_count as number) ??
      (d.new_items as number) ??
      e.new_item_count;
    const ideas = (d.top_ideas as Idea[]) ?? [];
    e.top_ideas = ideas;
    e.idea_count = ideas.length;
    e.verdict = (d.verdict as string) ?? null;
    map.set(date, e);
  }

  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

function blankDaily(date: string): DailyEntry {
  return {
    date,
    total_collected: null,
    filter_passed: null,
    new_item_count: null,
    idea_count: 0,
    top_ideas: [],
    verdict: null,
  };
}

function getWeekly(): Record<string, unknown>[] {
  return listJson(WEEKLY_DIR)
    .sort()
    .reverse()
    .map((w) => loadJson<Record<string, unknown>>(path.join(WEEKLY_DIR, `${w}.json`), {}))
    .filter((x) => x && Object.keys(x).length > 0);
}

interface Proto {
  week: string;
  name: string;
  path: string;
  mtime: string;
}

function getPrototypes(): Proto[] {
  const out: Proto[] = [];
  let weeks: string[];
  try {
    weeks = fs
      .readdirSync(PROTOTYPES_DIR)
      .filter((w) => fs.statSync(path.join(PROTOTYPES_DIR, w)).isDirectory());
  } catch {
    return out;
  }
  for (const week of weeks.sort().reverse()) {
    const weekDir = path.join(PROTOTYPES_DIR, week);
    let protos: string[];
    try {
      protos = fs
        .readdirSync(weekDir)
        .filter((p) => fs.statSync(path.join(weekDir, p)).isDirectory());
    } catch {
      continue;
    }
    for (const name of protos.sort()) {
      const protoDir = path.join(weekDir, name);
      let entry = path.join(protoDir, "index.html");
      if (!fs.existsSync(entry)) {
        const html = (() => {
          try {
            return fs.readdirSync(protoDir).find((f) => f.endsWith(".html"));
          } catch {
            return undefined;
          }
        })();
        if (!html) continue;
        entry = path.join(protoDir, html);
      }
      out.push({
        week,
        name,
        path: path.relative(PROTOTYPES_DIR, entry),
        mtime: fs.statSync(entry).mtime.toISOString(),
      });
    }
  }
  return out;
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

function getFeedback(): Feedback[] {
  const data = loadJson<Feedback[]>(FEEDBACK_PATH, []);
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) =>
    (a.created_at || "") < (b.created_at || "") ? 1 : -1
  );
}

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      base: BASE,
      daily: getDaily(),
      weekly: getWeekly(),
      prototypes: getPrototypes(),
      feedback: getFeedback(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "레딧 데이터 조회 실패";
    return NextResponse.json(
      { ok: false, error: msg, daily: [], weekly: [], prototypes: [], feedback: [] },
      { status: 500 }
    );
  }
}

function writeFeedback(data: Feedback[]) {
  const tmp = FEEDBACK_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, FEEDBACK_PATH);
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const data = loadJson<Feedback[]>(FEEDBACK_PATH, []);
  const list = Array.isArray(data) ? data : [];

  if (action === "status") {
    const id = Number(body.id);
    const status = String(body.status || "");
    if (!["open", "done"].includes(status))
      return NextResponse.json({ ok: false, error: "status must be open|done" }, { status: 400 });
    const item = list.find((x) => x.id === id);
    if (!item) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    item.status = status;
    if (status === "done" && !item.resolved_at)
      item.resolved_at = new Date().toISOString().slice(0, 19);
    writeFeedback(list);
    return NextResponse.json({ ok: true });
  }

  // 기본: 피드백 추가
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ ok: false, error: "message required" }, { status: 400 });
  const target = (String(body.target || "general").trim() || "general").slice(0, 200);
  const newId = Math.max(0, ...list.map((x) => x.id || 0)) + 1;
  const record: Feedback = {
    id: newId,
    created_at: new Date().toISOString().slice(0, 19),
    status: "open",
    target,
    message: message.slice(0, 2000),
  };
  list.push(record);
  writeFeedback(list);
  return NextResponse.json({ ok: true, record }, { status: 201 });
}
