/**
 * 봇 함대 API — 진짜 봇 4마리(페페·레이·비르·조니) 실제 생존 상태
 * GET /api/fleet → VPS 게이트웨이 프로세스 확인 + 캐시(60초)
 *
 * 페페=총괄(이 대시보드 백엔드). 레이·비르·조니=VPS 프로필.
 * SSH 조회는 느려서 60초 메모리 캐시.
 */
import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";

export const runtime = "nodejs";
const execFileP = promisify(execFile);

const VPS_IP = process.env.VPS_IP || "76.13.23.214";
const SSH_KEY = process.env.VPS_KEY || path.join(os.homedir(), ".ssh", "hermes_vps");
const CONTAINER = process.env.VPS_CONTAINER || "hermes-agent-zgqu-hermes-agent-1";

interface Bot {
  id: string;
  name: string;
  emoji: string;
  role: string;
  profile: string;
  alive: boolean;
  home: "mac" | "vps";
}

const FLEET: Omit<Bot, "alive">[] = [
  { id: "pepe", name: "페페", emoji: "🐸", role: "총괄비서 · 함대 지휘", profile: "slack2", home: "vps" },
  { id: "rei", name: "레이", emoji: "🦅", role: "전시 대행 · 가시광선", profile: "default", home: "vps" },
  { id: "vir", name: "비르", emoji: "✍️", role: "콘텐츠 · 리서치", profile: "publisher", home: "vps" },
  { id: "johnny", name: "조니", emoji: "🎨", role: "제품 이미지 · 스튜디오", profile: "studio-ops", home: "vps" },
];

let cache: { at: number; bots: Bot[] } | null = null;
const TTL = 60_000;

async function probeVps(): Promise<Record<string, boolean>> {
  const script = `docker exec ${CONTAINER} sh -lc 'for P in default slack2 publisher studio-ops; do if ps aux | grep -v grep | grep -qE "profile $P gateway|gateway run.*$P"; then echo "$P:1"; elif [ "$P" = default ] && ps aux|grep -v grep|grep -q "hermes gateway"; then echo "$P:1"; else echo "$P:0"; fi; done'`;
  const { stdout } = await execFileP(
    "ssh",
    ["-i", SSH_KEY, "-o", "ConnectTimeout=12", "-o", "StrictHostKeyChecking=no", `root@${VPS_IP}`, script],
    { timeout: 20000, maxBuffer: 1024 * 1024 }
  );
  const map: Record<string, boolean> = {};
  for (const line of stdout.split("\n")) {
    const m = line.match(/(\w[\w-]*):([01])/);
    if (m) map[m[1]] = m[2] === "1";
  }
  return map;
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ ok: true, cached: true, bots: cache.bots });
  }
  try {
    const map = await probeVps();
    const bots: Bot[] = FLEET.map((b) => ({ ...b, alive: map[b.profile] ?? false }));
    cache = { at: Date.now(), bots };
    return NextResponse.json({ ok: true, cached: false, bots });
  } catch (e) {
    // VPS 조회 실패 → 알수없음(null 대신 false)으로 표시하되 에러 플래그
    const bots: Bot[] = FLEET.map((b) => ({ ...b, alive: false }));
    const msg = e instanceof Error ? e.message : "VPS 조회 실패";
    return NextResponse.json({ ok: false, error: msg, bots }, { status: 200 });
  }
}
