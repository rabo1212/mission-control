/**
 * 토큰 사용량 API
 * GET  /api/token-usage?days=7 → 실제 hermes 세션 DB에서 사용량 집계
 * POST /api/token-usage → (레거시) JSON 파일에 수동 기록
 *
 * 데이터 소스: ~/.hermes/state.db 의 sessions 테이블
 *  - hermes insights 명령과 같은 원천. started_at(unix초), input/output_tokens,
 *    cache_read/write_tokens, model, source, estimated_cost_usd 컬럼 집계.
 *  - DB를 못 읽으면 기존 data/token-usage.json 폴백.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import Database from "better-sqlite3";

export const dynamic = "force-dynamic";

const USAGE_FILE = path.join(process.cwd(), "data", "token-usage.json");
const HERMES_DB = path.join(os.homedir(), ".hermes", "state.db");

interface AggRow {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  calls: number;
  sessions: number;
}

function emptyAgg(): AggRow {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, calls: 0, sessions: 0 };
}

/** hermes state.db 에서 최근 N일 세션 사용량 집계 */
function fromHermesDb(days: number) {
  if (!fs.existsSync(HERMES_DB)) return null;
  let db: Database.Database | null = null;
  try {
    db = new Database(HERMES_DB, { readonly: true, fileMustExist: true });
    const cutoff = Date.now() / 1000 - days * 86400;

    const rows = db
      .prepare(
        `SELECT model, source, started_at,
                COALESCE(input_tokens,0)        AS input_tokens,
                COALESCE(output_tokens,0)       AS output_tokens,
                COALESCE(cache_read_tokens,0)   AS cache_read_tokens,
                COALESCE(cache_write_tokens,0)  AS cache_write_tokens,
                COALESCE(estimated_cost_usd,0)  AS estimated_cost_usd,
                COALESCE(actual_cost_usd,0)     AS actual_cost_usd,
                COALESCE(api_call_count,0)      AS api_call_count
         FROM sessions
         WHERE started_at >= ?
         ORDER BY started_at DESC`
      )
      .all(cutoff) as Array<Record<string, number | string>>;

    const totals = emptyAgg();
    const dailyMap: Record<string, AggRow> = {};
    const modelMap: Record<string, AggRow> = {};
    const sourceMap: Record<string, AggRow> = {};

    for (const r of rows) {
      const input = Number(r.input_tokens);
      const output = Number(r.output_tokens);
      const cacheRead = Number(r.cache_read_tokens);
      const cacheWrite = Number(r.cache_write_tokens);
      // actual 우선, 없으면 estimated
      const cost = Number(r.actual_cost_usd) || Number(r.estimated_cost_usd);
      const calls = Number(r.api_call_count);
      const model = String(r.model || "unknown");
      const source = String(r.source || "unknown");
      const day = new Date(Number(r.started_at) * 1000).toISOString().slice(0, 10);

      const add = (a: AggRow) => {
        a.input += input;
        a.output += output;
        a.cacheRead += cacheRead;
        a.cacheWrite += cacheWrite;
        a.cost += cost;
        a.calls += calls;
        a.sessions += 1;
      };

      add(totals);
      if (!dailyMap[day]) dailyMap[day] = emptyAgg();
      add(dailyMap[day]);
      if (!modelMap[model]) modelMap[model] = emptyAgg();
      add(modelMap[model]);
      if (!sourceMap[source]) sourceMap[source] = emptyAgg();
      add(sourceMap[source]);
    }

    const shape = (m: Record<string, AggRow>, key: string) =>
      Object.entries(m)
        .map(([k, v]) => ({ [key]: k, ...v }))
        .sort((a, b) => b.input + b.output - (a.input + a.output));

    return {
      source: "hermes-db",
      days,
      totals: {
        total_input: totals.input,
        total_output: totals.output,
        total_cache_read: totals.cacheRead,
        total_cache_write: totals.cacheWrite,
        total_cost: totals.cost,
        call_count: totals.calls,
        session_count: totals.sessions,
      },
      daily: Object.entries(dailyMap)
        .map(([day, d]) => ({ day, ...d }))
        .sort((a, b) => b.day.localeCompare(a.day)),
      byModel: shape(modelMap, "model"),
      bySource: shape(sourceMap, "source"),
    };
  } catch {
    return null;
  } finally {
    try { db?.close(); } catch { /* noop */ }
  }
}

// ── 레거시 JSON 폴백 ──
interface UsageEntry {
  agent_id?: string;
  project_slug?: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  recorded_at: string;
}

function loadUsage(): UsageEntry[] {
  try {
    if (fs.existsSync(USAGE_FILE)) return JSON.parse(fs.readFileSync(USAGE_FILE, "utf-8"));
  } catch { /* 파일 없으면 빈 배열 */ }
  return [];
}

function fromJsonFallback(days: number) {
  const entries = loadUsage();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = entries.filter((e) => new Date(e.recorded_at) >= cutoff);

  let totalInput = 0, totalOutput = 0, totalCost = 0, totalCalls = 0;
  const modelMap: Record<string, AggRow> = {};
  for (const e of filtered) {
    totalInput += e.input_tokens;
    totalOutput += e.output_tokens;
    totalCost += e.cost_usd;
    totalCalls += 1;
    if (!modelMap[e.model]) modelMap[e.model] = emptyAgg();
    const m = modelMap[e.model];
    m.input += e.input_tokens; m.output += e.output_tokens; m.cost += e.cost_usd; m.calls += 1; m.sessions += 1;
  }
  return {
    source: "json-fallback",
    days,
    totals: {
      total_input: totalInput,
      total_output: totalOutput,
      total_cache_read: 0,
      total_cache_write: 0,
      total_cost: totalCost,
      call_count: totalCalls,
      session_count: filtered.length,
    },
    daily: [],
    byModel: Object.entries(modelMap).map(([model, d]) => ({ model, ...d })),
    bySource: [],
  };
}

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");
  const data = fromHermesDb(days) || fromJsonFallback(days);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: UsageEntry = {
      agent_id: body.agentId || undefined,
      project_slug: body.projectSlug || undefined,
      model: body.model || "unknown",
      input_tokens: body.inputTokens || 0,
      output_tokens: body.outputTokens || 0,
      cost_usd: body.costUsd || 0,
      recorded_at: new Date().toISOString(),
    };
    const entries = loadUsage();
    entries.push(entry);
    fs.writeFileSync(USAGE_FILE, JSON.stringify(entries, null, 2));
    try {
      const { eventBus } = await import("@/lib/sse");
      eventBus.emit("token:usage", entry);
    } catch { /* SSE 모듈 없어도 동작 */ }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
}
