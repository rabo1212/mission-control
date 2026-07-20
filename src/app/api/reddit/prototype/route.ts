/**
 * 프로토타입 HTML 서빙 — /api/reddit/prototype?path=2026-W29/xxx/index.html
 * ~/reddit-demand-sniper/prototypes/ 안의 파일만 서빙 (경로탈출 방지).
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

const BASE =
  process.env.REDDIT_SNIPER_PATH ||
  path.join(os.homedir(), "reddit-demand-sniper");
const PROTOTYPES_DIR = path.resolve(path.join(BASE, "prototypes"));

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path");
  if (!rel) return new NextResponse("path required", { status: 400 });

  const target = path.resolve(path.join(PROTOTYPES_DIR, rel));
  // 경로탈출 방지
  if (target !== PROTOTYPES_DIR && !target.startsWith(PROTOTYPES_DIR + path.sep))
    return new NextResponse("Forbidden", { status: 403 });

  try {
    const stat = fs.statSync(target);
    if (!stat.isFile()) return new NextResponse("Not Found", { status: 404 });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(target).toLowerCase();
  const body = fs.readFileSync(target);
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
